import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Mail, Trash2, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProfileWithApproval = Tables<"profiles">;

interface DeletedUsersTabProps {
  refreshSignal: number;
  onPermanentDelete: () => void;
}

export function DeletedUsersTab({ refreshSignal, onPermanentDelete }: DeletedUsersTabProps) {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileWithApproval[]>([]);
  const [deletedByNames, setDeletedByNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [purgeTarget, setPurgeTarget] = useState<ProfileWithApproval | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [purging, setPurging] = useState(false);

  const fetchDeletedProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) throw error;

      const deleted = data || [];
      setProfiles(deleted);

      // Resolve the admins who performed each deletion
      const deleterIds = [...new Set(deleted.map((p) => p.deleted_by).filter(Boolean))] as string[];

      if (deleterIds.length) {
        const { data: deleters } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, email")
          .in("user_id", deleterIds);

        setDeletedByNames(
          Object.fromEntries(
            (deleters || []).map((d) => [
              d.user_id,
              [d.first_name, d.last_name].filter(Boolean).join(" ") || d.email || "Unknown",
            ])
          )
        );
      } else {
        setDeletedByNames({});
      }
    } catch (error) {
      console.error("Error fetching deleted profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load deleted users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDeletedProfiles();
  }, [fetchDeletedProfiles, refreshSignal]);

  const filteredProfiles = useMemo(() => {
    if (!searchTerm) return profiles;

    const search = searchTerm.toLowerCase();
    return profiles.filter((profile) => {
      const name = `${profile.first_name || ""} ${profile.last_name || ""}`.toLowerCase();
      return (
        name.includes(search) ||
        profile.email?.toLowerCase().includes(search) ||
        profile.organization?.toLowerCase().includes(search)
      );
    });
  }, [profiles, searchTerm]);

  const closePurgeModal = () => {
    setPurgeTarget(null);
    setConfirmText("");
  };

  const confirmPurge = async () => {
    if (!purgeTarget) return;

    setPurging(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: purgeTarget.user_id },
      });

      if (error) {
        // supabase-js turns any non-2xx into a generic error; the real reason is
        // in the response body it hangs off `context`.
        let message = error.message;
        const context = (error as { context?: Response }).context;
        if (context && typeof context.json === "function") {
          try {
            const body = await context.json();
            if (body?.error) message = body.error;
          } catch {
            // keep the generic message
          }
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);

      toast({
        title: "User Permanently Deleted",
        description: `${purgeTarget.email} has been removed completely and can sign up again as a new user.`,
      });

      closePurgeModal();
      await fetchDeletedProfiles();
      onPermanentDelete();
    } catch (error) {
      console.error("Error permanently deleting user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to permanently delete user",
        variant: "destructive",
      });
    } finally {
      setPurging(false);
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) =>
    `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();

  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading deleted users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              These profiles are hidden from all lists and directories, but their accounts still exist.
            </p>
            <p className="text-muted-foreground mt-1">
              Permanently deleting removes the profile, the login credentials, the avatar and all
              related records. It cannot be undone — but it does free the email address, so the
              person can sign up again from scratch.
            </p>
          </div>
        </CardContent>
      </Card>

      <Input
        placeholder="Search deleted users by name, email or organization..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      <div className="text-sm text-muted-foreground">
        Showing {filteredProfiles.length} of {profiles.length} deleted users
      </div>

      {filteredProfiles.map((profile) => (
        <Card key={profile.id}>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <Avatar className="w-12 h-12 flex-shrink-0 opacity-60">
                <AvatarImage src={profile.avatar_url || ""} alt={`${profile.first_name} ${profile.last_name}`} />
                <AvatarFallback>{getInitials(profile.first_name, profile.last_name)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    was {profile.approval_status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Deleted {formatDate(profile.deleted_at)}
                  {profile.deleted_by && deletedByNames[profile.deleted_by]
                    ? ` by ${deletedByNames[profile.deleted_by]}`
                    : ""}
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPurgeTarget(profile)}
              className="flex-shrink-0"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Permanently Delete
            </Button>
          </CardContent>
        </Card>
      ))}

      {filteredProfiles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <UserX className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No matching deleted users" : "No deleted users"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try a different search term."
                : "Profiles you delete from the other tabs will appear here."}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={purgeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !purging) closePurgeModal();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Permanently Delete User</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p>
                  This permanently removes{" "}
                  <span className="font-medium text-foreground">
                    {purgeTarget?.first_name} {purgeTarget?.last_name}
                  </span>
                  , including their login credentials, profile picture, change history, saved
                  directory and starred members. This cannot be undone.
                </p>
                <p>
                  <span className="font-medium text-foreground">{purgeTarget?.email}</span> will be
                  released and can be used to sign up again as a brand new member.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              Type the email address to confirm
            </Label>
            <Input
              id="confirm-email"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={purgeTarget?.email || ""}
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={closePurgeModal} disabled={purging}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmPurge}
              disabled={purging || confirmText.trim().toLowerCase() !== (purgeTarget?.email || "").toLowerCase()}
            >
              {purging ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
