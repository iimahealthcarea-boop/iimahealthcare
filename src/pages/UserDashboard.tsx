import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Edit,
  Users,
  AlertTriangle,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import MemberDirectory from "@/components/MemberDirectory";

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [issueMessage, setIssueMessage] = useState("");
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);

  const profile = user?.profile;

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

  return (
    <div className="min-h-screen bg-background">
      <Header showUserInfo={true} showSignOut={true} />

      <main className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome, {profile?.first_name}!
              </h1>
              <p className="text-muted-foreground">
                Connect with fellow alumni and explore the directory
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              <Dialog
                open={isIssueDialogOpen}
                onOpenChange={setIsIssueDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Raise an Issue
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Report an Issue</DialogTitle>
                    <DialogDescription>
                      Describe the issue you're experiencing and we'll get back
                      to you as soon as possible.
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
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsIssueDialogOpen(false);
                          setIssueMessage("");
                        }}
                        disabled={isSubmittingIssue}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleIssueSubmission}
                        disabled={isSubmittingIssue || !issueMessage.trim()}
                      >
                        {isSubmittingIssue ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Issue
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <MemberDirectory />
      </main>
    </div>
  );
}
