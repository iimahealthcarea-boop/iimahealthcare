import React, { useState } from "react";
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
import { OrganizationSelector } from "@/components/OrganizationSelector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCountries } from "@/hooks/useCountries";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";

type ExperienceLevel = string;
type OrganizationType = string;
type ProgramType = string;
type ProfileStatus = string;

export interface ProfileSharedFormData {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country_code: string | null;
  program: ProgramType | null;
  graduation_year: number | null;
  organization: string | null;
  organization_type: OrganizationType | null;
  position: string | null;
  experience_level: ExperienceLevel | null;
  location: string | null;
  city: string | null;
  country: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  bio: string | null;
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
}

interface ProfileSharedSectionsProps {
  formData: Partial<ProfileSharedFormData>;
  onFormDataChange: (newData: Partial<ProfileSharedFormData>) => void;
  skillsInput: string;
  onSkillsInputChange: (value: string) => void;
  interestsInput: string;
  onInterestsInputChange: (value: string) => void;
  showPersonal?: boolean;
  showProfessional?: boolean;
  showAdditional?: boolean;
  showPrivacy?: boolean;
}

type PreferredCommunication = "Phone" | "Email" | "WhatsApp" | "LinkedIn";

type Organization = {
  id: string;
  currentOrg: string;
  orgType: string;
  experience: string;
  description: string;
  role: string;
};

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  country_code: string;
  city: string;
  location: string;
};

