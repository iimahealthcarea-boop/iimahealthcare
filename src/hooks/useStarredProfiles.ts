import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useStarredProfiles = () => {
  const [starredProfiles, setStarredProfiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchStarredProfiles = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_starred_profiles")
        .select("starred_profile_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const starredIds = new Set(data?.map(item => item.starred_profile_id) || []);
      setStarredProfiles(starredIds);
    } catch (error) {
      console.error("Error fetching starred profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load starred profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const toggleStar = useCallback(async (profileUserId: string) => {
    if (!user) return;

    const isCurrentlyStarred = starredProfiles.has(profileUserId);
    
    try {
      if (isCurrentlyStarred) {
        // Remove from starred profiles
        const { error } = await supabase
          .from("user_starred_profiles")
          .delete()
          .eq("user_id", user.id)
          .eq("starred_profile_id", profileUserId);

        if (error) throw error;
      } else {
        // First check if the profile is in the user's directory
        // const { data: directoryCheck, error: directoryError } = await supabase
        //   .from("user_directory")
        //   .select("id")
        //   .eq("user_id", user.id)
        //   .eq("member_id", profileUserId)
        //   .single();

        // if (directoryError || !directoryCheck) {
        //   toast({
        //     title: "Error",
        //     description: "You can only star profiles that are in your directory",
        //     variant: "destructive",
        //   });
        //   return;
        // }

        // Add to starred profiles
        const { error } = await supabase
          .from("user_starred_profiles")
          .insert({
            user_id: user.id,
            starred_profile_id: profileUserId,
          });

        if (error) throw error;
      }

      // Update local state
      setStarredProfiles(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyStarred) {
          newSet.delete(profileUserId);
        } else {
          newSet.add(profileUserId);
        }
        return newSet;
      });

      toast({
        title: isCurrentlyStarred ? "Removed from starred" : `Added to starred`,
        description: isCurrentlyStarred 
          ? "Profile removed from your starred list" 
          : "Profile added to your starred list",
      });
    } catch (error) {
      console.error("Error toggling star:", error);
      toast({
        title: "Error",
        description: "Failed to update starred status",
        variant: "destructive",
      });
    }
  }, [user, starredProfiles, toast]);

  const isStarred = useCallback((profileUserId: string) => {
    return starredProfiles.has(profileUserId);
  }, [starredProfiles]);

  return {
    starredProfiles,
    loading,
    fetchStarredProfiles,
    toggleStar,
    isStarred,
  };
};
