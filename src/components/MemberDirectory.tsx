import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStarredProfiles } from '@/hooks/useStarredProfiles';
import { Tables } from '@/integrations/supabase/types';
import DirectoryTab from './DirectoryTab';
import AllMembersTab from './AllMembersTab';
import MemberDetailsDialog from './MemberDetailsDialog';

type Profile = Tables<'profiles'>;

interface DirectoryItem {
  profiles: Profile;
  member_id: string;
}

export default function MemberDirectory() {
  const [activeTab, setActiveTab] = useState('all');
  const [userDirectoryIds, setUserDirectoryIds] = useState<Set<string>>(new Set());
  const [directoryMembers, setDirectoryMembers] = useState<DirectoryItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryFetched, setDirectoryFetched] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Single shared starred profiles instance — passed down to both tabs
  const starredProfilesHook = useStarredProfiles();

  // Fetch starred profiles once on mount
  useEffect(() => {
    if (user) {
      starredProfilesHook.fetchStarredProfiles();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Single directory-get fetch — shared by both tabs
  const fetchDirectoryMembers = useCallback(async () => {
    if (!user) return;

    try {
      setDirectoryLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('No access token');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/directory-get`, {
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

      const directoryData: DirectoryItem[] = result.data || [];

      // Store full data for DirectoryTab
      setDirectoryMembers(directoryData);

      // Extract IDs for AllMembersTab quick lookup
      const ids = new Set<string>();
      directoryData.forEach((item) => {
        if (item.member_id) {
          ids.add(item.member_id);
        }
      });
      setUserDirectoryIds(ids);
      setDirectoryFetched(true);

    } catch (error) {
      console.error('Error fetching directory:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your directory",
        variant: "destructive",
      });
    } finally {
      setDirectoryLoading(false);
    }
  }, [user, toast, supabaseUrl]);

  // Fetch directory data lazily — only when "My Directory" tab is first opened
  // Also fetch on mount for userDirectoryIds (needed by AllMembersTab)
  useEffect(() => {
    if (user) {
      fetchDirectoryMembers();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMemberDetails = (member: Profile) => {
    setSelectedMember(member);
    setIsDetailsDialogOpen(true);
  };

  const handleDirectoryUpdate = () => {
    fetchDirectoryMembers();
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Members</TabsTrigger>
          <TabsTrigger value="directory">My Directory</TabsTrigger>
        </TabsList>

        {/* DirectoryTab: only render when tab is active (lazy load) */}
        <TabsContent value="directory" className="space-y-6">
          {activeTab === 'directory' && (
            <DirectoryTab
              onMemberDetails={handleMemberDetails}
              directoryMembers={directoryMembers}
              loading={directoryLoading}
              onRemoveFromDirectory={fetchDirectoryMembers}
              starredProfiles={starredProfilesHook}
            />
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <AllMembersTab
            onMemberDetails={handleMemberDetails}
            userDirectoryIds={userDirectoryIds}
            onDirectoryUpdate={handleDirectoryUpdate}
            starredProfiles={starredProfilesHook}
          />
        </TabsContent>
      </Tabs>

      {/* Member Details Dialog */}
      <MemberDetailsDialog
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        member={selectedMember}
      />
    </div>
  );
}
