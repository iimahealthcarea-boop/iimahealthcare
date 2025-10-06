import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCountries } from "@/hooks/useCountries";
import { Loader2, Save, X, ArrowLeft, Upload, Clock } from "lucide-react";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { ProfileSharedSections } from "@/components/ProfileSharedSections";
import type { ProfileSharedFormData } from "@/components/ProfileSharedSections";
import {
  addProfileChange,
  getChangedFields,
} from "@/utils/profileChangeTracker";
import CountrySelector from "@/components/CountrySelector";
import { 
  compressImage, 
  validateImageFile, 
  formatFileSize, 
  AVATAR_COMPRESSION_OPTIONS 
} from "@/utils/imageCompression";

type OrganizationType =
  | "Corporate"
  | "Startup"
  | "Non-Profit"
  | "Government"
  | "Consulting"
  | "Education"
  | "Healthcare"
  | "Technology"
  | "Finance"
  | "Other";
type ExperienceLevel =
  | "Entry Level"
  | "Mid Level"
  | "Senior Level"
  | "Executive"
  | "Student"
  | "Recent Graduate";
type ProfileStatus = "Active" | "Alumni" | "Student" | "Faculty" | "Inactive";
type PreferredCommunication = "Phone" | "Email" | "WhatsApp" | "LinkedIn";
type ProgramType =
  | "MBA-PGDBM"
  | "MBA-FABM"
  | "MBA-PGPX"
  | "PhD"
  | "MBA-FPGP"
  | "ePGD-ABA"
  | "FDP"
  | "AFP"
  | "SMP"
  | "Other";

interface Organization {
  id: string;
  currentOrg: string;
  orgType: string;
  experience: string;
  description: string;
  role: string;
}

interface ChangeRecord {
  updatedBy: string;
  updatedAt: string;
  changedFields: string[];
  isAdmin: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country_code: string | null;
  gender: string | null;
  program: ProgramType | null;
  graduation_year: number | null;
  organization: string | null;
  organization_type: OrganizationType | null;
  position: string | null;
  experience_level: ExperienceLevel | null;
  location: string | null;
  city: string | null;
  country: string | null;
  pincode: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  bio: string | null;
  altEmail: string | null;
  other_social_media_handles: string | null;
  interests: string[] | null;
  skills: string[] | null;
  status: ProfileStatus | null;
  show_contact_info: boolean;
  show_location: boolean;
  is_public: boolean;
  avatar_url: string | null;
  preferred_mode_of_communication?: PreferredCommunication[] | null;
  organizations?: Organization[] | null;
  date_of_birth: string | null;
  address: string | null;
  willing_to_mentor?: "Yes" | "No" | "Maybe" | null;
  areas_of_contribution?: string[] | null;
}

const Profile = () => {
  const { user: authUser, isAdmin, refreshUserData } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [interestsInput, setInterestsInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  // Preferred communication and organizations are edited via profile state through ProfileSharedSections
  const navigate = useNavigate();
  const { toast } = useToast();
  const { countries, loading: countriesLoading } = useCountries();
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  
  const handlePreferredCommunicationChange = (
    value: PreferredCommunication,
    checked: boolean
  ) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const current = prev.preferred_mode_of_communication || [];
      const updated = checked
        ? [...current, value]
        : current.filter((v) => v !== value);
      return { ...prev, preferred_mode_of_communication: updated };
    });
  };

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Failed to load profile",
            variant: "destructive",
          });
        } else {
          setProfile(data as unknown as Profile);
          setEditingProfile(data as unknown as Profile);
          setInterestsInput(data.interests?.join(", ") || "");
          setSkillsInput(data.skills?.join(", ") || "");
          // preferred_mode_of_communication and organizations are held in profile/editingProfile directly
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      await fetchProfile(user.id);
    };

    getUser();
  }, [navigate, fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setSaving(true);
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
        ...profile,
        interests,
        skills,
        // Read from profile (single source of truth updated via onFormDataChange)
        preferred_mode_of_communication:
          (profile as Profile).preferred_mode_of_communication || [],
        organizations: (profile as Profile).organizations || [],
        willing_to_mentor: (profile as Profile).willing_to_mentor ?? null,
        areas_of_contribution: (profile as Profile).areas_of_contribution || [],
      };

      // Track changes before updating
      const changedFields = getChangedFields(editingProfile as unknown as Record<string, unknown>, updatedData as unknown as Record<string, unknown>);

      if (Object.keys(changedFields).length > 0) {
        const userName =
          `${profile.first_name} ${profile.last_name}`.trim() ||
          user.email ||
          "User";
        await addProfileChange(
          user.id,
          user.id,
          userName,
          changedFields,
          "update"
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        // Update local state
        setProfile(updatedData);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const removeInterest = (interest: string) => {
    const newInterests = interestsInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== interest);
    setInterestsInput(newInterests.join(", "));
  };

  const removeSkill = (skill: string) => {
    const newSkills = skillsInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== skill);
    setSkillsInput(newSkills.join(", "));
  };

  // Preferred communication toggling is handled inside ProfileSharedSections via onFormDataChange

  // Organization add/update/remove handled inside ProfileSharedSections via onFormDataChange


  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Compress the image using advanced compression
      const compressionResult = await compressImage(file, AVATAR_COMPRESSION_OPTIONS);

      // Create file path with user ID
      const fileExt = 'jpg'; // Always use jpg for compressed images
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete existing avatar if it exists
      if (profile?.avatar_url) {
        const existingPath = profile.avatar_url.split("/").pop();
        if (existingPath) {
          await supabase.storage
            .from("profile-pictures")
            .remove([`${user.id}/${existingPath}`]);
        }
      }

      // Upload compressed file
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, compressionResult.file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) =>
        prev ? { ...prev, avatar_url: data.publicUrl } : null
      );

      // Refresh user data in auth context to update header avatar
      await refreshUserData();

      toast({ 
        title: "Profile picture updated successfully!",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error uploading profile picture",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              We couldn't find your profile. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and privacy settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your personal details and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={profile.avatar_url || ""}
                    alt="Profile picture"
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials(profile.first_name, profile.last_name)}
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <ProfileSharedSections
          formData={profile}
          onFormDataChange={(newData: Partial<ProfileSharedFormData>) =>
            setProfile((prev) => ({
              ...(prev as Profile),
              ...(newData as Partial<Profile>),
            }))
          }
          handlePreferredCommunicationChange={handlePreferredCommunicationChange}
          skillsInput={skillsInput}
          onSkillsInputChange={setSkillsInput}
          interestsInput={interestsInput}
          onInterestsInputChange={setInterestsInput}
          showPersonal={true}
          showProfessional={true}
          showAdditional={true}
          showPrivacy={true}
        />

      

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
