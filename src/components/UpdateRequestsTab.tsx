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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";
import {
  CheckCircle,
  XCircle,
  Edit,
  RefreshCw,
  Clock,
  AlertCircle,
} from "lucide-react";

type UpdateRequest = Tables<'profile_update_requests'> & {
  profile?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
};

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UpdateRequestsTabProps {
  profiles: Tables<'profiles'>[];
  onRequestUpdate: () => void;
}

export function UpdateRequestsTab({ profiles, onRequestUpdate }: UpdateRequestsTabProps) {
  const { toast } = useToast();
  const [updateRequests, setUpdateRequests] = useState<UpdateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(null);
  const [requestEditPayload, setRequestEditPayload] = useState<Record<string, unknown> | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const limit = 10; // Fixed items per page
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | null>('pending');

  const fetchUpdateRequests = useCallback(async (page: number = 1, status: string | null = null) => {
    setLoading(true);
    try {
      // Get Supabase URL and access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/profile-update-requests`;
      
      const limit = 10; // Fixed limit
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (status) {
        params.append('status', status);
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
        throw new Error(errorData.error || 'Failed to fetch update requests');
      }

      const result = await response.json();
      
      if (result.success) {
        setUpdateRequests(result.data || []);
        setPagination(result.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      } else {
        throw new Error(result.error || 'Failed to fetch update requests');
      }
    } catch (error) {
      console.error('Error fetching update requests:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch update requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Fetch requests when component mounts or status filter changes
    fetchUpdateRequests(1, statusFilter);
  }, [statusFilter, fetchUpdateRequests]); // Include fetchUpdateRequests in dependencies

  const handleRefresh = () => {
    fetchUpdateRequests(pagination.page, statusFilter);
  };

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUpdateRequests(newPage, statusFilter);
    }
  }, [pagination.totalPages, fetchUpdateRequests, statusFilter]);

  const handleApproveRequest = async (requestId: string, override?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('approve_profile_update_request', {
        request_id: requestId,
        override_payload: (override as unknown as Json) || null,
      });
      if (error) throw error;
      toast({ title: 'Request Approved', description: 'Profile updated successfully.' });
      onRequestUpdate();
      await fetchUpdateRequests(pagination.page, statusFilter);
      setSelectedRequest(null);
      setRequestEditPayload(null);
    } catch (error) {
      console.error('Error approving request:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to approve request', 
        variant: 'destructive' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string, reason?: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('reject_profile_update_request', {
        request_id: requestId,
        reason: reason || null,
      });
      if (error) throw error;
      toast({ title: 'Request Rejected', description: 'The request has been rejected.' });
      await fetchUpdateRequests(pagination.page, statusFilter);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to reject request', 
        variant: 'destructive' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = updateRequests.filter((r) => r.status === "pending");
  const allRequests = statusFilter ? updateRequests : updateRequests;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Update Requests</CardTitle>
              <CardDescription>
                Review and manage user-submitted profile changes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  setStatusFilter(value === 'all' ? null : value as 'pending' | 'approved' | 'rejected');
                }}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Status</option>
              </select>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center text-sm">Loading requests...</div>
          ) : allRequests.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              No update requests found
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * limit) + 1} to{' '}
                {Math.min(pagination.page * limit, pagination.total)} of{' '}
                {pagination.total} requests
              </div>
              
              {allRequests.map((req) => {
                const proposed = (req.submitted_payload as unknown as Record<string, unknown>) || {};
                const profile = req.profile || profiles.find((p) => p.user_id === req.profile_user_id);
                const fields = Object.keys(proposed);
                return (
                  <Card key={req.id} className="border rounded-xl">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-sm font-medium">Request ID: {req.id.slice(0, 8)}...</div>
                            {getStatusBadge(req.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>Name: {profile?.first_name || 'N/A'} {profile?.last_name || ''}</div>
                            <div>Email: {profile?.email || 'N/A'}</div>
                            <div className="text-xs mt-1">
                              Submitted: {new Date(req.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {req.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { 
                                  setSelectedRequest(req); 
                                  setRequestEditPayload(proposed); 
                                }}
                                disabled={actionLoading}
                              >
                                <Edit className="w-4 h-4 mr-1" /> Edit
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveRequest(req.id)} 
                                disabled={actionLoading}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleRejectRequest(req.id)} 
                                disabled={actionLoading}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {fields.length > 0 && (
                        <div className="overflow-x-auto border rounded-md">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left bg-muted/50">
                                <th className="py-2 px-4 font-medium">Field</th>
                                <th className="py-2 px-4 font-medium">Current</th>
                                <th className="py-2 px-4 font-medium">Proposed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fields.map((key) => (
                                <tr key={key} className="border-t">
                                  <td className="py-2 px-4 align-top font-medium">{key}</td>
                                  <td className="py-2 px-4 align-top text-muted-foreground">
                                    {formatValue((profile as unknown as Record<string, unknown>)?.[key])}
                                  </td>
                                  <td className="py-2 px-4 align-top">
                                    {formatValue((proposed as Record<string, unknown>)[key])}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {req.admin_notes && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          <strong>Admin Notes:</strong> {req.admin_notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

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
                      
                      // Always show first page
                      pages.add(1);
                      
                      // Add pages around current page
                      const startPage = Math.max(1, pagination.page - 1);
                      const endPage = Math.min(pagination.totalPages, pagination.page + 1);
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.add(i);
                      }
                      
                      // Always show last page
                      if (pagination.totalPages > 1) {
                        pages.add(pagination.totalPages);
                      }
                      
                      // Convert to sorted array
                      const sortedPages = Array.from(pages).sort((a, b) => a - b);
                      
                      let lastPage = 0;
                      sortedPages.forEach((pageNum) => {
                        // Add ellipsis if there's a gap
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Request Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => { 
        if (!open) { 
          setSelectedRequest(null); 
          setRequestEditPayload(null); 
        } 
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Update Request</DialogTitle>
            <DialogDescription>
              Modify the payload before approving the request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payload">Request Payload (JSON)</Label>
              <Textarea
                id="payload"
                className="font-mono text-xs"
                rows={15}
                value={
                  requestEditPayload
                    ? JSON.stringify(requestEditPayload, null, 2)
                    : '{}'
                }
                onChange={(e) => {
                  try {
                    setRequestEditPayload(JSON.parse(e.target.value));
                  } catch {
                    // Invalid JSON, keep as is
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => { 
                  setSelectedRequest(null); 
                  setRequestEditPayload(null); 
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => selectedRequest && handleApproveRequest(selectedRequest.id, requestEditPayload || undefined)} 
                disabled={actionLoading}
              >
                Approve with Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

