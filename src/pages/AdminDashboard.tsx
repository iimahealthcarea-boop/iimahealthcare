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
  const [updateRequests, setUpdateRequests] = useState<
    Tables<'profile_update_requests'>[]
  >([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<
    Tables<'profile_update_requests'> | null
  >(null);
  const [requestEditPayload, setRequestEditPayload] = useState<Record<string, unknown> | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [organizationTypeFilter, setOrganizationTypeFilter] = useState("all");
  const [filteredProfiles, setFilteredProfiles] = useState<
    ProfileWithApproval[]
  >([]);

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

  console.log("updateRequests", updateRequests);

  const fetchUpdateRequests = useCallback(async () => {
    if (!isAdmin) return;
    setRequestsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_update_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUpdateRequests(data || []);
    } catch (error) {
      console.error('Error fetching update requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch update requests',
        variant: 'destructive',
      });
    } finally {
      setRequestsLoading(false);
    }
  }, [isAdmin, toast]);

  const filterProfiles = useCallback(() => {
    let filtered = profiles;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((profile) => {
        // Basic information
        const nameMatch = `${profile.first_name || ""} ${
          profile.last_name || ""
        }`
          .toLowerCase()
          .includes(searchLower);
        const organizationMatch =
          profile.organization?.toLowerCase().includes(searchLower) || false;
        const positionMatch =
          profile.position?.toLowerCase().includes(searchLower) || false;
        const programMatch =
          profile.program?.toLowerCase().includes(searchLower) || false;

        // Location information
        const cityMatch =
          profile.city?.toLowerCase().includes(searchLower) || false;
        const countryMatch =
          profile.country?.toLowerCase().includes(searchLower) || false;
        const addressMatch =
          profile.address?.toLowerCase().includes(searchLower) || false;

        // Professional details
        const experienceMatch =
          profile.experience_level?.toLowerCase().includes(searchLower) ||
          false;
        const orgTypeMatch =
          profile.organization_type?.toLowerCase().includes(searchLower) ||
          false;
        const graduationYearMatch =
          profile.graduation_year?.toString().includes(searchLower) || false;

        // Bio and description
        const bioMatch =
          profile.bio?.toLowerCase().includes(searchLower) || false;

        // Skills array search
        const skillsMatch =
          profile.skills?.some((skill) =>
            skill.toLowerCase().includes(searchLower)
          ) || false;

        // Interests array search
        const interestsMatch =
          profile.interests?.some((interest) =>
            interest.toLowerCase().includes(searchLower)
          ) || false;

        // Social links
        const linkedinMatch =
          profile.linkedin_url?.toLowerCase().includes(searchLower) || false;
        const websiteMatch =
          profile.website_url?.toLowerCase().includes(searchLower) || false;

        // Contact information
        const emailMatch =
          profile.email?.toLowerCase().includes(searchLower) || false;
        const phoneMatch =
          profile.phone?.toLowerCase().includes(searchLower) || false;

        // Approval status
        const statusMatch =
          profile.approval_status?.toLowerCase().includes(searchLower) || false;

        return (
          nameMatch ||
          organizationMatch ||
          positionMatch ||
          programMatch ||
          cityMatch ||
          countryMatch ||
          addressMatch ||
          experienceMatch ||
          orgTypeMatch ||
          graduationYearMatch ||
          bioMatch ||
          skillsMatch ||
          interestsMatch ||
          linkedinMatch ||
          websiteMatch ||
          emailMatch ||
          phoneMatch ||
          statusMatch
        );
      });
    }

    if (experienceFilter && experienceFilter !== "all") {
      filtered = filtered.filter(
        (profile) => profile.experience_level === experienceFilter
      );
    }

    if (
      organizationTypeFilter &&
      organizationTypeFilter !== "all" &&
      organizationTypeFilter !== "All organization types"
    ) {
      filtered = filtered.filter(
        (profile) => profile.organization_type === organizationTypeFilter
      );
    }

    setFilteredProfiles(filtered);
  }, [profiles, searchTerm, experienceFilter, organizationTypeFilter]);

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchUpdateRequests();
    }
  }, [isAdmin, fetchProfiles, fetchUpdateRequests]);

  useEffect(() => {
    filterProfiles();
  }, [filterProfiles]);

  // Redirect if not admin
  if (!isAdmin && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleRefresh = async () => {
    setLoading(true);
    await fetchProfiles();
    await fetchUpdateRequests();
    toast({
      title: "Refreshed",
      description: "Profile list has been updated",
    });
  };

  const handleApproveRequest = async (requestId: string, override?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('approve_profile_update_request', {
        request_id: requestId,
        override_payload: (override as unknown as Json) || null,
      });
      if (error) throw error;
      toast({ title: 'Request Approved', description: 'Profile updated successfully.' });
      await fetchProfiles();
      await fetchUpdateRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      toast({ title: 'Error', description: 'Failed to approve request', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string, reason?: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('reject_profile_update_request', {
        request_id: requestId,
        reason: reason || null,
      });
      if (error) throw error;
      toast({ title: 'Request Rejected', description: 'The request has been rejected.' });
      await fetchUpdateRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({ title: 'Error', description: 'Failed to reject request', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
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
          newValue: "rejected",
        },
        rejection_reason: {
          oldValue: profile.rejection_reason,
          newValue: rejectionReason,
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

      // Update local state
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.user_id === editingProfile.user_id
            ? ({ ...profile, ...(updatedData as unknown as Partial<ProfileWithApproval>) } as ProfileWithApproval)
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

  const getFilteredStats = () => {
    const pending = filteredProfiles.filter(
      (p) => p.approval_status === "pending"
    ).length;
    const approved = filteredProfiles.filter(
      (p) => p.approval_status === "approved"
    ).length;
    const rejected = filteredProfiles.filter(
      (p) => p.approval_status === "rejected"
    ).length;
    return { pending, approved, rejected, total: filteredProfiles.length };
  };

  const stats = getStats();
  const filteredStats = getFilteredStats();

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

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const renderProfileCard = (profile: ProfileWithApproval) => (
    <Card
      key={profile.id}
      className="hover:shadow-lg transition-all rounded-2xl border border-gray-200"
    >
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14 ring-2 ring-primary/20 shadow-sm">
              <AvatarImage
                src={profile.avatar_url || ""}
                alt={`${profile.first_name} ${profile.last_name}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-semibold">
                {profile.first_name} {profile.last_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {profile.position || "—"}{" "}
                {profile.organization && `@ ${profile.organization}`}
              </p>
              <CardDescription className="text-xs">
                {profile.email}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(profile.approval_status || "pending")}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-2 text-sm">
        {profile.phone && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Phone:</span>
            <span className="text-gray-800">{profile.phone}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Registered:</span>
          <span>{new Date(profile.created_at).toLocaleDateString()}</span>
        </div>

        {/* Expandable Quick Info */}
        <Collapsible>
          <CollapsibleTrigger className="text-xs text-primary hover:underline mt-1">
            Show more info
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-1 text-xs text-gray-700">
            {profile.city && (
              <div>
                <strong>City:</strong> {profile.city}
              </div>
            )}
            {profile.country && (
              <div>
                <strong>Country:</strong> {profile.country}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      {/* Footer / Actions */}
      <div className="p-4 space-y-2 border-t pt-2">
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setSelectedProfile(profile)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </DialogTrigger>
            {/* DialogContent as you already built */}
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
                        <strong>Gender:</strong> {selectedProfile.gender || "Not provided"}
                      </div>
                      <div>
                        <strong>Date of Birth:</strong>{" "}
                        {selectedProfile.date_of_birth || "Not provided"}
                      </div>
                      <div>
                        <strong>City:</strong> {selectedProfile.city || "Not provided"}
                      </div>
                      <div>
                        <strong>Country:</strong> {selectedProfile.country || "Not provided"}
                      </div>
                      <div>
                        <strong>Pincode/ZIP:</strong> {selectedProfile.pincode || "Not provided"}
                      </div>
                      <div className="col-span-2">
                        <strong>Address:</strong> {selectedProfile.address || "Not provided"}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Email:</strong> {selectedProfile.email}
                      </div>
                      <div>
                        <strong>Alternate Email:</strong> {String((selectedProfile as Record<string, unknown>).altEmail || "Not provided")}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedProfile.country_code} {selectedProfile.phone}
                      </div>
                      <div>
                        <strong>LinkedIn:</strong> {selectedProfile.linkedin_url ? (
                          <a
                            href={selectedProfile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedProfile.linkedin_url}
                          </a>
                        ) : "Not provided"}
                      </div>
                      <div>
                        <strong>Website:</strong> {selectedProfile.website_url ? (
                          <a
                            href={selectedProfile.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedProfile.website_url}
                          </a>
                        ) : "Not provided"}
                      </div>
                      <div>
                        <strong>Other Social Media:</strong> {String((selectedProfile as Record<string, unknown>).other_social_media_handles || "Not provided")}
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
                    <h4 className="font-semibold mb-3 text-lg">
                      Professional Information
                    </h4>

                    {/* Education Details */}
                    <div className="mb-4">
                      <h5 className="font-medium mb-2">Education</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Program:</strong> {selectedProfile.program || "Not provided"}
                        </div>
                        <div>
                          <strong>Graduation Year:</strong> {selectedProfile.graduation_year || "Not provided"}
                        </div>
                      </div>
                    </div>

                    {/* Organizations */}
                    <div>
                      <h5 className="font-medium mb-2">Organizations</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.isArray(selectedProfile.organizations as unknown as Array<Record<string, unknown>>) ? (selectedProfile.organizations as unknown as Array<Record<string, unknown>>).map((org, index: number) => (
                          <div
                            key={String((org as Record<string, unknown>).id ?? index)}
                            className="rounded-2xl border p-4 shadow-sm bg-white"
                          >
                            <h5 className="font-medium mb-2 text-primary">
                              Organization {index + 1}: {String((org as Record<string, unknown>).currentOrg ?? '-')}
                            </h5>

                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>
                                <span className="font-semibold text-foreground">
                                  Type:
                                </span>{" "}
                                {String((org as Record<string, unknown>).orgType ?? '-')}
                              </p>
                              <p>
                                <span className="font-semibold text-foreground">
                                  Experience:
                                </span>{" "}
                                {String((org as Record<string, unknown>).experience ?? '-')}
                              </p>
                              <p>
                                <span className="font-semibold text-foreground">
                                  Role:
                                </span>{" "}
                                {String((org as Record<string, unknown>).role ?? '-')}
                              </p>
                              <p>
                                <span className="font-semibold text-foreground">
                                  Description:
                                </span>{" "}
                                {String((org as Record<string, unknown>).description ?? '-')}
                              </p>
                            </div>
                          </div>
                        )) : (
                          <div className="text-sm text-muted-foreground">No organizations provided</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preferred mode of communication */}
                  <div>
                    <h4 className="font-semibold mb-2">Communication Preferences</h4>
                    <div className="space-y-2 text-sm">
                      {Array.isArray((selectedProfile as unknown as { preferred_mode_of_communication?: string[] }).preferred_mode_of_communication) && (
                        <div>
                          <strong>Preferred Mode of Communication:</strong>{" "}
                          {((selectedProfile as unknown as { preferred_mode_of_communication?: string[] }).preferred_mode_of_communication || []).join(
                            ", "
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mentoring & Contributions */}
                  <div>
                    <h4 className="font-semibold mb-2">Mentoring & Contributions</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Willing to Mentor:</strong> {String((selectedProfile as Record<string, unknown>).willing_to_mentor || "Not provided")}
                      </div>
                      <div>
                        <strong>Areas of Contribution:</strong> {(selectedProfile as Record<string, unknown>).areas_of_contribution && Array.isArray((selectedProfile as Record<string, unknown>).areas_of_contribution) && ((selectedProfile as Record<string, unknown>).areas_of_contribution as string[]).length > 0 ? (
                          ((selectedProfile as Record<string, unknown>).areas_of_contribution as string[]).join(", ")
                        ) : "Not provided"}
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h4 className="font-semibold mb-2">
                      Additional Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Bio:</strong> {selectedProfile.bio || "Not provided"}
                      </div>
                      <div>
                        <strong>Skills:</strong> {selectedProfile.skills && selectedProfile.skills.length > 0 ? (
                          selectedProfile.skills.join(", ")
                        ) : "Not provided"}
                      </div>
                      <div>
                        <strong>Interests:</strong> {selectedProfile.interests && selectedProfile.interests.length > 0 ? (
                          selectedProfile.interests.join(", ")
                        ) : "Not provided"}
                      </div>
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
            className="flex-1"
            onClick={() => openTimeline(profile)}
          >
            <History className="w-4 h-4 mr-1" />
            Timeline
          </Button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => openEditDialog(profile)}
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit Profile
        </Button>

        {profile.approval_status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleApprove(profile.user_id)}
              disabled={actionLoading}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => handleReject(profile.user_id)}
              disabled={actionLoading}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
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

        {/* Results Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 mb-4">
          <Users className="h-4 w-4" />
          <span>
            Showing {filteredProfiles.length} of {profiles.length} profiles
          </span>
        </div>

        {/* Profiles List */}
        <Tabs defaultValue="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({filteredStats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({filteredStats.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({filteredStats.rejected})
              </TabsTrigger>
              <TabsTrigger value="all">All ({filteredStats.total})</TabsTrigger>
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
              Refresh
            </Button>
          </div>

          <TabsContent value="pending" className="space-y-4">
            {filteredProfiles.filter((p) => p.approval_status === "pending")
              .length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfiles
                  .filter((p) => p.approval_status === "pending")
                  .map(renderProfileCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No pending profiles found
                  </h3>
                  <p className="text-muted-foreground">
                    {profiles.filter((p) => p.approval_status === "pending")
                      .length === 0
                      ? "There are no pending profiles to review."
                      : "Try adjusting your search criteria or filters to see more results."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {filteredProfiles.filter((p) => p.approval_status === "approved")
              .length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfiles
                  .filter((p) => p.approval_status === "approved")
                  .map(renderProfileCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No approved profiles found
                  </h3>
                  <p className="text-muted-foreground">
                    {profiles.filter((p) => p.approval_status === "approved")
                      .length === 0
                      ? "There are no approved profiles yet."
                      : "Try adjusting your search criteria or filters to see more results."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {filteredProfiles.filter((p) => p.approval_status === "rejected")
              .length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfiles
                  .filter((p) => p.approval_status === "rejected")
                  .map(renderProfileCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No rejected profiles found
                  </h3>
                  <p className="text-muted-foreground">
                    {profiles.filter((p) => p.approval_status === "rejected")
                      .length === 0
                      ? "There are no rejected profiles."
                      : "Try adjusting your search criteria or filters to see more results."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {filteredProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfiles.map(renderProfileCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No profiles found
                  </h3>
                  <p className="text-muted-foreground">
                    {profiles.length === 0
                      ? "There are no profiles in the system yet."
                      : "Try adjusting your search criteria or filters to see more results."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Update Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Update Requests</CardTitle>
                <CardDescription>
                  Review and manage user-submitted profile changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="py-6 text-center text-sm">Loading requests...</div>
                ) : updateRequests.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No update requests</div>
                ) : (
                  <div className="space-y-3">
                    {updateRequests.filter((r) => r.status === "pending").map((req) => {
                      const proposed = (req.submitted_payload as unknown as Record<string, unknown>) || {};
                      const profile = profiles.find((p) => p.user_id === req.profile_user_id);
                      const fields = Object.keys(proposed);
                      return (
                        <Card key={req.id} className="border rounded-xl">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Request ID: {req.id}</div>
                                <div className="text-sm font-muted-foreground">Name: {profile?.first_name} {profile?.last_name}</div>
                                <div className="text-sm font-muted-foreground">Email: {profile?.email}</div>
                                <div className="text-xs text-muted-foreground">
                                  Submitted: {new Date(req.created_at).toLocaleString()} | Status: {req.status}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setSelectedRequest(req); setRequestEditPayload(proposed); }}>
                                  <Edit className="w-4 h-4 mr-1" /> Edit
                                </Button>
                                <Button size="sm" onClick={() => handleApproveRequest(req.id)} disabled={actionLoading}>
                                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleRejectRequest(req.id)} disabled={actionLoading}>
                                  <XCircle className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </div>

                            {/* Diff table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-left text-muted-foreground">
                                    <th className="py-2 pr-4">Field</th>
                                    <th className="py-2 pr-4">Current</th>
                                    <th className="py-2 pr-4">Proposed</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {fields.map((key) => (
                                    <tr key={key} className="border-t">
                                      <td className="py-2 pr-4 align-top font-medium">{key}</td>
                                      <td className="py-2 pr-4 align-top text-muted-foreground">{formatValue((profile as unknown as Record<string, unknown>)?.[key])}</td>
                                      <td className="py-2 pr-4 align-top">{formatValue((proposed as Record<string, unknown>)[key])}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {req.admin_notes && (
                              <div className="text-xs text-muted-foreground">Notes: {req.admin_notes}</div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
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

      {/* Edit Request Payload Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) { setSelectedRequest(null); setRequestEditPayload(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Request Payload</DialogTitle>
            <DialogDescription>
              Adjust fields before approval. Approving applies these changes to the user profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={(() => {
                try { return JSON.stringify(requestEditPayload ?? {}, null, 2); } catch { return '{}'; }
              })()}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '{}') as Record<string, unknown>;
                  setRequestEditPayload(parsed);
                } catch {
                  // ignore parse errors while typing
                }
              }}
              className="min-h-[300px] font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setSelectedRequest(null); setRequestEditPayload(null); }}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button onClick={() => selectedRequest && handleApproveRequest(selectedRequest.id, requestEditPayload || undefined)} disabled={actionLoading}>
                <Save className="h-4 w-4 mr-2" /> Approve with Edits
              </Button>
            </div>
          </div>
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
