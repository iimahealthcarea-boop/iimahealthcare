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
import { CitySelector } from "@/components/CitySelector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCountries } from "@/hooks/useCountries";
import { Button } from "./ui/button";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { SectionDivider } from "./SectionDivider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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

interface ProfileSharedSectionsProps {
  formData: Partial<ProfileSharedFormData>;
  onFormDataChange: (newData: Partial<ProfileSharedFormData>) => void;
  handlePreferredCommunicationChange: (value: PreferredCommunication, checked: boolean) => void;
  skillsInput: string;
  onSkillsInputChange: (value: string) => void;
  interestsInput: string;
  onInterestsInputChange: (value: string) => void;
  showPersonal?: boolean;
  showProfessional?: boolean;
  showAdditional?: boolean;
  showPrivacy?: boolean;
  /** When true, the DOB field is read-only/locked (e.g., after admin approval) */
  lockDob?: boolean;
  /** Parent-provided validation errors keyed by field name */
  fieldErrors?: { [key: string]: string };
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

const SKILL_OPTIONS: string[] = [
  "Operations Management",
  "Strategy and Business Development",
  "Product Management",
  "Marketing and Sales",
  "Supply Chain Management",
  "Finance and Investment",
  "Digital Health / AI / ML",
  "Public Health / Policy",
  "Regulatory Affairs / Compliance",
  "Clinical Research",
  "Health Economics",
  "Other",
];

const CONTRIBUTION_OPTIONS: string[] = [
  "Mentorship",
  "Guest Lectures / Speaking Engagements",
  "Startup Collaboration",
  "Investment Opportunities",
  "Recruitment / Job Referrals",
  "Public Health Initiatives",
  "Research Collaborations",
  "Other",
];

export const ProfileSharedSections: React.FC<ProfileSharedSectionsProps> = ({
  formData,
  onFormDataChange,
  // handlePreferredCommunicationChange,
  skillsInput,
  onSkillsInputChange,
  interestsInput,
  onInterestsInputChange,
  showPersonal = true,
  showProfessional = true,
  showAdditional = true,
  showPrivacy = true,
  lockDob = false,
  fieldErrors = {},
}) => {
  const { countries, loading: countriesLoading } = useCountries();
  const [organizations, setOrganizations] = useState<Organization[]>(
    formData.organizations || []
  );
  const [preferredCommunication, setPreferredCommunication] = useState<
    PreferredCommunication[]
  >(formData?.preferred_mode_of_communication || []);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
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
      onFormDataChange({ ...formData, preferred_mode_of_communication: [...formData.preferred_mode_of_communication, value] });
    } else {
      setPreferredCommunication((prev) =>
        prev.filter((item) => item !== value)
      );
      onFormDataChange({ ...formData, preferred_mode_of_communication: formData.preferred_mode_of_communication.filter((item) => item !== value) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      {showPersonal && (
        <div className="space-y-4">
          <SectionDivider title="Personal Information" />

          {/* <h3 className="text-lg font-semibold">Personal Information</h3> */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, first_name: e.target.value })
                }
                className={fieldErrors.first_name ? "border-red-500" : ""}
              />
              {fieldErrors.first_name && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.first_name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, last_name: e.target.value })
                }
                className={fieldErrors.last_name ? "border-red-500" : ""}
              />
              {fieldErrors.last_name && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.last_name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth || ""}
                max={(() => {
                  const today = new Date();
                  // Set max to today minus 15 years to enforce minimum age 15
                  const maxDate = new Date(
                    today.getFullYear() - 15,
                    today.getMonth(),
                    today.getDate()
                  );
                  const y = maxDate.getFullYear();
                  const m = String(maxDate.getMonth() + 1).padStart(2, "0");
                  const d = String(maxDate.getDate()).padStart(2, "0");
                  return `${y}-${m}-${d}`;
                })()}
                disabled={lockDob}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    date_of_birth: e.target.value,
                  })
                }
                className={fieldErrors.date_of_birth ? "border-red-500" : ""}
              />
              {lockDob && (
                <p className="text-sm text-muted-foreground mt-1">
                  Date of birth is locked after admin approval.
                </p>
              )}
              {fieldErrors.date_of_birth && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.date_of_birth}</p>
              )}
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(value) =>
                  onFormDataChange({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  
                </SelectContent>
              </Select>
              {fieldErrors.gender && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.gender}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="city">Current City *</Label>
            <CitySelector
              value={formData.city}
              onChange={(value) =>
                onFormDataChange({ ...formData, city: value })
              }
              placeholder="Select or add your city"
              country={formData.country}
            />
            {fieldErrors.city && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.city}</p>
            )}
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Select
              onValueChange={(value) => {
                const selectedCountry = countries.find((c) => c.name === value);
                onFormDataChange({
                  ...formData,
                  country: value,
                  country_code: selectedCountry?.dialCode || "",
                });
              }}
              value={formData.country}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your country first" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.country && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.country}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Permanent Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                onFormDataChange({ ...formData, address: e.target.value })
              }
              required
              className={fieldErrors.address ? "border-red-500" : ""}
            />
            {fieldErrors.address && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.address}</p>
            )}
          </div>
          <div>
            <Label htmlFor="pincode">Pincode/ZIP Code *</Label>
            <Input
              id="pincode"
              value={formData.pincode}
              onChange={(e) =>
                onFormDataChange({ ...formData, pincode: e.target.value })
              }
              placeholder="Enter your pincode/ZIP code"
              className={fieldErrors.pincode ? "border-red-500" : ""}
            />
            {fieldErrors.pincode && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.pincode}</p>
            )}
          </div>
        </div>
      )}
      <div className="space-y-4">
        <SectionDivider title="Contact Information" />
        <div className="flex flex-col gap-4">
          <div className="">
            <Label>Phone Number *</Label>
            <div className="flex gap-2">
              <Select
                value={formData.country_code}
                onValueChange={(value) =>
                  onFormDataChange({ ...formData, country_code: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country, index) => (
                    <SelectItem
                      key={`${country.code}-${country.dialCode}-${index}`}
                      value={country.dialCode}
                    >
                      {country.flag} {country.dialCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            {fieldErrors?.country_code && (
              <p className="text-sm text-red-500 mt-1">
                {fieldErrors.country_code}
              </p>
            )}
              <Input
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) =>
                  onFormDataChange({ ...formData, phone: e.target.value })
                }
                required
              className={`flex-1 ${fieldErrors.phone ? "border-red-500" : ""}`}
              />
            </div>
          {fieldErrors.phone && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.phone}</p>
          )}
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  email: e.target.value,
                })
              }
            className={fieldErrors.email ? "border-red-500" : ""}
            />
          {fieldErrors.email && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>
          )}
          </div>
          <div>
            <Label htmlFor="altEmail">Alternate Email</Label>
            <Input
              id="altEmail"
              placeholder="example@email.com"
              type="email"
              value={formData.altEmail || ""}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  altEmail: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  linkedin_url: e.target.value,
                })
              }
              placeholder="https://linkedin.com/in/yourprofile"
            className={fieldErrors.linkedin_url ? "border-red-500" : ""}
            />
          {fieldErrors.linkedin_url && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.linkedin_url}</p>
          )}
          </div>
          <div>
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  website_url: e.target.value,
                })
              }
              placeholder="https://yourwebsite.com"
            className={fieldErrors.website_url ? "border-red-500" : ""}
            />
          {fieldErrors.website_url && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.website_url}</p>
          )}
          </div>
          <div>
            <Label htmlFor="other_social_media_handles">
              Any Other Social Media Handles
            </Label>
            <Input
              id="other_social_media_handles"
              type="url"
              value={formData.other_social_media_handles}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  other_social_media_handles: e.target.value,
                })
              }
              placeholder="Any other social media handles"
              className={
                errors.other_social_media_handles ? "border-red-500" : ""
              }
            />
            {errors.other_social_media_handles && (
              <p className="text-sm text-red-500 mt-1">
                {errors.other_social_media_handles}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Professional Information */}
      {showProfessional && (
        <div className="space-y-4">
          <SectionDivider title="Professional Information" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="program">Program *</Label>
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
              {fieldErrors.program && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.program}</p>
              )}
            </div>
            <div>
              <Label htmlFor="graduation_year">Graduation Year *</Label>
              <Input
                id="graduation_year"
                type="number"
                min="1950"
                max="2040"
                value={formData.graduation_year}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    graduation_year: parseInt(e.target.value),
                  })
                }
                className={fieldErrors.graduation_year ? "border-red-500" : ""}
              />
              {fieldErrors.graduation_year && (
                <p className="text-sm text-red-500 mt-1">
                  {fieldErrors.graduation_year}
                </p>
              )}
            </div>
          </div>

          {/* Current Organization */}

          <div className="space-y-4">
            <h4 className="font-medium">Current Organization</h4>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-medium">Current Organization</h5>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Organization Name</Label>
                  <OrganizationSelector
                    value={formData?.organizations?.[0]?.currentOrg}
                    onChange={(value) =>
                      onFormDataChange({
                        ...formData,
                        organizations: (
                          formData.organizations && formData.organizations.length > 0
                            ? formData.organizations
                            : [
                                {
                                  id: Date.now().toString(),
                                  currentOrg: "",
                                  orgType: "",
                                  experience: "",
                                  description: "",
                                  role: "",
                                } as Organization,
                              ]
                        ).map((o, index) => (index === 0 ? { ...o, currentOrg: value } : o)),
                      })
                    }
                  />
                </div>
                {fieldErrors[`organizations_0_currentOrg`] && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldErrors[`organizations_0_currentOrg`]}
                  </p>
                )}
                <div>
                  <Label>Organization Type</Label>
                  <Select
                    value={formData?.organizations?.[0]?.orgType}
                    onValueChange={(value) =>
                      onFormDataChange({
                        ...formData,
                        organizations: (
                          formData.organizations && formData.organizations.length > 0
                            ? formData.organizations
                            : [
                                {
                                  id: Date.now().toString(),
                                  currentOrg: "",
                                  orgType: "",
                                  experience: "",
                                  description: "",
                                  role: "",
                                } as Organization,
                              ]
                        ).map((o, index) => (index === 0 ? { ...o, orgType: value } : o)),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
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
                  {fieldErrors[`organizations_0_orgType`] && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors[`organizations_0_orgType`]}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Experience (Years)</Label>
                  <Input
                    value={formData?.organizations?.[0]?.experience}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        organizations: (
                          formData.organizations && formData.organizations.length > 0
                            ? formData.organizations
                            : [
                                {
                                  id: Date.now().toString(),
                                  currentOrg: "",
                                  orgType: "",
                                  experience: "",
                                  description: "",
                                  role: "",
                                } as Organization,
                              ]
                        ).map((o, index) =>
                          index === 0 ? { ...o, experience: e?.target.value } : o
                        ),
                      })
                    }
                    placeholder="e.g., 2-3 years"
                  />
                </div>
                <div>
                  <Label>Role/Position</Label>
                  <Input
                    value={formData?.organizations?.[0]?.role}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        organizations: (
                          formData.organizations && formData.organizations.length > 0
                            ? formData.organizations
                            : [
                                {
                                  id: Date.now().toString(),
                                  currentOrg: "",
                                  orgType: "",
                                  experience: "",
                                  description: "",
                                  role: "",
                                } as Organization,
                              ]
                        ).map((o, index) => (index === 0 ? { ...o, role: e.target.value } : o)),
                      })
                    }
                    placeholder="e.g., Senior Manager"
                  />
                  {fieldErrors[`organizations_0_role`] && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors[`organizations_0_role`]}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData?.organizations?.[0]?.description}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      organizations: (
                        formData.organizations && formData.organizations.length > 0
                          ? formData.organizations
                          : [
                              {
                                id: Date.now().toString(),
                                currentOrg: "",
                                orgType: "",
                                experience: "",
                                description: "",
                                role: "",
                              } as Organization,
                            ]
                      ).map((o, index) =>
                        index === 0 ? { ...o, description: e?.target.value } : o
                      ),
                    })
                  }
                  placeholder="Describe your role and responsibilities..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          {/* Other Organizations */}
          <div className="space-y-4">
            
            {(formData.organizations || []).slice(1).map((org, index) => (
              <div key={org.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Organization {index + 2}</h5>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onFormDataChange({
                        ...formData,
                        organizations: (formData.organizations || []).filter(
                          (o) => o.id !== org.id
                        ),
                      })
                    }
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Organization Name</Label>
                    <OrganizationSelector
                      value={org?.currentOrg}
                      onChange={(value) =>
                        onFormDataChange({
                          ...formData,
                          organizations: (formData.organizations || []).map((o) =>
                            o.id === org.id ? { ...o, currentOrg: value } : o
                          ),
                        })
                      }
                    />
                  </div>
                  {fieldErrors[`organizations_${index + 1}_currentOrg`] && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors[`organizations_${index + 1}_currentOrg`]}
                    </p>
                  )}
                  <div>
                    <Label>Organization Type</Label>
                    <Select
                      value={org.orgType}
                      onValueChange={(value) =>
                        onFormDataChange({
                          ...formData,
                          organizations: (formData.organizations || []).map((o) =>
                            o.id === org.id ? { ...o, orgType: value } : o
                          ),
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
                    {fieldErrors[`organizations_${index + 1}_orgType`] && (
                      <p className="text-sm text-red-500 mt-1">
                        {fieldErrors[`organizations_${index + 1}_orgType`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Experience (Years)</Label>
                    <Input
                      value={org.experience}
                      onChange={(e) =>
                        onFormDataChange({
                          ...formData,
                          organizations: (formData.organizations || []).map((o) =>
                            o.id === org.id
                              ? { ...o, experience: e.target.value }
                              : o
                          ),
                        })
                      }
                      placeholder="e.g., 2-3 years"
                    />
                  </div>
                  <div>
                    <Label>Role/Position</Label>
                    <Input
                      value={org.role}
                      onChange={(e) =>
                        onFormDataChange({
                          ...formData,
                          organizations: (formData.organizations || []).map((o) =>
                            o.id === org.id ? { ...o, role: e.target.value } : o
                          ),
                        })
                      }
                      placeholder="e.g., Senior Manager"
                    />
                    {fieldErrors[`organizations_${index + 1}_role`] && (
                      <p className="text-sm text-red-500 mt-1">
                        {fieldErrors[`organizations_${index + 1}_role`]}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={org.description}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        organizations: (formData.organizations || []).map((o) =>
                          o.id === org.id
                            ? { ...o, description: e.target.value }
                            : o
                        ),
                      })
                    }
                    placeholder="Describe your role and responsibilities..."
                    rows={3}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center">
              {/* <h4 className="font-medium">Other Organizations</h4> */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newOrg = {
                    id: Date.now().toString(),
                    currentOrg: "",
                    orgType: "",
                    experience: "",
                    description: "",
                    role: "",
                  } as Organization;
                  onFormDataChange({
                    ...formData,
                    organizations: [...(formData.organizations || []), newOrg],
                  });
                }}
              >
                + Add More Organization
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preferred Mode of Communication */}
      <div className="space-y-4">
        <SectionDivider title="Preferred Mode of Communication" />

      {/* <Card>
        <CardHeader>
          <CardTitle>Preferred Mode of Communication</CardTitle>
          <CardDescription>
            Select your preferred ways to be contacted
          </CardDescription>
        </CardHeader> */}
        <div className="space-y-4">
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
              {preferredCommunication?.map((option) => (
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
          {fieldErrors.preferred_mode_of_communication && (
            <p className="text-sm text-red-500 mt-1">
              {fieldErrors.preferred_mode_of_communication}
            </p>
          )}
        </div>
      </div>

      {/* Mentoring & Contributions */}
      <div className="space-y-4">
        <SectionDivider title="Mentoring & Contributions" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Willingness to Mentor or Collaborate with Fellow Alumni</Label>
            <Select
              value={(formData.willing_to_mentor as "Yes" | "No" | "Maybe" | undefined) || ""}
              onValueChange={(v) =>
                onFormDataChange({
                  ...formData,
                  willing_to_mentor: v as "Yes" | "No" | "Maybe",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Yes / No / Maybe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Maybe">Maybe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Areas You're Open to Contributing In</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between w-full">
                  <span>
                    {(formData.areas_of_contribution || []).length > 0
                      ? `${(formData.areas_of_contribution || []).length} selected`
                      : "Select areas of contribution"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search areas..." />
                  <CommandList>
                    <CommandEmpty>No areas found.</CommandEmpty>
                    <CommandGroup>
                      {CONTRIBUTION_OPTIONS.map((option) => {
                        const isChecked = (formData.areas_of_contribution || []).includes(option);
                        return (
                          <CommandItem
                            key={option}
                            value={option}
                            onSelect={() => {
                              const base = formData.areas_of_contribution || [];
                              const updated = base.includes(option)
                                ? base.filter((s) => s !== option)
                                : [...base, option];
                              onFormDataChange({
                                ...formData,
                                areas_of_contribution: updated,
                              });
                            }}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="truncate pr-2">{option}</span>
                            {isChecked ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span className="h-4 w-4" />
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {(formData.areas_of_contribution || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(formData.areas_of_contribution || []).map((area) => (
                  <Badge key={area} variant="secondary" className="cursor-pointer">
                    {area}
                    <X
                      className="ml-1 h-3 w-3"
                      onClick={() => {
                        const base = formData.areas_of_contribution || [];
                        const updated = base.filter((s) => s !== area);
                        onFormDataChange({
                          ...formData,
                          areas_of_contribution: updated,
                        });
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {showAdditional && (
        <div className="space-y-4">
          <SectionDivider title="Additional Information" />

          {/* <h3 className="text-lg font-semibold">Additional Information</h3> */}
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
                className={fieldErrors.bio ? "border-red-500" : ""}
              />
              {fieldErrors.bio && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.bio}</p>
              )}
            </div>
            <div>
              <Label htmlFor="skills">Primary Areas of Expertise</Label>
              <div className="flex flex-col gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between">
                      <span>
                        {(() => {
                          const selected = (skillsInput || "")
                            .split(",")
                            .map((s) => s.trim())
                            .filter((s) => s.length > 0);
                          return selected.length > 0
                            ? `${selected.length} selected`
                            : "Select skills";
                        })()}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search skills..." />
                      <CommandList>
                        <CommandEmpty>No skills found.</CommandEmpty>
                        <CommandGroup>
                          {SKILL_OPTIONS.map((option) => {
                            const selected = (skillsInput || "")
                              .split(",")
                              .map((s) => s.trim())
                              .filter((s) => s.length > 0);
                            const isChecked = selected.includes(option);
                            return (
                              <CommandItem
                                key={option}
                                value={option}
                                onSelect={() => {
                                  const base = (skillsInput || "")
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter((s) => s.length > 0);
                                  const updated = isChecked
                                    ? base.filter((s) => s !== option)
                                    : [...base, option];
                                  onSkillsInputChange(updated.join(", "));
                                }}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="truncate pr-2">{option}</span>
                                {isChecked ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <span className="h-4 w-4" />
                                )}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {(() => {
                  const selected = (skillsInput || "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                  return selected.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selected.map((skill) => (
                        <Badge key={skill} variant="secondary" className="cursor-pointer">
                          {skill}
                          <X
                            className="ml-1 h-3 w-3"
                            onClick={() => {
                              const base = (skillsInput || "")
                                .split(",")
                                .map((s) => s.trim())
                                .filter((s) => s.length > 0);
                              const updated = base.filter((s) => s !== skill);
                              onSkillsInputChange(updated.join(", "));
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
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
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      {showPrivacy && (
        <div className="space-y-4">
          <SectionDivider title="Privacy Settings" />

          {/* <h3 className="text-lg font-semibold">Privacy Settings</h3> */}
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
