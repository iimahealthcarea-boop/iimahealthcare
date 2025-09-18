import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Mail, Phone, MapPin, Building, Calendar, Linkedin, Globe } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

export default function MemberDirectory() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [organizationTypeFilter, setOrganizationTypeFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, experienceFilter, organizationTypeFilter]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'approved')
        .eq('is_public', true)
        .order('first_name');

      if (error) throw error;
      
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch members directory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(member => 
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.program?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (experienceFilter && experienceFilter !== 'all') {
      filtered = filtered.filter(member => member.experience_level === experienceFilter);
    }

    if (organizationTypeFilter && organizationTypeFilter !== 'all') {
      filtered = filtered.filter(member => member.organization_type === organizationTypeFilter);
    }

    setFilteredMembers(filtered);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading members...</p>
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
            Search Members
          </CardTitle>
          <CardDescription>
            Find alumni by name, organization, or other criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, organization, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="experience">Experience Level</Label>
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
              <Label htmlFor="orgType">Organization Type</Label>
              <Select value={organizationTypeFilter} onValueChange={setOrganizationTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All organization types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organization types</SelectItem>
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
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>Showing {filteredMembers.length} of {members.length} members</span>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                  {getInitials(member.first_name, member.last_name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {member.first_name} {member.last_name}
                  </h3>
                  
                  {member.position && (
                    <p className="text-sm text-muted-foreground truncate">
                      {member.position}
                    </p>
                  )}
                  
                  {member.organization && (
                    <div className="flex items-center gap-1 mt-1">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground truncate">
                        {member.organization}
                      </p>
                    </div>
                  )}
                  
                  {(member.city || member.country) && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground truncate">
                        {member.city}{member.city && member.country && ', '}{member.country}
                      </p>
                    </div>
                  )}

                  {member.program && (
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground truncate">
                        {member.program}
                        {member.graduation_year && ` (${member.graduation_year})`}
                      </p>
                    </div>
                  )}

                  {/* Contact Info (only if member allows it) */}
                  {member.show_contact_info && (
                    <div className="mt-3 space-y-1">
                      {member.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a href={`mailto:${member.email}`} className="text-xs text-blue-600 hover:underline truncate">
                            {member.email}
                          </a>
                        </div>
                      )}
                      
                      {member.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a href={`tel:${member.phone}`} className="text-xs text-blue-600 hover:underline">
                            {member.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="flex gap-2 mt-3">
                    {member.linkedin_url && (
                      <a 
                        href={member.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    
                    {member.website_url && (
                      <a 
                        href={member.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="mt-3 space-y-2">
                    {member.experience_level && (
                      <Badge variant="secondary" className="text-xs">
                        {member.experience_level}
                      </Badge>
                    )}
                    
                    {member.organization_type && (
                      <Badge variant="outline" className="text-xs ml-1">
                        {member.organization_type}
                      </Badge>
                    )}
                  </div>

                  {/* Skills */}
                  {member.skills && member.skills.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {member.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {member.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No members found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters to see more results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}