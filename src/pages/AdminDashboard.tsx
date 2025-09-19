import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { Users, Clock, CheckCircle, XCircle, Eye, User, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Navigate, Link } from 'react-router-dom';
import Header from '@/components/Header';

type ProfileWithApproval = Tables<'profiles'>;

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect if not admin
  if (!isAdmin && !loading) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (profileUserId: string) => {
    setActionLoading(true);
    try {
      // Get user profile details before approval
      const profile = profiles.find(p => p.user_id === profileUserId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Approve the profile
      const { error } = await supabase.rpc('approve_user_profile', {
        profile_user_id: profileUserId
      });

      if (error) throw error;

      // Send approval email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
          body: {
            email: profile.email,
            name: `${profile.first_name} ${profile.last_name}`,
            status: 'approved'
          }
        });

        if (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't fail the approval if email fails, just log it
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the approval if email fails
      }

      toast({
        title: "Profile Approved",
        description: "The user profile has been approved and notification email sent.",
      });

      await fetchProfiles();
      setSelectedProfile(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (profileUserId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      // Get user profile details before rejection
      const profile = profiles.find(p => p.user_id === profileUserId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Reject the profile
      const { error } = await supabase.rpc('reject_user_profile', {
        profile_user_id: profileUserId,
        reason: rejectionReason
      });

      if (error) throw error;

      // Send rejection email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
          body: {
            email: profile.email,
            name: `${profile.first_name} ${profile.last_name}`,
            status: 'rejected',
            reason: rejectionReason
          }
        });

        if (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't fail the rejection if email fails, just log it
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the rejection if email fails
      }

      toast({
        title: "Profile Rejected",
        description: "The user profile has been rejected and notification email sent.",
      });

      await fetchProfiles();
      setSelectedProfile(null);
      setRejectionReason('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStats = () => {
    const pending = profiles.filter(p => p.approval_status === 'pending').length;
    const approved = profiles.filter(p => p.approval_status === 'approved').length;
    const rejected = profiles.filter(p => p.approval_status === 'rejected').length;
    return { pending, approved, rejected, total: profiles.length };
  };

  const stats = getStats();

  const exportToExcel = () => {
    try {
      // Get all approved profiles for export
      const approvedProfiles = profiles.filter(p => p.approval_status === 'approved');
      
      // Prepare data for Excel export
      const excelData = approvedProfiles.map(profile => ({
        'Name': `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        'Email': profile.email || '',
        'Phone': profile.phone || '',
        'Organization': profile.organization || '',
        'Position': profile.position || '',
        'Program': profile.program || '',
        'Experience Level': profile.experience_level || '',
        'Organization Type': profile.organization_type || '',
        'City': profile.city || '',
        'Country': profile.country || '',
        'Address': profile.address || '',
        'Date of Birth': profile.date_of_birth || '',
        'Graduation Year': profile.graduation_year || '',
        'LinkedIn': profile.linkedin_url || '',
        'Website': profile.website_url || '',
        'Bio': profile.bio || '',
        'Skills': profile.skills ? profile.skills.join(', ') : '',
        'Interests': profile.interests ? profile.interests.join(', ') : '',
        'Emergency Contact Name': profile.emergency_contact_name || '',
        'Emergency Contact Phone': profile.emergency_contact_phone || '',
        'Approved Date': profile.approved_at ? new Date(profile.approved_at).toLocaleDateString() : '',
        'Registration Date': new Date(profile.created_at).toLocaleDateString(),
        'Status': profile.status || '',
        'Public Profile': profile.is_public ? 'Yes' : 'No',
        'Show Contact Info': profile.show_contact_info ? 'Yes' : 'No',
        'Show Location': profile.show_location ? 'Yes' : 'No'
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 20 }, // Organization
        { wch: 20 }, // Position
        { wch: 15 }, // Program
        { wch: 15 }, // Experience Level
        { wch: 15 }, // Organization Type
        { wch: 15 }, // City
        { wch: 15 }, // Country
        { wch: 30 }, // Address
        { wch: 12 }, // Date of Birth
        { wch: 12 }, // Graduation Year
        { wch: 30 }, // LinkedIn
        { wch: 30 }, // Website
        { wch: 50 }, // Bio
        { wch: 30 }, // Skills
        { wch: 30 }, // Interests
        { wch: 20 }, // Emergency Contact Name
        { wch: 18 }, // Emergency Contact Phone
        { wch: 12 }, // Approved Date
        { wch: 15 }, // Registration Date
        { wch: 10 }, // Status
        { wch: 12 }, // Public Profile
        { wch: 15 }, // Show Contact Info
        { wch: 15 }  // Show Location
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

      // Generate filename with current date
      const today = new Date();
      const filename = `members_export_${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `${approvedProfiles.length} member records exported to ${filename}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: "Failed to export member data to Excel",
        variant: "destructive",
      });
    }
  };

  const renderProfileCard = (profile: ProfileWithApproval) => (
    <Card key={profile.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {profile.first_name} {profile.last_name}
            </CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </div>
          {getStatusBadge(profile.approval_status || 'pending')}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {profile.organization && (
            <p><strong>Organization:</strong> {profile.organization}</p>
          )}
          {profile.position && (
            <p><strong>Position:</strong> {profile.position}</p>
          )}
          {profile.phone && (
            <p><strong>Phone:</strong> {profile.phone}</p>
          )}
          <p><strong>Registered:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
        
        <div className="flex flex-col gap-2 mt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedProfile(profile)}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Profile Details - {profile.first_name} {profile.last_name}</DialogTitle>
                <DialogDescription>
                  Complete profile information for review
                </DialogDescription>
              </DialogHeader>
              
              {selectedProfile && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="font-semibold mb-2">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Name:</strong> {selectedProfile.first_name} {selectedProfile.last_name}</div>
                      <div><strong>Email:</strong> {selectedProfile.email}</div>
                      <div><strong>Phone:</strong> {selectedProfile.phone}</div>
                      <div><strong>Date of Birth:</strong> {selectedProfile.date_of_birth || 'Not provided'}</div>
                      <div className="col-span-2"><strong>Address:</strong> {selectedProfile.address}</div>
                      <div><strong>City:</strong> {selectedProfile.city}</div>
                      <div><strong>Country:</strong> {selectedProfile.country}</div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h4 className="font-semibold mb-2">Emergency Contact</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Name:</strong> {selectedProfile.emergency_contact_name}</div>
                      <div><strong>Phone:</strong> {selectedProfile.emergency_contact_phone}</div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div>
                    <h4 className="font-semibold mb-2">Professional Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Organization:</strong> {selectedProfile.organization}</div>
                      <div><strong>Position:</strong> {selectedProfile.position}</div>
                      <div><strong>Experience:</strong> {selectedProfile.experience_level}</div>
                      <div><strong>Org Type:</strong> {selectedProfile.organization_type}</div>
                      <div><strong>Program:</strong> {selectedProfile.program}</div>
                      <div><strong>Graduation Year:</strong> {selectedProfile.graduation_year}</div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h4 className="font-semibold mb-2">Additional Information</h4>
                    <div className="space-y-2 text-sm">
                      {selectedProfile.bio && (
                        <div><strong>Bio:</strong> {selectedProfile.bio}</div>
                      )}
                      {selectedProfile.skills && (
                        <div><strong>Skills:</strong> {selectedProfile.skills.join(', ')}</div>
                      )}
                      {selectedProfile.interests && (
                        <div><strong>Interests:</strong> {selectedProfile.interests.join(', ')}</div>
                      )}
                      {selectedProfile.linkedin_url && (
                        <div><strong>LinkedIn:</strong> <a href={selectedProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedProfile.linkedin_url}</a></div>
                      )}
                      {selectedProfile.website_url && (
                        <div><strong>Website:</strong> <a href={selectedProfile.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedProfile.website_url}</a></div>
                      )}
                    </div>
                  </div>

                  {/* Actions for pending profiles */}
                  {selectedProfile.approval_status === 'pending' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleApprove(selectedProfile.user_id)}
                          disabled={actionLoading}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="rejection-reason">Rejection Reason (optional)</Label>
                        <Textarea
                          id="rejection-reason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide a reason for rejection..."
                        />
                        <Button 
                          variant="destructive"
                          onClick={() => handleReject(selectedProfile.user_id)}
                          disabled={actionLoading}
                          className="w-full"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show rejection reason if rejected */}
                  {selectedProfile.approval_status === 'rejected' && selectedProfile.rejection_reason && (
                    <div>
                      <h4 className="font-semibold mb-2 text-red-600">Rejection Reason</h4>
                      <p className="text-sm">{selectedProfile.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {profile.approval_status === 'pending' && (
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => handleApprove(profile.user_id)}
                disabled={actionLoading}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedProfile(profile);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showUserInfo={true} showSignOut={true} />

      <main className="p-6 max-w-6xl mx-auto">
        {/* Header with Profile Link and Export */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage user profiles and applications</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Link to="/profile">
              <Button variant="outline">
                <User className="w-4 h-4 mr-2" />
                My Profile
              </Button>
            </Link>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Profiles List */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.filter(p => p.approval_status === 'pending').map(renderProfileCard)}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.filter(p => p.approval_status === 'approved').map(renderProfileCard)}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.filter(p => p.approval_status === 'rejected').map(renderProfileCard)}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map(renderProfileCard)}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}