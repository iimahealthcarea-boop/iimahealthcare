import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useCountries } from "@/hooks/useCountries";
import { Loader2, X, Upload } from "lucide-react";
import Header from "@/components/Header";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { CitySelector } from "@/components/CitySelector";
import { addProfileChange } from "@/utils/profileChangeTracker";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  compressImage,
  validateImageFile,
  AVATAR_COMPRESSION_OPTIONS,
} from "@/utils/imageCompression";
import { SectionDivider } from "@/components/SectionDivider";
import { ProfileSharedSections } from "@/components/ProfileSharedSections";
import type { ProfileSharedFormData } from "@/components/ProfileSharedSections";

export default function Registration() {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { countries, loading: countriesLoading } = useCountries();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.profile?.avatar_url || null
  );
  const [consent, setConsent] = useState({
    is_public: false,
    show_contact_info: false,
  });


  type Organization = {
    id: string;
    currentOrg: string;
    orgType: string;
    experience: string;
    description: string;
    role: string;
  };

  type PreferredCommunication = "Phone" | "Email" | "WhatsApp" | "LinkedIn";

  const [formData, setFormData] = useState({
    first_name: user?.profile?.first_name || "",
    last_name: user?.profile?.last_name || "",
    phone: user?.profile?.phone || "",
    altEmail:"",
    email: user?.email,
    country_code: "+91",
    address: "",
    date_of_birth: "",
    city: "",
    country: "India",
    pincode: "",
    gender: "",
    // Legacy single-organization fields (kept for compatibility)
    organization: "",
    position: "",
    // New fields mirroring Profile
    program: "" as
      | ""
      | "MBA-PGDBM"
      | "MBA-FABM"
      | "MBA-PGPX"
      | "PhD"
      | "MBA-FPGP"
      | "ePGD-ABA"
      | "FDP"
      | "AFP"
      | "SMP"
      | "Other",
    // experience_level: '',
    // organization_type: '',
    graduation_year: "",
    bio: "",
    skills: "",
    interests: "",
    linkedin_url: "",
    website_url: "",
    preferred_mode_of_communication: [] as PreferredCommunication[],
    organizations: [] as Organization[],
    is_public: false,
    show_contact_info: false,
    show_location: true,
    status: "" as "" | "Active" | "Alumni" | "Student" | "Faculty" | "Inactive",
    other_social_media_handles: "",
    willing_to_mentor: null as null | "Yes" | "No" | "Maybe",
    areas_of_contribution: [] as string[],
  });

  console.log("formData", formData);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Required fields validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!formData.date_of_birth.trim()) {
      newErrors.date_of_birth = "Date of birth is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }
    if (!formData.country_code.trim()) {
      newErrors.country_code = "Country code is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    }
    if (!formData.gender.trim()) {
      newErrors.gender = "Gender is required";
    }
    if (!formData.program) {
      newErrors.program = "Program is required";
    }
    // If any organization rows exist, validate visible fields
    formData.organizations.forEach((org, idx) => {
      if (!org?.currentOrg.trim()) {
        newErrors[`organizations_${idx}_currentOrg`] =
          "Organization name is required";
      }
      if (!org?.orgType.trim()) {
        newErrors[`organizations_${idx}_orgType`] =
          "Organization type is required";
      }
      if (!org.role.trim()) {
        newErrors[`organizations_${idx}_role`] = "Role is required";
      }
    });

    // Email validation (use entered email)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailPattern.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone number validation
    if (formData.country_code === "+91") {
      const digits = (formData.phone || "").replace(/\D/g, "");
      if (digits.length !== 10) {
        newErrors.phone = "For India (+91), phone must be exactly 10 digits";
      }
    } else {
      const phonePattern =
        /^(\+\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/;
      if (formData.phone && !phonePattern.test(formData.phone.trim())) {
        newErrors.phone =
          "Please enter a valid phone number (e.g., +91XXXXXXXXXX)";
      }
    }

    // Program must be from list
    if (
      formData.program &&
      ![
        "MBA-PGDBM",
        "MBA-FABM",
        "MBA-PGPX",
        "PhD",
        "MBA-FPGP",
        "ePGD-ABA",
        "FDP",
        "AFP",
        "SMP",
        "Other",
      ].includes(formData.program)
    ) {
      newErrors.program = "Please select a valid program";
    }

    // Validate organizations entries minimally
    formData.organizations.forEach((org, idx) => {
      if (!org?.currentOrg.trim()) {
        newErrors[`organizations_${idx}_currentOrg`] =
          "Organization name is required";
      }
    });

    // URL validations
    if (formData.linkedin_url && formData.linkedin_url.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.linkedin_url)) {
        newErrors.linkedin_url =
          "Please enter a valid URL starting with http:// or https://";
      }
    }

    if (formData.website_url && formData.website_url.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.website_url)) {
        newErrors.website_url =
          "Please enter a valid URL starting with http:// or https://";
      }
    }

    // Graduation year validation
    if (formData.graduation_year) {
      const currentYear = new Date().getFullYear();
      const gradYear = parseInt(formData.graduation_year);
      if (gradYear < 1950 || gradYear > currentYear + 10) {
        newErrors.graduation_year = `Please enter a valid graduation year between 1950 and ${
          currentYear + 10
        }`;
      }
    }

    // DOB validation: minimum age 15 years
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        const cutoff = new Date(
          today.getFullYear() - 15,
          today.getMonth(),
          today.getDate()
        );
        if (dob > cutoff) {
          newErrors.date_of_birth = "You must be at least 15 years old";
        }
      }
    }

    // Consent validations
    if (!consent.is_public) {
      newErrors.is_public = "Please consent to include your information in the directory";
    }
    if (!consent.show_contact_info) {
      newErrors.show_contact_info = "Please consent to share your contact information with other alumni";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreferredCommunicationChange = (
    value: PreferredCommunication,
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      preferred_mode_of_communication: checked
        ? [...prev.preferred_mode_of_communication, value]
        : prev.preferred_mode_of_communication.filter((v) => v !== value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("errors", errors);
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: `Please fill all the details. ${Object.values(errors).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    console.log("errors after validateForm", errors);

    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      const interestsArray = formData.interests
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          avatar_url: avatarUrl,
          phone: formData.phone,
          altEmail: formData.altEmail,
          email: formData.email,
          country_code: formData.country_code,
          address: formData.address,
          date_of_birth: formData.date_of_birth || null,
          city: formData.city,
          country: formData.country,
          pincode: formData.pincode,
          gender: formData.gender,
          organization: formData.organization,
          position: formData.position,
          program: formData.program || null,
          // experience_level: formData.experience_level as "Entry Level" | "Mid Level" | "Senior Level" | "Executive" | "Student" | "Recent Graduate",
          // organization_type: formData.organization_type as "Corporate" | "Startup" | "Non-Profit" | "Government" | "Consulting" | "Education" | "Healthcare" | "Technology" | "Finance" | "Other",
          graduation_year: formData.graduation_year
            ? parseInt(formData.graduation_year)
            : null,
          bio: formData.bio,
          skills: skillsArray,
          interests: interestsArray,
          linkedin_url: formData.linkedin_url,
          website_url: formData.website_url,
          preferred_mode_of_communication:
            formData.preferred_mode_of_communication,
          organizations: formData.organizations,
          is_public: formData.is_public,
          show_contact_info: formData.show_contact_info,
          show_location: formData.show_location,
          status: formData.status || null,
          approval_status: "pending",
          other_social_media_handles: formData.other_social_media_handles,
          willing_to_mentor: formData.willing_to_mentor,
          areas_of_contribution: formData.areas_of_contribution,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      // Track profile creation
      const userName =
        `${formData.first_name} ${formData.last_name}`.trim() ||
        user?.email ||
        "User";
      const creationFields = {
        approval_status: { oldValue: null, newValue: "pending" },
        first_name: { oldValue: null, newValue: formData.first_name },
        last_name: { oldValue: null, newValue: formData.last_name },
        gender: { oldValue: null, newValue: formData.gender },
        pincode: { oldValue: null, newValue: formData.pincode },
        organization: { oldValue: null, newValue: formData.organization },
        position: { oldValue: null, newValue: formData.position },
        program: { oldValue: null, newValue: formData.program },
        preferred_mode_of_communication: {
          oldValue: null,
          newValue: formData.preferred_mode_of_communication,
        },
        organizations: { oldValue: null, newValue: formData.organizations },
        willing_to_mentor: { oldValue: null, newValue: formData.willing_to_mentor },
        areas_of_contribution: { oldValue: null, newValue: formData.areas_of_contribution },
        privacy: {
          oldValue: null,
          newValue: {
            is_public: formData.is_public,
            show_contact_info: formData.show_contact_info,
            show_location: formData.show_location,
            status: formData.status,
          },
        },
      };

      try {
        await addProfileChange(
          user?.id || "",
          user?.id || "",
          userName,
          creationFields,
          "create"
        );
      } catch (changeError) {
        console.error("Failed to track profile creation:", changeError);
        // Don't fail the registration if change tracking fails
      }

      // Set under_registration to false after successful registration
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ under_registration: false })
        .eq('user_id', user?.id);

      if (updateError) {
        console.error('Error setting under_registration to false:', updateError);
        // Don't fail the registration if this fails
      }

      await refreshUserData();

      toast({
        title: "Registration Submitted",
        description:
          "Your profile has been submitted for admin approval. You'll be notified once it's reviewed.",
      });

      navigate("/waiting-approval");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  console.log("countries", countries);

  useEffect(() => {
    if (user?.profile) {
      setFormData((prev) => ({
        ...prev,
        first_name: user.profile.first_name,
        last_name: user.profile.last_name,
        email: user.profile.email,
      }));
      setAvatarUrl(user.profile.avatar_url || null);
    }
  }, [user]);

  const getInitials = (first?: string, last?: string) =>
    `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase();

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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
      const compressionResult = await compressImage(
        file,
        AVATAR_COMPRESSION_OPTIONS
      );
      const fileExt = "jpg";
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Remove previous
      if (avatarUrl) {
        const existingPath = avatarUrl.split("/").pop();
        if (existingPath) {
          await supabase.storage
            .from("profile-pictures")
            .remove([`${user.id}/${existingPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, compressionResult.file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
      toast({
        title: "Photo ready",
        description: "Your profile picture will be saved with the form.",
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Registration</CardTitle>
              <CardDescription>
                Please fill in your complete profile details. Your registration
                will be reviewed by an administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarUrl || ''} alt="Profile picture" />
                    <AvatarFallback className="text-lg">
                      {getInitials(formData.first_name, formData.last_name)}
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
                    <Button variant="outline" size="sm" disabled={uploading} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Photo'}
                      </span>
                    </Button>
                  </Label>
                  <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
              </div>

                <ProfileSharedSections
                  formData={formData as unknown as ProfileSharedFormData}
                  onFormDataChange={(newData: Partial<ProfileSharedFormData>) =>
                    setFormData((prev) => ({ ...prev, ...(newData as unknown as typeof formData) }))
                  }
                  handlePreferredCommunicationChange={handlePreferredCommunicationChange}
                  skillsInput={formData.skills}
                  onSkillsInputChange={(v) => setFormData({ ...formData, skills: v })}
                  interestsInput={formData.interests}
                  onInterestsInputChange={(v) => setFormData({ ...formData, interests: v })}
                  showPersonal={true}
                  showProfessional={true}
                  showAdditional={true}
                  showPrivacy={true}
                  lockDob={Boolean(user?.profile?.approval_status === 'approved')}
                  fieldErrors={errors}
                />

                {/* Consents - shown at the end of the form */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consent-directory"
                      checked={consent.is_public}
                      onCheckedChange={(checked) =>
                        setConsent((prev) => ({ ...prev, is_public: Boolean(checked) }))
                      }
                    />
                    <div>
                      <Label htmlFor="consent-directory" className="leading-6">
                        Consent to Include Information in the IIMA Healthcare Directory
                      </Label>
                      {errors.is_public && (
                        <p className="text-sm text-red-500 mt-1">{errors.is_public}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consent-share-contact"
                      checked={consent.show_contact_info}
                      onCheckedChange={(checked) =>
                          setConsent((prev) => ({ ...prev, show_contact_info: Boolean(checked) }))
                        }
                    />
                    <div>
                      <Label htmlFor="consent-share-contact" className="leading-6">
                        Consent to Share Contact Information with Other Alumni
                      </Label>
                      {errors.show_contact_info && (
                        <p className="text-sm text-red-500 mt-1">{errors.show_contact_info}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Registration
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
