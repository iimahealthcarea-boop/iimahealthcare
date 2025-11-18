import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  History,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileChangeTimeline } from "@/components/ProfileChangeTimeline";

type ProfileWithApproval = Tables<"profiles">;

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ProfileTabProps {
  status: "pending" | "approved" | "rejected" | "all";
  searchTerm: string;
  experienceFilter: string;
  organizationTypeFilter: string;
  refreshSignal: number;
  onProfileUpdate: () => void;
  onApprove: (profileUserId: string) => Promise<void>;
  onReject: (profileUserId: string, reason?: string) => Promise<void>;
  onTogglePublic: (profileUserId: string, currentStatus: boolean) => Promise<void>;
  onEdit: (profile: ProfileWithApproval) => void;
  actionLoading: boolean;
}

export function ProfileTab({
  status,
  searchTerm,
  experienceFilter,
  organizationTypeFilter,
  refreshSignal,
  onProfileUpdate,
  onApprove,
  onReject,
  onTogglePublic,
  onEdit,
  actionLoading,
}: ProfileTabProps) {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileWithApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineProfile, setTimelineProfile] = useState<ProfileWithApproval | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchProfiles = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/profile-list`;
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (status && status !== 'all') {
        params.append('status', status);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (experienceFilter && experienceFilter !== 'all') {
        params.append('experience_level', experienceFilter);
      }
      
      if (organizationTypeFilter && organizationTypeFilter !== 'all') {
        params.append('organization_type', organizationTypeFilter);
      }

      const response = await fetch(`${functionUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profiles');
      }

      const result = await response.json();
      
      if (result.success) {
        setProfiles(result.data || []);
        setPagination(result.pagination || pagination);
      } else {
        throw new Error(result.error || 'Failed to fetch profiles');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [status, searchTerm, experienceFilter, organizationTypeFilter, pagination.limit, toast]);

  // Fetch when component mounts or filters change
  useEffect(() => {
    fetchProfiles(1);
  }, [status, searchTerm, experienceFilter, organizationTypeFilter, refreshSignal]); // Re-fetch on tab/filter changes or manual refresh

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchProfiles(newPage);
    }
  }, [pagination.totalPages, fetchProfiles]);

  const handleRefresh = () => {
    fetchProfiles(pagination.page);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const openTimeline = (profile: ProfileWithApproval) => {
    setTimelineProfile(profile);
    setIsTimelineOpen(true);
  };

  const handleApproveAction = async (profileUserId: string) => {
    try {
      await onApprove(profileUserId);
      await fetchProfiles(pagination.page);
      onProfileUpdate();
      setSelectedProfile(null);
    } catch (error) {
      console.error('Error during approve action:', error);
    }
  };

  const handleRejectAction = async (profileUserId: string, reason?: string) => {
    try {
      await onReject(profileUserId, reason);
      await fetchProfiles(pagination.page);
      onProfileUpdate();
      setSelectedProfile(null);
      setRejectionReason("");
    } catch (error) {
      console.error('Error during reject action:', error);
    }
  };

  const renderProfileCard = (profile: ProfileWithApproval) => (
    <Card
      key={profile.id}
      className="hover:shadow-lg transition-all rounded-2xl border border-gray-200"
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14 ring-2 ring-primary/20 shadow-sm">
              <AvatarImage
                src={profile.avatar_url || ""}
                alt={`${profile.first_name} ${profile.last_name}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-semibold">
                {profile.first_name} {profile.last_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {profile.position || "—"}{" "}
                {profile.organization && `@ ${profile.organization}`}
              </p>
              <CardDescription className="text-xs">
                {profile.email}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(profile.approval_status || "pending")}
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        {profile.phone && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Phone:</span>
            <span className="text-gray-800">{profile.phone}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Registered:</span>
          <span>{new Date(profile.created_at).toLocaleDateString()}</span>
        </div>

        <Collapsible>
          <CollapsibleTrigger className="text-xs text-primary hover:underline mt-1">
            Show more info
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-1 text-xs text-gray-700">
            {profile.city && (
              <div>
                <strong>City:</strong> {profile.city}
              </div>
            )}
            {profile.country && (
              <div>
                <strong>Country:</strong> {profile.country}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      <div className="p-4 space-y-2 border-t pt-2">
        <div className="flex gap-2">
          <Dialog
            onOpenChange={(open) => {
              if (!open) {
                setSelectedProfile(null);
                setRejectionReason("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setSelectedProfile(profile)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                    <AvatarImage
                      src={profile.avatar_url || ""}
                      alt={`${profile.first_name} ${profile.last_name}`}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(profile.first_name, profile.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>
                      Profile Details - {profile.first_name} {profile.last_name}
                    </DialogTitle>
                    <DialogDescription>
                      Complete profile information for review
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {selectedProfile && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Name:</strong> {selectedProfile.first_name}{" "}
                        {selectedProfile.last_name}
                      </div>
                      <div>
                        <strong>Email:</strong> {selectedProfile.email}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedProfile.phone || "Not provided"}
                      </div>
                      <div>
                        <strong>Gender:</strong> {selectedProfile.gender || "Not provided"}
                      </div>
                      <div>
                        <strong>Date of Birth:</strong>{" "}
                        {selectedProfile.date_of_birth || "Not provided"}
                      </div>
                      <div>
                        <strong>City:</strong> {selectedProfile.city || "Not provided"}
                      </div>
                      <div>
                        <strong>Country:</strong> {selectedProfile.country || "Not provided"}
                      </div>
                      <div>
                        <strong>Pincode / ZIP:</strong> {selectedProfile.pincode || "Not provided"}
                      </div>
                      <div className="col-span-2">
                        <strong>Address:</strong> {selectedProfile.address || "Not provided"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Alternate Email:</strong>{" "}
                        {String((selectedProfile as Record<string, unknown>).altEmail || "Not provided")}
                      </div>
                      <div>
                        <strong>Country Code:</strong>{" "}
                        {selectedProfile.country_code || "Not provided"}
                      </div>
                      <div>
                        <strong>LinkedIn:</strong>{" "}
                        {selectedProfile.linkedin_url ? (
                          <a
                            href={selectedProfile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            {selectedProfile.linkedin_url}
                          </a>
                        ) : "Not provided"}
                      </div>
                      <div>
                        <strong>Website:</strong>{" "}
                        {selectedProfile.website_url ? (
                          <a
                            href={selectedProfile.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            {selectedProfile.website_url}
                          </a>
                        ) : "Not provided"}
                      </div>
                      <div className="col-span-2">
                        <strong>Other Social Handles:</strong>{" "}
                        {String((selectedProfile as Record<string, unknown>).other_social_media_handles || "Not provided")}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Emergency Contact</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Name:</strong>{" "}
                        {selectedProfile.emergency_contact_name || "Not provided"}
                      </div>
                      <div>
                        <strong>Phone:</strong>{" "}
                        {selectedProfile.emergency_contact_phone || "Not provided"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Professional Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <strong>Program:</strong> {selectedProfile.program || "Not provided"}
                      </div>
                      <div>
                        <strong>Graduation Year:</strong>{" "}
                        {selectedProfile.graduation_year || "Not provided"}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-medium">Organizations</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.isArray(selectedProfile.organizations as unknown as Array<Record<string, unknown>>) &&
                        (selectedProfile.organizations as unknown as Array<Record<string, unknown>>).length > 0 ? (
                          (selectedProfile.organizations as unknown as Array<Record<string, unknown>>).map((org, index) => (
                            <div key={index} className="rounded-2xl border p-4 shadow-sm bg-muted/30">
                              <h6 className="font-semibold mb-2 text-primary">
                                {String((org as Record<string, unknown>).currentOrg || `Organization ${index + 1}`)}
                              </h6>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p><strong>Type:</strong> {String((org as Record<string, unknown>).orgType || "—")}</p>
                                <p><strong>Role:</strong> {String((org as Record<string, unknown>).role || "—")}</p>
                                <p><strong>Experience:</strong> {String((org as Record<string, unknown>).experience || "—")}</p>
                                <p><strong>Description:</strong> {String((org as Record<string, unknown>).description || "—")}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No organizations provided</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Communication Preferences</h4>
                    <div className="text-sm">
                      <strong>Preferred Modes:</strong>{" "}
                      {Array.isArray((selectedProfile as unknown as { preferred_mode_of_communication?: string[] }).preferred_mode_of_communication) &&
                      ((selectedProfile as unknown as { preferred_mode_of_communication?: string[] }).preferred_mode_of_communication || []).length > 0
                        ? ((selectedProfile as unknown as { preferred_mode_of_communication?: string[] }).preferred_mode_of_communication || []).join(", ")
                        : "Not provided"}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Mentoring & Contributions</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Willing to Mentor:</strong>{" "}
                        {String((selectedProfile as Record<string, unknown>).willing_to_mentor || "Not provided")}
                      </div>
                      <div>
                        <strong>Areas of Contribution:</strong>{" "}
                        {Array.isArray((selectedProfile as Record<string, unknown>).areas_of_contribution) &&
                        ((selectedProfile as Record<string, unknown>).areas_of_contribution as string[]).length > 0
                          ? ((selectedProfile as Record<string, unknown>).areas_of_contribution as string[]).join(", ")
                          : "Not provided"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Additional Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Bio:</strong> {selectedProfile.bio || "Not provided"}
                      </div>
                      <div>
                        <strong>Skills:</strong>{" "}
                        {selectedProfile.skills && selectedProfile.skills.length > 0
                          ? selectedProfile.skills.join(", ")
                          : "Not provided"}
                      </div>
                      <div>
                        <strong>Interests:</strong>{" "}
                        {selectedProfile.interests && selectedProfile.interests.length > 0
                          ? selectedProfile.interests.join(", ")
                          : "Not provided"}
                      </div>
                    </div>
                  </div>

                  {selectedProfile.approval_status === "pending" && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproveAction(selectedProfile.user_id)}
                          disabled={actionLoading}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rejection-reason">
                          Rejection Reason (optional)
                        </Label>
                        <Textarea
                          id="rejection-reason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide a reason for rejection (optional)..."
                        />
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectAction(selectedProfile.user_id, rejectionReason)}
                          disabled={actionLoading}
                          className="w-full"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedProfile.approval_status === "approved" && (
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="is_public">Public Profile</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow others to see this profile in the directory
                          </p>
                        </div>
                        <Switch
                          id="is_public"
                          checked={selectedProfile.is_public || false}
                          onCheckedChange={() =>
                            onTogglePublic(
                              selectedProfile.user_id,
                              selectedProfile.is_public || false
                            )
                          }
                        />
                      </div>
                    </div>
                  )}

                  {selectedProfile.approval_status === "rejected" && selectedProfile.rejection_reason && (
                    <div>
                      <h4 className="font-semibold mb-2 text-red-600">Rejection Reason</h4>
                      <p className="text-sm text-muted-foreground">{selectedProfile.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => openTimeline(profile)}
          >
            <History className="w-4 h-4 mr-1" />
            Timeline
          </Button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => onEdit(profile)}
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit Profile
        </Button>

        {profile.approval_status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleApproveAction(profile.user_id)}
              disabled={actionLoading}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => handleRejectAction(profile.user_id)}
              disabled={actionLoading}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  if (loading && profiles.length === 0) {
    return (
      <div className="py-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {profiles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            {status === "pending" && <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
            {status === "approved" && <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
            {status === "rejected" && <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
            {status === "all" && <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
            <h3 className="text-lg font-semibold mb-2">
              No {status === "all" ? "" : status} profiles found
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || experienceFilter !== "all" || organizationTypeFilter !== "all"
                ? "Try adjusting your search criteria or filters to see more results."
                : `There are no ${status === "all" ? "" : status} profiles ${status === "all" ? "in the system yet." : "to review."}`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} profiles
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map(renderProfileCard)}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pagination.page - 1);
                    }}
                    className={!pagination.hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    href="#"
                  />
                </PaginationItem>
                
                {(() => {
                  const items: JSX.Element[] = [];
                  const pages = new Set<number>();
                  
                  pages.add(1);
                  
                  const startPage = Math.max(1, pagination.page - 1);
                  const endPage = Math.min(pagination.totalPages, pagination.page + 1);
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.add(i);
                  }
                  
                  if (pagination.totalPages > 1) {
                    pages.add(pagination.totalPages);
                  }
                  
                  const sortedPages = Array.from(pages).sort((a, b) => a - b);
                  
                  let lastPage = 0;
                  sortedPages.forEach((pageNum) => {
                    if (pageNum - lastPage > 1) {
                      items.push(
                        <PaginationItem key={`ellipsis-${pageNum}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    items.push(
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                          isActive={pageNum === pagination.page}
                          className="cursor-pointer"
                          href="#"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                    
                    lastPage = pageNum;
                  });
                  
                  return items;
                })()}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pagination.page + 1);
                    }}
                    className={!pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    href="#"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Profile Change Timeline */}
      {timelineProfile && (
        <ProfileChangeTimeline
          profileUserId={timelineProfile.user_id}
          profileName={`${timelineProfile.first_name} ${timelineProfile.last_name}`}
          isOpen={isTimelineOpen}
          onClose={() => setIsTimelineOpen(false)}
        />
      )}
    </div>
  );
}

