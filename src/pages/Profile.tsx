import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, X } from "lucide-react";

type OrganizationType = 'Corporate' | 'Startup' | 'Non-Profit' | 'Government' | 'Consulting' | 'Education' | 'Healthcare' | 'Technology' | 'Finance' | 'Other';
type ExperienceLevel = 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Executive' | 'Student' | 'Recent Graduate';
type ProfileStatus = 'Active' | 'Alumni' | 'Student' | 'Faculty' | 'Inactive';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  program: string | null;
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
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interestsInput, setInterestsInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      await fetchProfile(user.id);
    };

    getUser();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
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
        setProfile(data);
        setInterestsInput(data.interests?.join(", ") || "");
        setSkillsInput(data.skills?.join(", ") || "");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setSaving(true);
    try {
      const interests = interestsInput
        .split(",")
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      const skills = skillsInput
        .split(",")
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const { error } = await supabase
        .from("profiles")
        .update({
          ...profile,
          interests,
          skills,
        })
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
      .map(item => item.trim())
      .filter(item => item !== interest);
    setInterestsInput(newInterests.join(", "));
  };

  const removeSkill = (skill: string) => {
    const newSkills = skillsInput
      .split(",")
      .map(item => item.trim())
      .filter(item => item !== skill);
    setSkillsInput(newSkills.join(", "));
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profile.first_name || ""}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profile.last_name || ""}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="program">Program</Label>
                <Input
                  id="program"
                  value={profile.program || ""}
                  onChange={(e) => setProfile({ ...profile, program: e.target.value })}
                  placeholder="e.g., MBA, PGDM"
                />
              </div>
              <div>
                <Label htmlFor="graduation_year">Graduation Year</Label>
                <Input
                  id="graduation_year"
                  type="number"
                  value={profile.graduation_year || ""}
                  onChange={(e) => setProfile({ ...profile, graduation_year: parseInt(e.target.value) || null })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={profile.organization || ""}
                  onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="organization_type">Organization Type</Label>
                <Select
                  value={profile.organization_type || ""}
                  onValueChange={(value: OrganizationType) => setProfile({ ...profile, organization_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                    <SelectItem value="Startup">Startup</SelectItem>
                    <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                    <SelectItem value="Government">Government</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={profile.position || ""}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="experience_level">Experience Level</Label>
                <Select
                  value={profile.experience_level || ""}
                  onValueChange={(value: ExperienceLevel) => setProfile({ ...profile, experience_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entry Level">Entry Level</SelectItem>
                    <SelectItem value="Mid Level">Mid Level</SelectItem>
                    <SelectItem value="Senior Level">Senior Level</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Recent Graduate">Recent Graduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city || ""}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profile.country || ""}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Full Location</Label>
                <Input
                  id="location"
                  value={profile.location || ""}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="e.g., Mumbai, India"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  value={profile.linkedin_url || ""}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={profile.website_url || ""}
                  onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interests & Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Interests & Skills</CardTitle>
            <CardDescription>
              Enter comma-separated values. Click on tags to remove them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="interests">Interests</Label>
              <Input
                id="interests"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="e.g., Technology, Finance, Entrepreneurship"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {interestsInput.split(",").map(interest => interest.trim()).filter(Boolean).map((interest, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground">
                    {interest}
                    <X 
                      className="ml-1 h-3 w-3" 
                      onClick={() => removeInterest(interest)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g., Leadership, Analytics, Marketing"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {skillsInput.split(",").map(skill => skill.trim()).filter(Boolean).map((skill, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground">
                    {skill}
                    <X 
                      className="ml-1 h-3 w-3" 
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_public">Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your profile in the directory
                </p>
              </div>
              <Switch
                id="is_public"
                checked={profile.is_public}
                onCheckedChange={(checked) => setProfile({ ...profile, is_public: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show_contact_info">Show Contact Information</Label>
                <p className="text-sm text-muted-foreground">
                  Display email, phone, and LinkedIn to other users
                </p>
              </div>
              <Switch
                id="show_contact_info"
                checked={profile.show_contact_info}
                onCheckedChange={(checked) => setProfile({ ...profile, show_contact_info: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show_location">Show Location</Label>
                <p className="text-sm text-muted-foreground">
                  Display your location information to other users
                </p>
              </div>
              <Switch
                id="show_location"
                checked={profile.show_location}
                onCheckedChange={(checked) => setProfile({ ...profile, show_location: checked })}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={profile.status || ""}
                onValueChange={(value: ProfileStatus) => setProfile({ ...profile, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Faculty">Faculty</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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