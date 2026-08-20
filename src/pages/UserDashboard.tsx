import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useStarredProfiles } from "@/hooks/useStarredProfiles";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import DirectoryTab from "@/components/DirectoryTab";
import AllMembersTab from "@/components/AllMembersTab";
import MemberDetailsDialog from "@/components/MemberDetailsDialog";
import UserBottomNav, { UserSection } from "@/components/user/UserBottomNav";
import HomeSection, { HomeTab } from "@/components/user/HomeSection";
import ProfileSection from "@/components/user/ProfileSection";
import WelcomeSplash from "@/components/user/WelcomeSplash";
import EventCard from "@/components/user/EventCard";
import { useActiveEvent } from "@/hooks/useActiveEvent";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

/** Session marker holding the user id already greeted by the welcome splash. */
const SPLASH_KEY = "iima_welcomed_user";

interface DirectoryItem {
  profiles: Profile;
  member_id: string;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [section, setSection] = useState<UserSection>("home");
  // Welcome splash plays once per login. The stored marker is the signed-in
  // user id, so a new sign-in (or a different user) replays it, while moving
  // around the dashboard within the same session does not.
  const [showSplash, setShowSplash] = useState(false);
  const [homeTab, setHomeTab] = useState<HomeTab>("all");
  const [issueMessage, setIssueMessage] = useState("");
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);

  // Directory / member state (previously owned by MemberDirectory).
  const [userDirectoryIds, setUserDirectoryIds] = useState<Set<string>>(new Set());
  const [directoryMembers, setDirectoryMembers] = useState<DirectoryItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [allMembers, setAllMembers] = useState<Profile[]>([]);
  const [recentMembers, setRecentMembers] = useState<Profile[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const profile = user?.profile;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Temporary event announcement (visibility is decided server-side).
  const {
    event: activeEvent,
    rsvp,
    rsvpPending,
    enableReminder,
    reminderPending,
  } = useActiveEvent(!!user);

  // Single shared starred-profiles instance, passed down to both tabs.
  const starredProfilesHook = useStarredProfiles();
  const { isStarred } = starredProfilesHook;

  useEffect(() => {
    if (user) {
      starredProfilesHook.fetchStarredProfiles();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDirectoryMembers = useCallback(async () => {
    if (!user) return;

    try {
      setDirectoryLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("No access token");
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/directory-get`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      const directoryData: DirectoryItem[] = result.data || [];
      setDirectoryMembers(directoryData);

      const ids = new Set<string>();
      directoryData.forEach((item) => {
        if (item.member_id) {
          ids.add(item.member_id);
        }
      });
      setUserDirectoryIds(ids);
    } catch (error) {
      console.error("Error fetching directory:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your directory",
        variant: "destructive",
      });
    } finally {
      setDirectoryLoading(false);
    }
  }, [user, toast, supabaseUrl]);

  useEffect(() => {
    if (user) {
      fetchDirectoryMembers();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Approved public alumni, fetched once here so Home can show accurate counts
  // and "Recently Joined" without waiting for the Directory section to mount.
  useEffect(() => {
    let cancelled = false;

    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("approval_status", "approved")
          .eq("is_public", true)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!cancelled) {
          setAllMembers(data || []);
          setRecentMembers((data || []).slice(0, 8));
        }
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    };

    if (user) fetchMembers();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Show the splash when this user hasn't been greeted in this session yet.
  useEffect(() => {
    if (!user?.id) return;
    if (sessionStorage.getItem(SPLASH_KEY) !== user.id) {
      setShowSplash(true);
    }
  }, [user?.id]);

  // Sections swap content in place rather than changing route, so the window
  // keeps its scroll offset — switching from a long list would otherwise land
  // the user mid-page. Reset to the top whenever the section changes.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [section]);

  const handleMemberDetails = (member: Profile) => {
    setSelectedMember(member);
    setIsDetailsDialogOpen(true);
  };

  const handleIssueSubmission = async () => {
    if (!issueMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message describing your issue",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingIssue(true);
    try {
      const { error } = await supabase.functions.invoke("send-issue-email", {
        body: {
          type: "issue",
          email: profile?.email || user?.email,
          message: issueMessage,
          profileDetails: {
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            organization: profile?.organization,
            position: profile?.position,
            phone: profile?.phone,
            program: profile?.program,
            graduation_year: profile?.graduation_year,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Issue Submitted Successfully",
        description:
          "Your issue has been reported to the admin team. We'll get back to you soon.",
      });

      setIssueMessage("");
      setIsIssueDialogOpen(false);
    } catch (error) {
      console.error("Error submitting issue:", error);
      toast({
        title: "Error",
        description: "Failed to submit issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // Shared dialog: its trigger is rendered inside HomeSection's action grid.
  const issueDialog = (
    <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="min-w-0 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-foreground/80 sm:mt-0.5" />
            <div className="min-w-0">
              <div className="break-words font-semibold">Raise an Issue</div>
              <div className="break-words text-xs text-muted-foreground sm:text-sm">
                Get help from admin
              </div>
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Describe the issue you're experiencing and we'll get back to you as soon as
            possible.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="issue-message">Issue Description</Label>
            <Textarea
              id="issue-message"
              value={issueMessage}
              onChange={(e) => setIssueMessage(e.target.value)}
              placeholder="Please describe the issue you're facing..."
              rows={4}
              className="mt-1"
            />
          </div>
          {/* Stacked on very small screens so neither button is clipped */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setIsIssueDialogOpen(false);
                setIssueMessage("");
              }}
              disabled={isSubmittingIssue}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={handleIssueSubmission}
              disabled={isSubmittingIssue || !issueMessage.trim()}
            >
              {isSubmittingIssue ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4 flex-shrink-0" />
                  Submit Issue
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const dismissSplash = useCallback(() => {
    if (user?.id) {
      sessionStorage.setItem(SPLASH_KEY, user.id);
    }
    setShowSplash(false);
  }, [user?.id]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      {showSplash && (
        <WelcomeSplash firstName={profile?.first_name} onFinish={dismissSplash} />
      )}

      <Header showUserInfo={true} showSignOut={true} />

      {/* Bottom padding clears the fixed mobile navbar + global banner. */}
      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-32 sm:px-6 sm:py-6 lg:pb-8">
        <UserBottomNav active={section} onChange={setSection} />

        {section === "home" && (
          <HomeSection
            firstName={profile?.first_name}
            recentMembers={recentMembers}
            recentLoading={recentLoading}
            totalMembers={allMembers.length}
            shownMembers={
              homeTab === "all" ? allMembers.length : directoryMembers.length
            }
            isStarred={isStarred}
            activeTab={homeTab}
            onTabChange={(tab) => {
              setHomeTab(tab);
              setSection(tab === "all" ? "directory" : "network");
            }}
            onOpenDirectory={() => setSection("directory")}
            onOpenProfile={() => navigate("/profile")}
            onViewMember={handleMemberDetails}
            issueTrigger={issueDialog}
          />
        )}

        {section === "directory" && (
          <AllMembersTab
            onMemberDetails={handleMemberDetails}
            userDirectoryIds={userDirectoryIds}
            onDirectoryUpdate={fetchDirectoryMembers}
            starredProfiles={starredProfilesHook}
          />
        )}

        {section === "network" && (
          <DirectoryTab
            onMemberDetails={handleMemberDetails}
            directoryMembers={directoryMembers}
            loading={directoryLoading}
            onRemoveFromDirectory={fetchDirectoryMembers}
            starredProfiles={starredProfilesHook}
          />
        )}

        {section === "profile" && (
          <ProfileSection profile={profile} email={user?.email} />
        )}
      </main>

      {/* Event announcement modal — held back until the welcome splash clears. */}
      {activeEvent && !showSplash && (
        <EventCard
          event={activeEvent}
          onRsvp={rsvp}
          rsvpPending={rsvpPending}
          onEnableReminder={enableReminder}
          reminderPending={reminderPending}
        />
      )}

      <MemberDetailsDialog
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        member={selectedMember}
      />
    </div>
  );
}
