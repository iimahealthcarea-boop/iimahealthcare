import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Search, Users, Mail, Phone, MapPin, Building, Calendar, Linkedin, Globe, MoreVertical, Plus, X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

export default function MemberDirectory() {
  const [allMembers, setAllMembers] = useState<Profile[]>([]);
  const [directoryMembers, setDirectoryMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [organizationTypeFilter, setOrganizationTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [userDirectoryIds, setUserDirectoryIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    fetchAllMembers();
    if (user) {
      fetchDirectoryMembers();
    }
  }, [user]);

  useEffect(() => {
    filterMembers();
  }, [allMembers, directoryMembers, searchTerm, experienceFilter, organizationTypeFilter, activeTab]);

  const fetchAllMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'approved')
        .eq('is_public', true)
        .order('first_name');

      if (error) throw error;
      
      setAllMembers(data || []);
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

  const fetchDirectoryMembers = async () => {
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
      
      // Update userDirectoryIds for quick lookup
      const ids = new Set<string>();
      directoryData.forEach((item: any) => {
        if (item.member_id) {
          ids.add(item.member_id);
        }
      });
      setUserDirectoryIds(ids);
      
    } catch (error: any) {
      console.error('Error fetching directory:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your directory",
        variant: "destructive",
      });
    } finally {
      setDirectoryLoading(false);
    }
  };

  const addToDirectory = async (memberId: string) => {
    if (!user) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error('No access token');
      }

      const response = await supabase.functions.invoke('directory-add', {
        body: { member_id: memberId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) throw response.error;

      // Update local state
      setUserDirectoryIds(prev => new Set([...prev, memberId]));
      
      toast({
        title: "Success",
        description: "Member added to your directory",
      });
      
      // Refresh directory
      fetchDirectoryMembers();
      
    } catch (error: any) {
      console.error('Error adding to directory:', error);
      toast({
        title: "Error",
        description: "Failed to add member to directory",
        variant: "destructive",
      });
    }
  };

  const removeFromDirectory = async (memberId: string) => {
    if (!user) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error('No access token');
      }

      const response = await supabase.functions.invoke('directory-remove', {
        body: { member_id: memberId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) throw response.error;

      // Update local state
      setUserDirectoryIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
      
      toast({
        title: "Success",
        description: "Member removed from your directory",
      });
      
      // Refresh directory
      fetchDirectoryMembers();
      
    } catch (error: any) {
      console.error('Error removing from directory:', error);
      toast({
        title: "Error",
        description: "Failed to remove member from directory",
        variant: "destructive",
      });
    }
  };

  const filterMembers = () => {
    let baseMembers = activeTab === 'directory' 
      ? directoryMembers.map(item => item.profiles).filter(Boolean)
      : allMembers;
    
    let filtered = baseMembers;

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

  if (loading || (activeTab === 'directory' && directoryLoading)) {
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
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="directory">My Directory</TabsTrigger>
          <TabsTrigger value="all">All Members</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
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
            <span>Showing {filteredMembers.length} of {allMembers.length} members</span>
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar_url || ''} alt={`${member.first_name} ${member.last_name}`} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg truncate">
                          {member.first_name} {member.last_name}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => addToDirectory(member.user_id)}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Add to Directory
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => removeFromDirectory(member.user_id)}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove from Directory
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
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
        </TabsContent>

        <TabsContent value="directory" className="space-y-6">
          {/* Search and Filters for Directory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search My Directory
              </CardTitle>
              <CardDescription>
                Find members in your personal directory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search-directory">Search</Label>
                  <Input
                    id="search-directory"
                    placeholder="Search by name, organization, position..."
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

          {/* Results Count for Directory */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Showing {filteredMembers.length} of {directoryMembers.length} directory members</span>
          </div>

          {/* Directory Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar_url || ''} alt={`${member.first_name} ${member.last_name}`} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg truncate">
                          {member.first_name} {member.last_name}
                        </h3>
                        {user && (
                          <Button
                            variant={userDirectoryIds.has(member.user_id) ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => 
                              userDirectoryIds.has(member.user_id) 
                                ? removeFromDirectory(member.user_id)
                                : addToDirectory(member.user_id)
                            }
                          >
                            {userDirectoryIds.has(member.user_id) ? (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                Remove
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                  
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
                <h3 className="text-lg font-semibold mb-2">No directory members found</h3>
                <p className="text-muted-foreground">
                  {directoryMembers.length === 0 
                    ? "You haven't added any members to your directory yet. Go to 'All Members' to add some."
                    : "Try adjusting your search criteria or filters to see more results."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}