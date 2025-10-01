import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStarredProfiles } from '@/hooks/useStarredProfiles';
import { StarButton } from '@/components/StarButton';
import { Search, Users, Mail, Phone, MapPin, Building, Calendar, Linkedin, Globe, ChevronDown, ChevronUp, Eye, UserMinus, BookmarkMinus, Star } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface DirectoryItem {
  profiles: Profile;
  member_id: string;
}

interface DirectoryTabProps {
  onMemberDetails: (member: Profile) => void;
}

export default function DirectoryTab({ onMemberDetails }: DirectoryTabProps) {
  const [directoryMembers, setDirectoryMembers] = useState<DirectoryItem[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [organizationTypeFilter, setOrganizationTypeFilter] = useState('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { isStarred, toggleStar, fetchStarredProfiles } = useStarredProfiles();

  const toggleCardExpansion = (memberId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const fetchDirectoryMembers = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error('No access token');
      }

      const response = await fetch(`https://ndytoqziowlraazwokgt.supabase.co/functions/v1/directory-get`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) throw new Error(result.error);

      const directoryData = result.data || [];
      setDirectoryMembers(directoryData);
      
    } catch (error) {
      console.error('Error fetching directory:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your directory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const removeFromDirectory = async (memberId: string) => {
    if (!user) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error('No access token');
      }

      const response = await fetch(`https://ndytoqziowlraazwokgt.supabase.co/functions/v1/directory-remove/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      if (!result.success && result.error) throw new Error(result.error);
      
      toast({
        title: "Success",
        description: "Member removed from your directory",
      });
      
      fetchDirectoryMembers();
      
    } catch (error) {
      console.error('Error removing from directory:', error);
      toast({
        title: "Error",
        description: "Failed to remove member from directory",
        variant: "destructive",
      });
    }
  };

  const filterMembers = useCallback(() => {
    const baseMembers = directoryMembers.map(item => item.profiles).filter(Boolean);
    let filtered = baseMembers;

    // Filter by starred status first
    if (showStarredOnly) {
      filtered = filtered.filter(member => isStarred(member.user_id));
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(member => {
        const nameMatch = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase().includes(searchLower);
        const organizationMatch = member.organization?.toLowerCase().includes(searchLower) || false;
        const positionMatch = member.position?.toLowerCase().includes(searchLower) || false;
        const programMatch = member.program?.toLowerCase().includes(searchLower) || false;
        const cityMatch = member.city?.toLowerCase().includes(searchLower) || false;
        const countryMatch = member.country?.toLowerCase().includes(searchLower) || false;
        const addressMatch = member.address?.toLowerCase().includes(searchLower) || false;
        const experienceMatch = member.experience_level?.toLowerCase().includes(searchLower) || false;
        const orgTypeMatch = member.organization_type?.toLowerCase().includes(searchLower) || false;
        const graduationYearMatch = member.graduation_year?.toString().includes(searchLower) || false;
        const bioMatch = member.bio?.toLowerCase().includes(searchLower) || false;
        const skillsMatch = member.skills?.some(skill => skill.toLowerCase().includes(searchLower)) || false;
        const interestsMatch = member.interests?.some(interest => interest.toLowerCase().includes(searchLower)) || false;
        const linkedinMatch = member.linkedin_url?.toLowerCase().includes(searchLower) || false;
        const websiteMatch = member.website_url?.toLowerCase().includes(searchLower) || false;
        const emailMatch = member.show_contact_info && member.email?.toLowerCase().includes(searchLower) || false;
        const phoneMatch = member.show_contact_info && member.phone?.toLowerCase().includes(searchLower) || false;
        
        return nameMatch || organizationMatch || positionMatch || programMatch || 
               cityMatch || countryMatch || addressMatch || experienceMatch || 
               orgTypeMatch || graduationYearMatch || bioMatch || skillsMatch || 
               interestsMatch || linkedinMatch || websiteMatch || emailMatch || phoneMatch;
      });
    }

    if (experienceFilter && experienceFilter !== 'all') {
      filtered = filtered.filter(member => member.experience_level === experienceFilter);
    }

    if (organizationTypeFilter && organizationTypeFilter !== 'all' && organizationTypeFilter !== 'All organization types') {
      filtered = filtered.filter(member => member.organization_type === organizationTypeFilter);
    }

    setFilteredMembers(filtered);
  }, [directoryMembers, searchTerm, experienceFilter, organizationTypeFilter, showStarredOnly, isStarred]);

  useEffect(() => {
    if (user) {
      fetchDirectoryMembers();
      fetchStarredProfiles();
    }
  }, [fetchDirectoryMembers, fetchStarredProfiles, user]);

  useEffect(() => {
    filterMembers();
  }, [filterMembers]);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search My Directory
          </CardTitle>
          <CardDescription>
            Find members in your personal directory by name, organization, skills, bio, interests, or any other profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search-directory">Search</Label>
              <Input
                id="search-directory"
                placeholder="Search by name, organization, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
          
            
            <div>
              <Label htmlFor="experience-directory">Experience Level</Label>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All experience levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All experience levels</SelectItem>
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
              <Label htmlFor="orgType-directory">Organization Type</Label>
              <Select value={organizationTypeFilter} onValueChange={setOrganizationTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All organization types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organization types</SelectItem>
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
            <div className="flex items-end">
              <Button
                variant={showStarredOnly ? "default" : "outline"}
                onClick={() => setShowStarredOnly(!showStarredOnly)}
                className="w-full h-10"
              >
                <Star className={`h-4 w-4 mr-2 ${showStarredOnly ? 'fill-current' : ''}`} />
                {showStarredOnly ? 'Show All' : 'Starred Only'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          Showing {filteredMembers.length} of {directoryMembers.length} directory members
          {showStarredOnly && ' (starred only)'}
        </span>
      </div>

      {/* Directory Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => {
          const isExpanded = expandedCards.has(member.id);
          
          return (
            <Card key={member.id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md flex flex-col overflow-hidden">
              <CardContent className="p-0 flex flex-col h-full">
                {/* Header Section */}
                <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/5 to-transparent">
                  {/* Star Button */}
                  {!isAdmin && (
                    <div className="absolute top-4 right-4 z-10">
                      <StarButton
                        isStarred={isStarred(member.user_id)}
                        onToggle={() => toggleStar(member.user_id)}
                        size="sm"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4 pr-8">
                    <Avatar className="w-16 h-16 ring-2 ring-primary/20 flex-shrink-0">
                      <AvatarImage src={member.avatar_url || ''} alt={`${member.first_name} ${member.last_name}`} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground leading-tight mb-1">
                        {member.first_name} {member.last_name}
                      </h3>
                      
                      {member.position && (
                        <p className="text-sm font-medium text-foreground/80 line-clamp-1 mb-1">
                          {member.position}
                        </p>
                      )}
                      
                      {member.organization && (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {member.organization}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Basic Info Section - Always Visible */}
                <div className="px-6 py-4 space-y-3 flex-1">
                  {/* Location */}
                  {(member.city || member.country) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {member.city}{member.city && member.country && ', '}{member.country}
                      </p>
                    </div>
                  )}

                  {/* Program */}
                  {member.program && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {member.program}
                        {member.graduation_year && ` (${member.graduation_year})`}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {member.experience_level && (
                      <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-medium">
                        {member.experience_level}
                      </Badge>
                    )}
                    
                    {member.organization_type && (
                      <Badge variant="outline" className="text-xs px-2.5 py-0.5">
                        {member.organization_type}
                      </Badge>
                    )}
                  </div>

                  {/* Skills Preview - Only show when not expanded */}
                  {!isExpanded && member.skills && member.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {member.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0.5 bg-primary/5">
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted">
                          +{member.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="px-6 pb-4 space-y-3 border-t pt-4 bg-muted/30">
                    {/* Bio */}
                    {member.bio && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">About</h4>
                        <p className="text-sm text-muted-foreground">{member.bio}</p>
                      </div>
                    )}

                    {/* All Skills */}
                    {member.skills && member.skills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide">Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {member.skills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-2 py-0.5 bg-primary/5">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interests */}
                    {member.interests && member.interests.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide">Interests</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {member.interests.map((interest, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    {member.show_contact_info && (member.email || member.phone) && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide">Contact</h4>
                        <div className="space-y-2">
                          {member.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <a href={`mailto:${member.email}`} className="text-sm text-blue-600 hover:underline truncate">
                                {member.email}
                              </a>
                            </div>
                          )}
                          
                          {member.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <a href={`tel:${member.phone}`} className="text-sm text-blue-600 hover:underline">
                                {member.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Social Links */}
                    {(member.linkedin_url || member.website_url) && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide">Links</h4>
                        <div className="flex gap-2">
                          {member.linkedin_url && (
                            <a 
                              href={member.linkedin_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-md hover:bg-blue-50 border border-blue-200"
                            >
                              <Linkedin className="h-4 w-4" />
                              <span>LinkedIn</span>
                            </a>
                          )}
                          
                          {member.website_url && (
                            <a 
                              href={member.website_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors px-3 py-1.5 rounded-md hover:bg-gray-50 border border-gray-200"
                            >
                              <Globe className="h-4 w-4" />
                              <span>Website</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons - Fixed at bottom */}
                <div className="px-6 pb-6 pt-4 border-t bg-muted/20 mt-auto">
                  <div className="flex flex-col gap-2">
                    {/* Primary Actions Row */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCardExpansion(member.id)}
                        className="flex-1 h-9 text-sm font-medium"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Show More
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onMemberDetails(member)}
                        className="flex-1 h-9 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Full Profile
                      </Button>
                    </div>

                    {/* Remove from Directory Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromDirectory(member.user_id)}
                      className="w-full h-9 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <BookmarkMinus className="h-4 w-4 mr-2" />
                      Remove from Directory
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {showStarredOnly ? 'No starred members found' : 'No directory members found'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {directoryMembers.length === 0 
                ? "You haven't added any members to your directory yet. Go to 'All Members' to add some."
                : showStarredOnly
                ? "You haven't starred any members yet. Star some members to see them here."
                : "Try adjusting your search criteria or filters to see more results."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}