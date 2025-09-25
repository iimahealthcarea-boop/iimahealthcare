import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCountries } from '@/hooks/useCountries';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { OrganizationSelector } from '@/components/OrganizationSelector';
import { addProfileChange } from '@/utils/profileChangeTracker';

export default function Registration() {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { countries, loading: countriesLoading } = useCountries();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    country_code: '',
    address: '',
    date_of_birth: '',
    city: '',
    country: '',
    organization: '',
    position: '',
    program: '',
    experience_level: '',
    organization_type: '',
    graduation_year: '',
    bio: '',
    skills: '',
    interests: '',
    linkedin_url: '',
    website_url: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Required fields validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Email validation (user email from auth)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (user?.email && !emailPattern.test(user.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation (international format)
    const phonePattern = /^(\+\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/;
    if (formData.phone && !phonePattern.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (e.g., +91XXXXXXXXXX)';
    }

    // URL validations
    if (formData.linkedin_url && formData.linkedin_url.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.linkedin_url)) {
        newErrors.linkedin_url = 'Please enter a valid URL starting with http:// or https://';
      }
    }

    if (formData.website_url && formData.website_url.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.website_url)) {
        newErrors.website_url = 'Please enter a valid URL starting with http:// or https://';
      }
    }

    // Graduation year validation
    if (formData.graduation_year) {
      const currentYear = new Date().getFullYear();
      const gradYear = parseInt(formData.graduation_year);
      if (gradYear < 1950 || gradYear > currentYear + 10) {
        newErrors.graduation_year = `Please enter a valid graduation year between 1950 and ${currentYear + 10}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      const interestsArray = formData.interests.split(',').map(s => s.trim()).filter(s => s);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          country_code: formData.country_code,
          address: formData.address,
          date_of_birth: formData.date_of_birth || null,
          city: formData.city,
          country: formData.country,
          organization: formData.organization,
          position: formData.position,
          program: formData.program,
          experience_level: formData.experience_level as "Entry Level" | "Mid Level" | "Senior Level" | "Executive" | "Student" | "Recent Graduate",
          organization_type: formData.organization_type as "Corporate" | "Startup" | "Non-Profit" | "Government" | "Consulting" | "Education" | "Healthcare" | "Technology" | "Finance" | "Other",
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
          bio: formData.bio,
          skills: skillsArray,
          interests: interestsArray,
          linkedin_url: formData.linkedin_url,
          website_url: formData.website_url,
          approval_status: 'pending'
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      // Track profile creation
      const userName = `${formData.first_name} ${formData.last_name}`.trim() || user?.email || 'User';
      const creationFields = {
        approval_status: { oldValue: null, newValue: 'pending' },
        first_name: { oldValue: null, newValue: formData.first_name },
        last_name: { oldValue: null, newValue: formData.last_name },
        organization: { oldValue: null, newValue: formData.organization },
        position: { oldValue: null, newValue: formData.position }
      };

      try {
        await addProfileChange(
          user?.id || '',
          user?.id || '',
          userName,
          creationFields,
          'create'
        );
      } catch (changeError) {
        console.error('Failed to track profile creation:', changeError);
        // Don't fail the registration if change tracking fails
      }

      await refreshUserData();
      
      toast({
        title: "Registration Submitted",
        description: "Your profile has been submitted for admin approval. You'll be notified once it's reviewed.",
      });
      
      navigate('/waiting-approval');
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
                Please fill in your complete profile details. Your registration will be reviewed by an administrator.
              </CardDescription>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                
                {/* Country Selection First */}
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select 
                    onValueChange={(value) => {
                      const selectedCountry = countries.find(c => c.name === value);
                      setFormData({
                        ...formData, 
                        country: value,
                        country_code: selectedCountry?.dialCode || ''
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      required
                      className={errors.first_name ? 'border-red-500' : ''}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      required
                      className={errors.last_name ? 'border-red-500' : ''}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.country_code}
                        onValueChange={(value) => setFormData({...formData, country_code: value})}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.dialCode}>
                              {country.flag} {country.dialCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        className={`flex-1 ${errors.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Enter your city"
                  />
                </div>
              </div>


              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organization">Organization</Label>
                    <OrganizationSelector
                      value={formData.organization}
                      onChange={(value) => setFormData({...formData, organization: value})}
                      placeholder="Search or add organization..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience_level">Experience Level</Label>
                    <Select onValueChange={(value) => setFormData({...formData, experience_level: value})}>
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
                  </div>
                  <div>
                    <Label htmlFor="organization_type">Organization Type</Label>
                    <Select onValueChange={(value) => setFormData({...formData, organization_type: value})}>
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
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="program">Program/Course</Label>
                    <Input
                      id="program"
                      value={formData.program}
                      onChange={(e) => setFormData({...formData, program: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="graduation_year">Graduation Year</Label>
                    <Input
                      id="graduation_year"
                      type="number"
                      min="1950"
                      max="2040"
                      value={formData.graduation_year}
                      onChange={(e) => setFormData({...formData, graduation_year: e.target.value})}
                      className={errors.graduation_year ? 'border-red-500' : ''}
                    />
                    {errors.graduation_year && (
                      <p className="text-sm text-red-500 mt-1">{errors.graduation_year}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                    <Input
                      id="skills"
                      value={formData.skills}
                      onChange={(e) => setFormData({...formData, skills: e.target.value})}
                      placeholder="JavaScript, React, Python..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="interests">Interests (comma-separated)</Label>
                    <Input
                      id="interests"
                      value={formData.interests}
                      onChange={(e) => setFormData({...formData, interests: e.target.value})}
                      placeholder="Technology, Travel, Sports..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className={errors.linkedin_url ? 'border-red-500' : ''}
                    />
                    {errors.linkedin_url && (
                      <p className="text-sm text-red-500 mt-1">{errors.linkedin_url}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                      placeholder="https://yourwebsite.com"
                      className={errors.website_url ? 'border-red-500' : ''}
                    />
                    {errors.website_url && (
                      <p className="text-sm text-red-500 mt-1">{errors.website_url}</p>
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