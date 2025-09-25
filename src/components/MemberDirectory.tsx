import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import DirectoryTab from './DirectoryTab';
import AllMembersTab from './AllMembersTab';
import MemberDetailsDialog from './MemberDetailsDialog';

type Profile = Tables<'profiles'>;

export default function MemberDirectory() {
  const [activeTab, setActiveTab] = useState('directory');
  const [userDirectoryIds, setUserDirectoryIds] = useState<Set<string>>(new Set());
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
      
      // Update userDirectoryIds for quick lookup
      const ids = new Set<string>();
      directoryData.forEach((item: { member_id?: string }) => {
        if (item.member_id) {
          ids.add(item.member_id);
        }
      });
      setUserDirectoryIds(ids);
      
    } catch (error) {
      console.error('Error fetching directory:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your directory",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchDirectoryMembers();
    }
  }, [fetchDirectoryMembers, user]);

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
          <TabsTrigger value="directory">My Directory</TabsTrigger>
          <TabsTrigger value="all">All Members</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-6">
          <DirectoryTab onMemberDetails={handleMemberDetails} />
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <AllMembersTab 
            onMemberDetails={handleMemberDetails}
            userDirectoryIds={userDirectoryIds}
            onDirectoryUpdate={handleDirectoryUpdate}
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