export const ProfileSharedSections: React.FC<ProfileSharedSectionsProps> = ({
  formData,
  onFormDataChange,
  skillsInput,
  onSkillsInputChange,
  interestsInput,
  onInterestsInputChange,
  showPersonal = true,
  showProfessional = true,
  showAdditional = true,
  showPrivacy = true,
}) => {
  const { countries, loading: countriesLoading } = useCountries();
  const [organizations, setOrganizations] = useState<Organization[]>(
    formData.organizations || []
  );
  const [preferredCommunication, setPreferredCommunication] = useState<
    PreferredCommunication[]
  >(formData.preferred_mode_of_communication || []);

  const removeOrganization = (id: string) => {
    setOrganizations((prev) => prev.filter((org) => org.id !== id));
  };

  const addOrganization = () => {
    setOrganizations((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        currentOrg: "",
        orgType: "",
        experience: "",
        description: "",
        role: "",
      } as Organization,
    ]);
  };

  const updateOrganization = (
    id: string,
    field: keyof Organization,
    value: string
  ) => {
    setOrganizations((prev) =>
      prev.map((org) => (org.id === id ? { ...org, [field]: value } : org))
    );
  };

  const handlePreferredCommunicationChange = (
    value: PreferredCommunication,
    checked: boolean
  ) => {
    if (checked) {
      setPreferredCommunication((prev) => [...prev, value]);
    } else {
      setPreferredCommunication((prev) =>
        prev.filter((item) => item !== value)
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      {showPersonal && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, first_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, last_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth || ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    date_of_birth: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country || ""}
                onValueChange={(value) => {
                  const selectedCountry = countries.find(
                    (c) => c.name === value
                  );
                  onFormDataChange({
                    ...formData,
                    country: value,
                    country_code:
                      selectedCountry?.dialCode || formData.country_code,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, city: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="location">Full Location</Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Mumbai, India"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, address: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      )}
      {/* <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country || ""}
                  onValueChange={(value) => {
                    const selectedCountry = countries.find(
                      (c) => c.name === value
                    );
                    onFormDataChange({
                      ...formData,
                      country: value,
                      country_code:
                        selectedCountry?.dialCode || formData.country_code,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="location">Full Location</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Mumbai, India"
                />
              </div>
            </div>
          </CardContent>
        </Card> */}

      {/* Professional Information */}
      {showProfessional && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <div>
            <Label htmlFor="organization">Organization</Label>
            <OrganizationSelector
              value={formData.organization || ""}
              onChange={(value) =>
                onFormDataChange({ ...formData, organization: value })
              }
              placeholder="Search or add organization..."
            />
          </div>
          <div>
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={formData.position || ""}
              onChange={(e) =>
                onFormDataChange({ ...formData, position: e.target.value })
              }
            />
          </div> */}
            {/* <div>
            <Label htmlFor="experience_level">Experience Level</Label>
            <Select
              value={formData.experience_level || ""}
              onValueChange={(value) =>
                onFormDataChange({
                  ...formData,
                  experience_level: value as ExperienceLevel,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Recent Graduate">Recent Graduate</SelectItem>
                <SelectItem value="Entry Level">Entry Level</SelectItem>
                <SelectItem value="Mid Level">Mid Level</SelectItem>
                <SelectItem value="Senior Level">Senior Level</SelectItem>
                <SelectItem value="Executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
            {/* <div>
            <Label htmlFor="organization_type">Organization Type</Label>
            <Select
              value={formData.organization_type || ""}
              onValueChange={(value) =>
                onFormDataChange({
                  ...formData,
                  organization_type: value as OrganizationType,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hospital/Clinic">Hospital/Clinic</SelectItem>
                <SelectItem value="HealthTech">HealthTech</SelectItem>
                <SelectItem value="Pharmaceutical">Pharmaceutical</SelectItem>
                <SelectItem value="Biotech">Biotech</SelectItem>
                <SelectItem value="Medical Devices">Medical Devices</SelectItem>
                <SelectItem value="Consulting">Consulting</SelectItem>
                <SelectItem value="Public Health/Policy">Public Health/Policy</SelectItem>
                <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                <SelectItem value="Academic/Research">Academic/Research</SelectItem>
                <SelectItem value="Startup">Startup</SelectItem>
                <SelectItem value="VC">VC</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
            <div>
              <Label htmlFor="program">Program</Label>
              <Select
                value={formData.program}
                onValueChange={(value) =>
                  onFormDataChange({
                    ...formData,
                    program: value as typeof formData.program,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MBA-PGDBM">MBA-PGDBM</SelectItem>
                  <SelectItem value="MBA-FABM">MBA-FABM</SelectItem>
                  <SelectItem value="MBA-PGPX">MBA-PGPX</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                  <SelectItem value="MBA-FPGP">MBA-FPGP</SelectItem>
                  <SelectItem value="ePGD-ABA">ePGD-ABA</SelectItem>
                  <SelectItem value="FDP">FDP</SelectItem>
                  <SelectItem value="AFP">AFP</SelectItem>
                  <SelectItem value="SMP">SMP</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="graduation_year">Graduation Year</Label>
              <Input
                id="graduation_year"
                type="number"
                value={formData.graduation_year || ""}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    graduation_year: parseInt(e.target.value) || null,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Organizations */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            Add your work experience and organizational affiliations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizations.map((org, index) => (
            <div key={org.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Organization {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeOrganization(org.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`org-${org.id}-currentOrg`}>
                    Organization Name
                  </Label>
                  {/* <Input
                      id={`org-${org.id}-currentOrg`}
                      value={org.currentOrg}
                      onChange={(e) => updateOrganization(org.id, 'currentOrg', e.target.value)}
                      placeholder="Enter organization name"
                    /> */}
                  <OrganizationSelector
                    value={org.currentOrg}
                    onChange={(value) =>
                      updateOrganization(org.id, "currentOrg", value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`org-${org.id}-orgType`}>
                    Organization Type
                  </Label>
                  <Select
                    value={org.orgType}
                    onValueChange={(value) =>
                      updateOrganization(org.id, "orgType", value)
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
                  <Label htmlFor={`org-${org.id}-experience`}>
                    Experience (Years)
                  </Label>
                  <Input
                    id={`org-${org.id}-experience`}
                    value={org.experience}
                    onChange={(e) =>
                      updateOrganization(org.id, "experience", e.target.value)
                    }
                    placeholder="e.g., 2-3 years"
                  />
                </div>
                <div>
                  <Label htmlFor={`org-${org.id}-role`}>Role/Position</Label>
                  <Input
                    id={`org-${org.id}-role`}
                    value={org.role}
                    onChange={(e) =>
                      updateOrganization(org.id, "role", e.target.value)
                    }
                    placeholder="e.g., Senior Manager"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`org-${org.id}-description`}>Description</Label>
                <Textarea
                  id={`org-${org.id}-description`}
                  value={org.description}
                  onChange={(e) =>
                    updateOrganization(org.id, "description", e.target.value)
                  }
                  placeholder="Describe your role and responsibilities..."
                  rows={3}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addOrganization}
            className="w-full"
          >
            + Add Organization
          </Button>
        </CardContent>
      </Card>

      {/* Preferred Mode of Communication */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Mode of Communication</CardTitle>
          <CardDescription>
            Select your preferred ways to be contacted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(
              [
                "Phone",
                "Email",
                "WhatsApp",
                "LinkedIn",
              ] as PreferredCommunication[]
            ).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option.toLowerCase()}
                  checked={preferredCommunication.includes(option)}
                  onCheckedChange={(checked) =>
                    handlePreferredCommunicationChange(
                      option,
                      checked as boolean
                    )
                  }
                />
                <Label
                  htmlFor={option.toLowerCase()}
                  className="text-sm font-medium"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
          {preferredCommunication.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {preferredCommunication.map((option) => (
                <Badge
                  key={option}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                >
                  {option}
                  <X
                    className="ml-1 h-3 w-3"
                    onClick={() =>
                      handlePreferredCommunicationChange(option, false)
                    }
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      {showAdditional && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, bio: e.target.value })
                }
                placeholder="Tell us about yourself..."
              />
            </div>
            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={skillsInput}
                onChange={(e) => onSkillsInputChange(e.target.value)}
                placeholder="JavaScript, React, Python..."
              />
            </div>
            <div>
              <Label htmlFor="interests">Interests (comma-separated)</Label>
              <Input
                id="interests"
                value={interestsInput}
                onChange={(e) => onInterestsInputChange(e.target.value)}
                placeholder="Technology, Travel, Sports..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  value={formData.linkedin_url || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      linkedin_url: e.target.value,
                    })
                  }
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={formData.website_url || ""}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      website_url: e.target.value,
                    })
                  }
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      {showPrivacy && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Privacy Settings</h3>
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
                checked={Boolean(formData.is_public)}
                onCheckedChange={(checked) =>
                  onFormDataChange({ ...formData, is_public: checked })
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
              <Switch
                id="show_contact_info"
                checked={Boolean(formData.show_contact_info)}
                onCheckedChange={(checked) =>
                  onFormDataChange({ ...formData, show_contact_info: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show_location">Show Location</Label>
                <p className="text-sm text-muted-foreground">
                  Display location information to other users
                </p>
              </div>
              <Switch
                id="show_location"
                checked={Boolean(formData.show_location)}
                onCheckedChange={(checked) =>
                  onFormDataChange({ ...formData, show_location: checked })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
