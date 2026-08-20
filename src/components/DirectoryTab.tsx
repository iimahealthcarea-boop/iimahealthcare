import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Users, BookmarkMinus } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { matchesOrganization } from '@/utils/organizationSearch';
import MemberFilterBar from '@/components/user/MemberFilterBar';
import MemberListCard from '@/components/user/MemberListCard';

type Profile = Tables<'profiles'>;

interface DirectoryItem {
  profiles: Profile;
  member_id: string;
}

interface StarredProfilesHook {
  isStarred: (profileUserId: string) => boolean;
  toggleStar: (profileUserId: string) => Promise<void>;
}

interface DirectoryTabProps {
  onMemberDetails: (member: Profile) => void;
  directoryMembers: DirectoryItem[];
  loading: boolean;
  onRemoveFromDirectory: () => void;
  starredProfiles: StarredProfilesHook;
}

export default function DirectoryTab({
  onMemberDetails,
  directoryMembers,
  loading,
  onRemoveFromDirectory,
  starredProfiles,
}: DirectoryTabProps) {
  const [filteredMembers, setFilteredMembers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [organizationTypeFilter, setOrganizationTypeFilter] = useState('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const { isStarred, toggleStar } = starredProfiles;

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

  const removeFromDirectory = async (memberId: string) => {
    if (!user) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('No access token');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/directory-remove/${memberId}`, {
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

      onRemoveFromDirectory();

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
        // Match the legacy scalar column and the organizations JSONB array, so
        // members are found by any organization they list.
        const organizationMatch =
          (member.organization?.toLowerCase().includes(searchLower) || false) ||
          matchesOrganization(member.organizations, searchLower);
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
    filterMembers();
  }, [filterMembers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <MemberFilterBar
        idPrefix="network"
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        experienceFilter={experienceFilter}
        onExperienceFilterChange={setExperienceFilter}
        organizationTypeFilter={organizationTypeFilter}
        onOrganizationTypeFilterChange={setOrganizationTypeFilter}
        showStarredOnly={showStarredOnly}
        onShowStarredOnlyChange={setShowStarredOnly}
        showStarFilter={!isAdmin}
        searchPlaceholder="Search your network..."
        resultLabel={`Showing ${filteredMembers.length} of ${directoryMembers.length} network members${showStarredOnly ? ' (starred only)' : ''}`}
      />

      {/* Members grid */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        {filteredMembers.map((member) => (
          <MemberListCard
            key={member.id}
            member={member}
            isExpanded={expandedCards.has(member.id)}
            onToggleExpand={() => toggleCardExpansion(member.id)}
            onViewDetails={() => onMemberDetails(member)}
            showStar={!isAdmin}
            isStarred={isStarred(member.user_id)}
            onToggleStar={() => toggleStar(member.user_id)}
            footerAction={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromDirectory(member.user_id)}
                className="h-9 w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive sm:text-sm"
              >
                <BookmarkMinus className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Remove from Network</span>
              </Button>
            }
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center sm:p-12">
            <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
            <h3 className="mb-2 text-lg font-semibold sm:text-xl">
              {showStarredOnly ? 'No starred members found' : 'No network members found'}
            </h3>
            <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
              {directoryMembers.length === 0
                ? "You haven't added any members to your network yet. Go to 'Directory' to add some."
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
