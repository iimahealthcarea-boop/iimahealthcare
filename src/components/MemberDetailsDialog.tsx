import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface MemberDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: Profile | null;
}

export default function MemberDetailsDialog({ isOpen, onOpenChange, member }: MemberDetailsDialogProps) {
  if (!member) return null;

  const canViewContactInfo = member.show_contact_info;
  const canViewLocation = member.show_location;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {member.first_name} {member.last_name}
          </DialogTitle>
          <DialogDescription>
            Complete profile information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h4 className="font-semibold mb-2">Personal Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Name:</strong> {member.first_name} {member.last_name}</div>
              {canViewContactInfo && member.email ? (
                <div><strong>Email:</strong> <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">{member.email}</a></div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Email hidden</span>
                </div>
              )}
              {canViewContactInfo && member.phone ? (
                <div><strong>Phone:</strong> <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline">{member.phone}</a></div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Phone hidden</span>
                </div>
              )}
              {member.date_of_birth && (
                <div><strong>Date of Birth:</strong> {member.date_of_birth}</div>
              )}
              {canViewLocation && member.address && (
                <div className="col-span-2"><strong>Address:</strong> {member.address}</div>
              )}
              {canViewLocation && member.city && (
                <div><strong>City:</strong> {member.city}</div>
              )}
              {canViewLocation && member.country && (
                <div><strong>Country:</strong> {member.country}</div>
              )}
              {!canViewLocation && (
                <div className="col-span-2 flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Location information hidden</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h4 className="font-semibold mb-2">Professional Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {member.organization && (
                <div><strong>Organization:</strong> {member.organization}</div>
              )}
              {member.position && (
                <div><strong>Position:</strong> {member.position}</div>
              )}
              {member.experience_level && (
                <div><strong>Experience:</strong> {member.experience_level}</div>
              )}
              {member.organization_type && (
                <div><strong>Org Type:</strong> {member.organization_type}</div>
              )}
              {member.program && (
                <div><strong>Program:</strong> {member.program}</div>
              )}
              {member.graduation_year && (
                <div><strong>Graduation Year:</strong> {member.graduation_year}</div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h4 className="font-semibold mb-2">Additional Information</h4>
            <div className="space-y-2 text-sm">
              {member.bio && (
                <div><strong>Bio:</strong> {member.bio}</div>
              )}
              {member.skills && member.skills.length > 0 && (
                <div>
                  <strong>Skills:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {member.interests && member.interests.length > 0 && (
                <div>
                  <strong>Interests:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {canViewContactInfo && member.linkedin_url && (
                <div><strong>LinkedIn:</strong> <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{member.linkedin_url}</a></div>
              )}
              {member.website_url && (
                <div><strong>Website:</strong> <a href={member.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{member.website_url}</a></div>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          {(!canViewContactInfo || !canViewLocation) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Lock className="h-4 w-4" />
                <span className="font-medium">Privacy Notice</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                This member has chosen to keep some information private. Contact information and location details may be hidden.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
