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
import { Tables, Json } from "@/integrations/supabase/types";
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
  Search,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Linkedin,
  Globe,
} from "lucide-react";
import {
  addProfileChange,
  getChangedFields,
  getUserName,
  ProfileChange,
} from "@/utils/profileChangeTracker";
import { ProfileChangeTimeline } from "@/components/ProfileChangeTimeline";
import * as XLSX from "xlsx";
import { Navigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import { useCountries } from "@/hooks/useCountries";
import CountrySelector from "@/components/CountrySelector";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { ProfileSharedSections, ProfileSharedFormData } from "@/components/ProfileSharedSections";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UpdateRequestsTab } from "@/components/UpdateRequestsTab";
import { ProfileTab } from "@/components/ProfileTab";

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
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] =
    useState<ProfileWithApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<ProfileWithApproval | null>(null);
  const [editFormData, setEditFormData] = useState<
    Partial<ProfileSharedFormData>
  >({} as Partial<ProfileSharedFormData>);
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
    role: "normal_user" as 'normal_user' | 'admin',
  });
  const { countries, loading: countriesLoading } = useCountries();

  const [showPassword, setShowPassword] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineProfile, setTimelineProfile] =
    useState<ProfileWithApproval | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [organizationTypeFilter, setOrganizationTypeFilter] = useState("all");
  const [profileRefreshSignal, setProfileRefreshSignal] = useState(0);
  
  // Debounce search term - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Stats state - will be fetched separately
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  // Fetch stats only (lightweight)
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      // Fetch counts for each status
      const [pendingRes, approvedRes, rejectedRes, totalRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("approval_status", "approved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("approval_status", "rejected"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        pending: pendingRes.count || 0,
        approved: approvedRes.count || 0,
        rejected: rejectedRes.count || 0,
        total: totalRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin, fetchStats]);

  // Redirect if not admin
  if (!isAdmin && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleRefresh = async () => {
    setProfileRefreshSignal((prev) => prev + 1);
    await fetchStats();
    toast({
      title: "Refreshed",
      description: "Stats have been updated",
    });
  };

  const handleProfileUpdate = async () => {
    await fetchStats();
  };


  const handleApprove = async (profileUserId: string) => {
    setActionLoading(true);
    try {
      // Fetch user profile details before approval
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", profileUserId)
        .single();
      
      if (profileError || !profile) {
        throw new Error("Profile not found");
      }

      // Track approval change
      const changedFields = {
        approval_status: {
          oldValue: profile.approval_status,
          newValue: "approved",
        },
      };

      const adminName = user?.email || "Admin";
      await addProfileChange(
        profileUserId,
        user?.id || "",
        adminName,
        changedFields,
        "approve"
      );

      // Approve the profile
      const { error } = await supabase.rpc("approve_user_profile", {
        profile_user_id: profileUserId,
      });

      if (error) throw error;

      const dataToSave = {
        id: profile.id,
        user_id: profileUserId,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        gender: profile.gender,
        program: profile.program,
        graduation_year: profile.graduation_year,
        organization: profile.organization,
        organization_type: profile.organization_type,
        position: profile.position,
        experience_level: profile.experience_level,
        location: profile.location,
        city: profile.city,
        country: profile.country,
        pincode: profile.pincode,
        linkedin_url: profile.linkedin_url,
        website_url: profile.website_url,
        bio: profile.bio,
        interests: profile.interests,
        skills: profile.skills,
        status: profile.status,
        show_contact_info: profile.show_contact_info,
        show_location: profile.show_location,
        is_public: profile.is_public,
        avatar_url: profile.avatar_url,
        preferred_mode_of_communication: profile.preferred_mode_of_communication,
        organizations: profile.organizations,
        date_of_birth: profile.date_of_birth,
        address: profile.address,
      }

      // Send approval email
      try {
        const { error: emailError } = await supabase.functions.invoke(
          "send-approval-email",
          {
            body: {
              email: profile.email,
              name: `${profile.first_name} ${profile.last_name}`,
              status: "approved",
              profile: dataToSave,
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

      await fetchStats();
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

  const handleReject = async (profileUserId: string, reason?: string) => {
    setActionLoading(true);
    try {
      // Fetch user profile details before rejection
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", profileUserId)
        .single();
      
      if (profileError || !profile) {
        throw new Error("Profile not found");
      }

      // Track rejection change
      const changedFields = {
        approval_status: {
          oldValue: profile.approval_status,
          newValue: "rejected",
        },
        rejection_reason: {
          oldValue: profile.rejection_reason,
          newValue: reason || "",
        },
      };

      const adminName = user?.email || "Admin";
      await addProfileChange(
        profileUserId,
        user?.id || "",
        adminName,
        changedFields,
        "reject"
      );

      // Reject the profile
      const { error } = await supabase.rpc("reject_user_profile", {
        profile_user_id: profileUserId,
        reason: reason || null,
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
              reason: reason || "",
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

      await fetchStats();
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
    // Map DB profile to shared form data types
    setEditFormData({
      ...(profile as unknown as Partial<ProfileSharedFormData>),
      preferred_mode_of_communication: ((profile as unknown as { preferred_mode_of_communication?: string[] }).preferred_mode_of_communication || []) as ProfileSharedFormData['preferred_mode_of_communication'],
      organizations: (profile.organizations as unknown as ProfileSharedFormData['organizations']) || [],
    });
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

      const updatedData: Record<string, unknown> = {
        ...editFormData,
        interests,
        skills,
      } as unknown as Record<string, unknown>;

      // Track changes before updating
      const changedFields = getChangedFields(editingProfile, updatedData);

      if (Object.keys(changedFields).length > 0) {
        const adminName = user?.email || "Admin";
        await addProfileChange(
          editingProfile.user_id,
          user?.id || "",
          adminName,
          changedFields,
          "admin_edit"
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update(updatedData as unknown as Record<string, unknown>)
        .eq("user_id", editingProfile.user_id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Profile has been successfully updated",
      });
      
      await fetchStats();

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
            role: addMemberFormData.role,
            phone: addMemberFormData.phone,
            country_code: addMemberFormData.country_code,
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
          role: 'normal_user',
        });
        setShowPassword(false);
        setIsAddMemberDialogOpen(false);

        // Refresh stats
        await fetchStats();
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


  const exportToExcel = async () => {
    try {
      // Fetch all approved profiles for export
      const { data: approvedProfiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("approval_status", "approved");

      if (error) throw error;
      if (!approvedProfiles) throw new Error("No data returned");

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
            <Link to="/organizations">
              <Button variant="outline">
                <Building className="w-4 h-4 mr-2" />
                Organizations
              </Button>
            </Link>
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

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Profiles
            </CardTitle>
            <CardDescription>
              Find profiles by name, organization, skills, bio, interests, or
              any other profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search-profiles">Search</Label>
                <Input
                  id="search-profiles"
                  placeholder="Search by name, organization, skills, bio, interests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="experience-profiles">Experience Level</Label>
                <Select
                  value={experienceFilter}
                  onValueChange={setExperienceFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All experience levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All experience levels</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Recent Graduate">
                      Recent Graduate
                    </SelectItem>
                    <SelectItem value="Entry Level">Entry Level</SelectItem>
                    <SelectItem value="Mid Level">Mid Level</SelectItem>
                    <SelectItem value="Senior Level">Senior Level</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="orgType-profiles">Organization Type</Label>
                <Select
                  value={organizationTypeFilter}
                  onValueChange={setOrganizationTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All organization types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All organization types</SelectItem>
                    <SelectItem value="Hospital / Clinic">
                        Hospital / Clinic
                      </SelectItem>
                      <SelectItem value="HealthTech Company">
                        HealthTech Company
                      </SelectItem>
                      <SelectItem value="Pharmaceutical">
                        Pharmaceutical
                      </SelectItem>
                      <SelectItem value="Biotech">Biotech</SelectItem>
                      <SelectItem value="Medical Devices">
                        Medical Devices
                      </SelectItem>
                      <SelectItem value="Consulting Firm">
                        Consulting Firm
                      </SelectItem>
                      <SelectItem value="Public Health / Policy Organization">
                        Public Health / Policy Organization
                      </SelectItem>
                      <SelectItem value="Health Insurance">
                        Health Insurance
                      </SelectItem>
                      <SelectItem value="Academic / Research Institution">
                        Academic / Research Institution
                      </SelectItem>
                      <SelectItem value="Startup / Entrepreneurial Venture">
                        Startup / Entrepreneurial Venture
                      </SelectItem>
                      <SelectItem value="Investment / Venture Capital">
                        Investment / Venture Capital
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profiles List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 mt-6">
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
              <TabsTrigger value="requests">Update Requests</TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh Stats
            </Button>
          </div>

          {/* Pending Tab - Lazy loaded */}
          <TabsContent value="pending" className="space-y-4">
            <ProfileTab
              status="pending"
              searchTerm={debouncedSearchTerm}
              experienceFilter={experienceFilter}
              organizationTypeFilter={organizationTypeFilter}
              onProfileUpdate={handleProfileUpdate}
              onApprove={handleApprove}
              onReject={handleReject}
              onTogglePublic={handleTogglePublicStatus}
              onEdit={openEditDialog}
              actionLoading={actionLoading}
              refreshSignal={profileRefreshSignal}
            />
          </TabsContent>

          {/* Approved Tab - Lazy loaded */}
          <TabsContent value="approved" className="space-y-4">
            <ProfileTab
              status="approved"
              searchTerm={debouncedSearchTerm}
              experienceFilter={experienceFilter}
              organizationTypeFilter={organizationTypeFilter}
              onProfileUpdate={handleProfileUpdate}
              onApprove={handleApprove}
              onReject={handleReject}
              onTogglePublic={handleTogglePublicStatus}
              onEdit={openEditDialog}
              actionLoading={actionLoading}
              refreshSignal={profileRefreshSignal}
            />
          </TabsContent>

          {/* Rejected Tab - Lazy loaded */}
          <TabsContent value="rejected" className="space-y-4">
            <ProfileTab
              status="rejected"
              searchTerm={debouncedSearchTerm}
              experienceFilter={experienceFilter}
              organizationTypeFilter={organizationTypeFilter}
              onProfileUpdate={handleProfileUpdate}
              onApprove={handleApprove}
              onReject={handleReject}
              onTogglePublic={handleTogglePublicStatus}
              onEdit={openEditDialog}
              actionLoading={actionLoading}
              refreshSignal={profileRefreshSignal}
            />
          </TabsContent>

          {/* All Tab - Lazy loaded */}
          <TabsContent value="all" className="space-y-4">
            <ProfileTab
              status="all"
              searchTerm={debouncedSearchTerm}
              experienceFilter={experienceFilter}
              organizationTypeFilter={organizationTypeFilter}
              onProfileUpdate={handleProfileUpdate}
              onApprove={handleApprove}
              onReject={handleReject}
              onTogglePublic={handleTogglePublicStatus}
              onEdit={openEditDialog}
              actionLoading={actionLoading}
              refreshSignal={profileRefreshSignal}
            />
          </TabsContent>

          {/* Update Requests Tab - Lazy loaded */}
          <TabsContent value="requests" className="space-y-4">
            <UpdateRequestsTab 
              profiles={[]} 
              onRequestUpdate={handleProfileUpdate}
            />
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
            <>
              <ProfileSharedSections
                formData={editFormData}
                onFormDataChange={(newData) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    ...(newData as Partial<ProfileSharedFormData>),
                  }))
                }
                handlePreferredCommunicationChange={() => {}}
                skillsInput={skillsInput}
                onSkillsInputChange={setSkillsInput}
                interestsInput={interestsInput}
                onInterestsInputChange={setInterestsInput}
              />
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
            </>
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
              <Label htmlFor="add-role">Role *</Label>
              <div className="flex gap-2">
                <select
                  id="add-role"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={addMemberFormData.role}
                  onChange={(e) =>
                    setAddMemberFormData({
                      ...addMemberFormData,
                      role: e.target.value as 'normal_user' | 'admin',
                    })
                  }
                >
                  <option value="normal_user">Normal User</option>
                  <option value="admin">Admin</option>
                </select>
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
                  role: 'normal_user',
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
