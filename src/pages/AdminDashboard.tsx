import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  User,
  Download,
  RefreshCw,
  Edit,
  Save,
  X,
  UserPlus,
  History,
} from "lucide-react";
import { 
  addProfileChange, 
  getChangedFields, 
  getUserName,
  ProfileChange 
} from "@/utils/profileChangeTracker";
import { ProfileChangeTimeline } from "@/components/ProfileChangeTimeline";
import * as XLSX from "xlsx";
import { Navigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import { useCountries } from "@/hooks/useCountries";
import CountrySelector from "@/components/CountrySelector";
import { OrganizationSelector } from "@/components/OrganizationSelector";

type ProfileWithApproval = Tables<"profiles">;

type OrganizationType =
  | "Hospital/Clinic"
  | "HealthTech"
  | "Pharmaceutical"
  | "Biotech"
  | "Medical Devices"
  | "Consulting"
  | "Public Health/Policy"
  | "Health Insurance"
  | "Academic/Research"
  | "Startup"
  | "VC"
  | "Other";

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] =
    useState<ProfileWithApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<ProfileWithApproval | null>(null);
  const [editFormData, setEditFormData] = useState<
    Partial<ProfileWithApproval>
  >({});
  const [editLoading, setEditLoading] = useState(false);
  const [interestsInput, setInterestsInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberFormData, setAddMemberFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    country_code: "+91",
  });
  const { countries, loading: countriesLoading } = useCountries();

  console.log("addMemberFormData", addMemberFormData);
  console.log("countries", countries);

  const [showPassword, setShowPassword] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineProfile, setTimelineProfile] = useState<ProfileWithApproval | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
    }
  }, [isAdmin, fetchProfiles]);

  // Redirect if not admin
  if (!isAdmin && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleRefresh = async () => {
    setLoading(true);
    await fetchProfiles();
    toast({
      title: "Refreshed",
      description: "Profile list has been updated",
    });
  };

  const handleApprove = async (profileUserId: string) => {
    setActionLoading(true);
    try {
      // Get user profile details before approval
      const profile = profiles.find((p) => p.user_id === profileUserId);
      if (!profile) {
        throw new Error("Profile not found");
      }

      // Track approval change
      const changedFields = {
        approval_status: {
          oldValue: profile.approval_status,
          newValue: 'approved'
        }
      };

      const adminName = user?.email || 'Admin';
      await addProfileChange(
        profileUserId,
        user?.id || '',
        adminName,
        changedFields,
        'approve'
      );

      // Approve the profile
      const { error } = await supabase.rpc("approve_user_profile", {
        profile_user_id: profileUserId,
      });

      if (error) throw error;

      // Send approval email
      try {
        const { error: emailError } = await supabase.functions.invoke(
          "send-approval-email",
          {
            body: {
              email: profile.email,
              name: `${profile.first_name} ${profile.last_name}`,
              status: "approved",
            },
          }
        );

        if (emailError) {
          console.error("Email sending failed:", emailError);
          // Don't fail the approval if email fails, just log it
        }
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the approval if email fails
      }

      toast({
        title: "Profile Approved",
        description:
          "The user profile has been approved and notification email sent.",
      });

      await fetchProfiles();
      setSelectedProfile(null);
    } catch (error) {
      console.error("Error approving profile:", error);
      toast({
        title: "Error",
        description: "Failed to approve profile",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (profileUserId: string) => {
    setActionLoading(true);
    try {
      // Get user profile details before rejection
      const profile = profiles.find((p) => p.user_id === profileUserId);
      if (!profile) {
        throw new Error("Profile not found");
      }

      // Track rejection change
      const changedFields = {
        approval_status: {
          oldValue: profile.approval_status,
          newValue: 'rejected'
        },
        rejection_reason: {
          oldValue: profile.rejection_reason,
          newValue: rejectionReason
        }
      };

      const adminName = user?.email || 'Admin';
      await addProfileChange(
        profileUserId,
        user?.id || '',
        adminName,
        changedFields,
        'reject'
      );

      // Reject the profile
      const { error } = await supabase.rpc("reject_user_profile", {
        profile_user_id: profileUserId,
        reason: rejectionReason,
      });

      if (error) throw error;

      // Send rejection email
      try {
        const { error: emailError } = await supabase.functions.invoke(
          "send-approval-email",
          {
            body: {
              email: profile.email,
              name: `${profile.first_name} ${profile.last_name}`,
              status: "rejected",
              reason: rejectionReason,
            },
          }
        );

        if (emailError) {
          console.error("Email sending failed:", emailError);
          // Don't fail the rejection if email fails, just log it
        }
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the rejection if email fails
      }

      toast({
        title: "Profile Rejected",
        description:
          "The user profile has been rejected and notification email sent.",
      });

      await fetchProfiles();
      setSelectedProfile(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting profile:", error);
      toast({
        title: "Error",
        description: "Failed to reject profile",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePublicStatus = async (
    profileUserId: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_public: !currentStatus })
        .eq("user_id", profileUserId);

      if (error) throw error;

      // Update local state immediately for better UX
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.user_id === profileUserId
            ? { ...profile, is_public: !currentStatus }
            : profile
        )
      );

      toast({
        title: "Profile Visibility Updated",
        description: `Profile is now ${!currentStatus ? "public" : "private"}`,
      });
    } catch (error) {
      console.error("Error updating profile visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update profile visibility",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (profile: ProfileWithApproval) => {
    setEditingProfile(profile);
    setEditFormData({ ...profile });
    setInterestsInput(profile.interests?.join(", ") || "");
    setSkillsInput(profile.skills?.join(", ") || "");
    setIsEditDialogOpen(true);
  };

  const openTimeline = (profile: ProfileWithApproval) => {
    setTimelineProfile(profile);
    setIsTimelineOpen(true);
  };

  const handleEditProfile = async () => {
    if (!editingProfile) return;

    setEditLoading(true);
    try {
      const interests = interestsInput
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const skills = skillsInput
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const updatedData = {
        ...editFormData,
        interests,
        skills,
      };

      // Track changes before updating
      const changedFields = getChangedFields(editingProfile, updatedData);
      
      if (Object.keys(changedFields).length > 0) {
        const adminName = user?.email || 'Admin';
        await addProfileChange(
          editingProfile.user_id,
          user?.id || '',
          adminName,
          changedFields,
          'admin_edit'
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("user_id", editingProfile.user_id);

      if (error) throw error;

      // Update local state
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.user_id === editingProfile.user_id
            ? { ...profile, ...updatedData }
            : profile
        )
      );

      toast({
        title: "Profile Updated",
        description: "Profile has been successfully updated",
      });

      setIsEditDialogOpen(false);
      setEditingProfile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (
      !addMemberFormData.first_name ||
      !addMemberFormData.last_name ||
      !addMemberFormData.email ||
      !addMemberFormData.password
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (addMemberFormData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setAddMemberLoading(true);
    try {
      // Create user using Supabase Edge Function
      const { data, error } = await supabase.functions.invoke(
        "admin-create-user",
        {
          body: {
            first_name: addMemberFormData.first_name,
            last_name: addMemberFormData.last_name,
            email: addMemberFormData.email,
            password: addMemberFormData.password,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Member Added Successfully",
          description: `${addMemberFormData.first_name} ${addMemberFormData.last_name} has been added and approved.`,
        });

        // Reset form and close dialog
        setAddMemberFormData({
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          phone: "",
          country_code: "+91",
        });
        setShowPassword(false);
        setIsAddMemberDialogOpen(false);

        // Refresh profiles list
        await fetchProfiles();
      } else {
        throw new Error(data?.error || "Failed to create user");
      }
    } catch (error: unknown) {
      console.error("Error adding member:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add member";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAddMemberLoading(false);
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStats = () => {
    const pending = profiles.filter(
      (p) => p.approval_status === "pending"
    ).length;
    const approved = profiles.filter(
      (p) => p.approval_status === "approved"
    ).length;
    const rejected = profiles.filter(
      (p) => p.approval_status === "rejected"
    ).length;
    return { pending, approved, rejected, total: profiles.length };
  };

  const stats = getStats();

  const exportToExcel = () => {
    try {
      // Get all approved profiles for export
      const approvedProfiles = profiles.filter(
        (p) => p.approval_status === "approved"
      );

      // Prepare data for Excel export
      const excelData = approvedProfiles.map((profile) => ({
        Name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
        Email: profile.email || "",
        Phone: profile.phone || "",
        Organization: profile.organization || "",
        Position: profile.position || "",
        Program: profile.program || "",
        "Experience Level": profile.experience_level || "",
        "Organization Type": profile.organization_type || "",
        City: profile.city || "",
        Country: profile.country || "",
        Address: profile.address || "",
        "Date of Birth": profile.date_of_birth || "",
        "Graduation Year": profile.graduation_year || "",
        LinkedIn: profile.linkedin_url || "",
        Website: profile.website_url || "",
        Bio: profile.bio || "",
        Skills: profile.skills ? profile.skills.join(", ") : "",
        Interests: profile.interests ? profile.interests.join(", ") : "",
        "Emergency Contact Name": profile.emergency_contact_name || "",
        "Emergency Contact Phone": profile.emergency_contact_phone || "",
        "Approved Date": profile.approved_at
          ? new Date(profile.approved_at).toLocaleDateString()
          : "",
        "Registration Date": new Date(profile.created_at).toLocaleDateString(),
        Status: profile.status || "",
        "Public Profile": profile.is_public ? "Yes" : "No",
        "Show Contact Info": profile.show_contact_info ? "Yes" : "No",
        "Show Location": profile.show_location ? "Yes" : "No",
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 20 }, // Organization
        { wch: 20 }, // Position
        { wch: 15 }, // Program
        { wch: 15 }, // Experience Level
        { wch: 15 }, // Organization Type
        { wch: 15 }, // City
        { wch: 15 }, // Country
        { wch: 30 }, // Address
        { wch: 12 }, // Date of Birth
        { wch: 12 }, // Graduation Year
        { wch: 30 }, // LinkedIn
        { wch: 30 }, // Website
        { wch: 50 }, // Bio
        { wch: 30 }, // Skills
        { wch: 30 }, // Interests
        { wch: 20 }, // Emergency Contact Name
        { wch: 18 }, // Emergency Contact Phone
        { wch: 12 }, // Approved Date
        { wch: 15 }, // Registration Date
        { wch: 10 }, // Status
        { wch: 12 }, // Public Profile
        { wch: 15 }, // Show Contact Info
        { wch: 15 }, // Show Location
      ];
      worksheet["!cols"] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

      // Generate filename with current date
      const today = new Date();
      const filename = `members_export_${today.getFullYear()}-${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `${approvedProfiles.length} member records exported to ${filename}`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export member data to Excel",
        variant: "destructive",
      });
    }
  };

  const renderProfileCard = (profile: ProfileWithApproval) => (
    <Card key={profile.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/10 flex-shrink-0">
              <AvatarImage
                src={profile.avatar_url || ""}
                alt={`${profile.first_name} ${profile.last_name}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {profile.first_name} {profile.last_name}
              </CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </div>
          </div>
          {getStatusBadge(profile.approval_status || "pending")}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {profile.organization && (
            <p>
              <strong>Organization:</strong> {profile.organization}
            </p>
          )}
          {profile.position && (
            <p>
              <strong>Position:</strong> {profile.position}
            </p>
          )}
          {profile.phone && (
            <p>
              <strong>Phone:</strong> {profile.phone}
            </p>
          )}
          <p>
            <strong>Registered:</strong>{" "}
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
          {profile.approval_status === "approved" && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">Public Profile</span>
              <Switch
                checked={profile.is_public || false}
                onCheckedChange={() =>
                  handleTogglePublicStatus(
                    profile.user_id,
                    profile.is_public || false
                  )
                }
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProfile(profile)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                    <AvatarImage
                      src={profile.avatar_url || ""}
                      alt={`${profile.first_name} ${profile.last_name}`}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(profile.first_name, profile.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>
                      Profile Details - {profile.first_name} {profile.last_name}
                    </DialogTitle>
                    <DialogDescription>
                      Complete profile information for review
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {selectedProfile && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="font-semibold mb-2">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Name:</strong> {selectedProfile.first_name}{" "}
                        {selectedProfile.last_name}
                      </div>
                      <div>
                        <strong>Email:</strong> {selectedProfile.email}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedProfile.phone}
                      </div>
                      <div>
                        <strong>Date of Birth:</strong>{" "}
                        {selectedProfile.date_of_birth || "Not provided"}
                      </div>
                      <div className="col-span-2">
                        <strong>Address:</strong> {selectedProfile.address}
                      </div>
                      <div>
                        <strong>City:</strong> {selectedProfile.city}
                      </div>
                      <div>
                        <strong>Country:</strong> {selectedProfile.country}
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h4 className="font-semibold mb-2">Emergency Contact</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Name:</strong>{" "}
                        {selectedProfile.emergency_contact_name}
                      </div>
                      <div>
                        <strong>Phone:</strong>{" "}
                        {selectedProfile.emergency_contact_phone}
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div>
                    <h4 className="font-semibold mb-2">
                      Professional Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Organization:</strong>{" "}
                        {selectedProfile.organization}
                      </div>
                      <div>
                        <strong>Position:</strong> {selectedProfile.position}
                      </div>
                      <div>
                        <strong>Experience:</strong>{" "}
                        {selectedProfile.experience_level}
                      </div>
                      <div>
                        <strong>Org Type:</strong>{" "}
                        {selectedProfile.organization_type}
                      </div>
                      <div>
                        <strong>Program:</strong> {selectedProfile.program}
                      </div>
                      <div>
                        <strong>Graduation Year:</strong>{" "}
                        {selectedProfile.graduation_year}
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h4 className="font-semibold mb-2">
                      Additional Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedProfile.bio && (
                        <div>
                          <strong>Bio:</strong> {selectedProfile.bio}
                        </div>
                      )}
                      {selectedProfile.skills && (
                        <div>
                          <strong>Skills:</strong>{" "}
                          {selectedProfile.skills.join(", ")}
                        </div>
                      )}
                      {selectedProfile.interests && (
                        <div>
                          <strong>Interests:</strong>{" "}
                          {selectedProfile.interests.join(", ")}
                        </div>
                      )}
                      {selectedProfile.linkedin_url && (
                        <div>
                          <strong>LinkedIn:</strong>{" "}
                          <a
                            href={selectedProfile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedProfile.linkedin_url}
                          </a>
                        </div>
                      )}
                      {selectedProfile.website_url && (
                        <div>
                          <strong>Website:</strong>{" "}
                          <a
                            href={selectedProfile.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedProfile.website_url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Privacy Settings - Only show for approved profiles */}
                  {selectedProfile.approval_status === "approved" && (
                    <div>
                      <h4 className="font-semibold mb-2">Privacy Settings</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="is_public">Public Profile</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow others to see this profile in the directory
                            </p>
                          </div>
                          <Switch
                            id="is_public"
                            checked={selectedProfile.is_public || false}
                            onCheckedChange={() =>
                              handleTogglePublicStatus(
                                selectedProfile.user_id,
                                selectedProfile.is_public || false
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="show_contact_info">
                              Show Contact Information
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Display email, phone, and LinkedIn to other users
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {selectedProfile.show_contact_info ? "Yes" : "No"}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="show_location">Show Location</Label>
                            <p className="text-sm text-muted-foreground">
                              Display location information to other users
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {selectedProfile.show_location ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions for pending profiles */}
                  {selectedProfile.approval_status === "pending" && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(selectedProfile.user_id)}
                          disabled={actionLoading}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rejection-reason">
                          Rejection Reason (optional)
                        </Label>
                        <Textarea
                          id="rejection-reason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide a reason for rejection (optional)..."
                        />
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(selectedProfile.user_id)}
                          disabled={actionLoading}
                          className="w-full"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show rejection reason if rejected */}
                  {selectedProfile.approval_status === "rejected" &&
                    selectedProfile.rejection_reason && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-600">
                          Rejection Reason
                        </h4>
                        <p className="text-sm">
                          {selectedProfile.rejection_reason}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </DialogContent>
          </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => openTimeline(profile)}
              className="flex-1"
            >
              <History className="w-4 h-4 mr-1" />
              Timeline
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDialog(profile)}
            className="w-full"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit Profile
          </Button>

          {profile.approval_status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(profile.user_id)}
                disabled={actionLoading}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReject(profile.user_id)}
                disabled={actionLoading}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showUserInfo={true} showSignOut={true} />

      <main className="p-6 max-w-6xl mx-auto">
        {/* Header with Profile Link and Export */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage user profiles and applications
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddMemberDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Link to="/profile">
              <Button variant="outline">
                <User className="w-4 h-4 mr-2" />
                My Profile
              </Button>
            </Link>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Profiles List */}
        <Tabs defaultValue="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({stats.rejected})
              </TabsTrigger>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles
                .filter((p) => p.approval_status === "pending")
                .map(renderProfileCard)}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles
                .filter((p) => p.approval_status === "approved")
                .map(renderProfileCard)}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles
                .filter((p) => p.approval_status === "rejected")
                .map(renderProfileCard)}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map(renderProfileCard)}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                <AvatarImage
                  src={editingProfile?.avatar_url || ""}
                  alt={`${editingProfile?.first_name} ${editingProfile?.last_name}`}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(
                    editingProfile?.first_name,
                    editingProfile?.last_name
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Profile - {editingProfile?.first_name}{" "}
                  {editingProfile?.last_name}
                </DialogTitle>
                <DialogDescription>
                  Modify any profile details below. Changes will be saved
                  immediately.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editingProfile && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-first_name">First Name</Label>
                    <Input
                      id="edit-first_name"
                      value={editFormData.first_name || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          first_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-last_name">Last Name</Label>
                    <Input
                      id="edit-last_name"
                      value={editFormData.last_name || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          last_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editFormData.phone || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-date_of_birth">Date of Birth</Label>
                    <Input
                      id="edit-date_of_birth"
                      type="date"
                      value={editFormData.date_of_birth || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={editFormData.city || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-country">Country</Label>
                    <Input
                      id="edit-country"
                      value={editFormData.country || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          country: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Textarea
                      id="edit-address"
                      value={editFormData.address || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-organization">Organization</Label>
                    {/* <Input
                      id="edit-organization"
                      value={editFormData.organization || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          organization: e.target.value,
                        })
                      }
                    /> */}
                    <OrganizationSelector
                  value={editFormData.organization || ""}
                  onChange={(value) => setEditFormData({ ...editFormData, organization: value })}
                  placeholder="Search or add organization..."
                />
                  </div>
                  <div>
                    <Label htmlFor="edit-position">Position</Label>
                    <Input
                      id="edit-position"
                      value={editFormData.position || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          position: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-experience_level">
                      Experience Level
                    </Label>
                    <Select
                      value={editFormData.experience_level || ""}
                      onValueChange={(value) =>
                        setEditFormData({
                          ...editFormData,
                          experience_level: value as
                            | "Student"
                            | "Recent Graduate"
                            | "Entry Level"
                            | "Mid Level"
                            | "Senior Level"
                            | "Executive",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Recent Graduate">
                          Recent Graduate
                        </SelectItem>
                        <SelectItem value="Entry Level">Entry Level</SelectItem>
                        <SelectItem value="Mid Level">Mid Level</SelectItem>
                        <SelectItem value="Senior Level">
                          Senior Level
                        </SelectItem>
                        <SelectItem value="Executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-organization_type">
                      Organization Type
                    </Label>
                    <Select
                      value={editFormData.organization_type || ""}
                       onValueChange={(value) =>
                         setEditFormData({
                           ...editFormData,
                           organization_type: value as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                         })
                       }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hospital/Clinic">
                          Hospital/Clinic
                        </SelectItem>
                        <SelectItem value="HealthTech">HealthTech</SelectItem>
                        <SelectItem value="Pharmaceutical">
                          Pharmaceutical
                        </SelectItem>
                        <SelectItem value="Biotech">Biotech</SelectItem>
                        <SelectItem value="Medical Devices">
                          Medical Devices
                        </SelectItem>
                        <SelectItem value="Consulting">Consulting</SelectItem>
                        <SelectItem value="Public Health/Policy">
                          Public Health/Policy
                        </SelectItem>
                        <SelectItem value="Health Insurance">
                          Health Insurance
                        </SelectItem>
                        <SelectItem value="Academic/Research">
                          Academic/Research
                        </SelectItem>
                        <SelectItem value="Startup">Startup</SelectItem>
                        <SelectItem value="VC">VC</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-program">Program</Label>
                    <Input
                      id="edit-program"
                      value={editFormData.program || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          program: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-graduation_year">
                      Graduation Year
                    </Label>
                    <Input
                      id="edit-graduation_year"
                      type="number"
                      value={editFormData.graduation_year || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          graduation_year: parseInt(e.target.value) || null,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Additional Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-bio">Bio</Label>
                    <Textarea
                      id="edit-bio"
                      value={editFormData.bio || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          bio: e.target.value,
                        })
                      }
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-skills">
                      Skills (comma-separated)
                    </Label>
                    <Input
                      id="edit-skills"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="JavaScript, React, Python..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-interests">
                      Interests (comma-separated)
                    </Label>
                    <Input
                      id="edit-interests"
                      value={interestsInput}
                      onChange={(e) => setInterestsInput(e.target.value)}
                      placeholder="Technology, Travel, Sports..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-linkedin_url">LinkedIn URL</Label>
                      <Input
                        id="edit-linkedin_url"
                        value={editFormData.linkedin_url || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            linkedin_url: e.target.value,
                          })
                        }
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-website_url">Website URL</Label>
                      <Input
                        id="edit-website_url"
                        value={editFormData.website_url || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            website_url: e.target.value,
                          })
                        }
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="edit-is_public">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see this profile in the directory
                      </p>
                    </div>
                    <Switch
                      id="edit-is_public"
                      checked={editFormData.is_public || false}
                      onCheckedChange={(checked) =>
                        setEditFormData({ ...editFormData, is_public: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="edit-show_contact_info">
                        Show Contact Information
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Display email, phone, and LinkedIn to other users
                      </p>
                    </div>
                    <Switch
                      id="edit-show_contact_info"
                      checked={editFormData.show_contact_info || false}
                      onCheckedChange={(checked) =>
                        setEditFormData({
                          ...editFormData,
                          show_contact_info: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="edit-show_location">Show Location</Label>
                      <p className="text-sm text-muted-foreground">
                        Display location information to other users
                      </p>
                    </div>
                    <Switch
                      id="edit-show_location"
                      checked={editFormData.show_location || false}
                      onCheckedChange={(checked) =>
                        setEditFormData({
                          ...editFormData,
                          show_location: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={editLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleEditProfile} disabled={editLoading}>
                  {editLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog
        open={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Member
            </DialogTitle>
            <DialogDescription>
              Create a new member account. The member will be automatically
              approved and can log in immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-first_name">First Name *</Label>
                <Input
                  id="add-first_name"
                  value={addMemberFormData.first_name}
                  onChange={(e) =>
                    setAddMemberFormData({
                      ...addMemberFormData,
                      first_name: e.target.value,
                    })
                  }
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="add-last_name">Last Name *</Label>
                <Input
                  id="add-last_name"
                  value={addMemberFormData.last_name}
                  onChange={(e) =>
                    setAddMemberFormData({
                      ...addMemberFormData,
                      last_name: e.target.value,
                    })
                  }
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>
             <div>
               <Label htmlFor="add-phone">Phone *</Label>
               <div className="flex gap-2">
                 <CountrySelector
                   value={addMemberFormData.country_code || ""}
                   onValueChange={(value) =>
                     setAddMemberFormData({
                       ...addMemberFormData,
                       country_code: value,
                     })
                   }
                   countries={countries}
                   placeholder="Code"
                   className="w-40"
                 />
                 <Input
                   id="add-phone"
                   value={addMemberFormData.phone}
                   onChange={(e) =>
                     setAddMemberFormData({
                       ...addMemberFormData,
                       phone: e.target.value,
                     })
                   }
                   placeholder="Enter phone number"
                   required
                 />
               </div>
             </div>

            <div>
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={addMemberFormData.email}
                onChange={(e) =>
                  setAddMemberFormData({
                    ...addMemberFormData,
                    email: e.target.value,
                  })
                }
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <Label htmlFor="add-password">Password *</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? "text" : "password"}
                  value={addMemberFormData.password}
                  onChange={(e) =>
                    setAddMemberFormData({
                      ...addMemberFormData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Enter password (min 6 characters)"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMemberDialogOpen(false);
                setAddMemberFormData({
                  first_name: "",
                  last_name: "",
                  email: "",
                  password: "",
                  phone: "",
                  country_code: "+91",
                });
                setShowPassword(false);
              }}
              disabled={addMemberLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={addMemberLoading}>
              {addMemberLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adding Member...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Change Timeline */}
      {timelineProfile && (
        <ProfileChangeTimeline
          profileUserId={timelineProfile.user_id}
          profileName={`${timelineProfile.first_name} ${timelineProfile.last_name}`}
          isOpen={isTimelineOpen}
          onClose={() => setIsTimelineOpen(false)}
        />
      )}
    </div>
  );
}
