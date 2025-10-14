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
              <div><strong>Gender:</strong> {String((member as Record<string, unknown>).gender || "Not provided")}</div>
              {member.date_of_birth && (
                <div><strong>Date of Birth:</strong> {member.date_of_birth}</div>
              )}
              <div><strong>City:</strong> {member.city || "Not provided"}</div>
              <div><strong>Country:</strong> {member.country || "Not provided"}</div>
              <div><strong>Pincode/ZIP:</strong> {String((member as Record<string, unknown>).pincode || "Not provided")}</div>
              {canViewLocation && member.address && (
                <div className="col-span-2"><strong>Address:</strong> {member.address}</div>
              )}
              {!canViewLocation && (
                <div className="col-span-2 flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Location information hidden</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold mb-2">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {canViewContactInfo && member.email ? (
                <div><strong>Email:</strong> <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">{member.email}</a></div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Email hidden</span>
                </div>
              )}
              {canViewContactInfo && (member as Record<string, unknown>).altEmail ? (
                <div><strong>Alternate Email:</strong> <a href={`mailto:${String((member as Record<string, unknown>).altEmail)}`} className="text-blue-600 hover:underline">{String((member as Record<string, unknown>).altEmail)}</a></div>
              ) : canViewContactInfo ? (
                <div><strong>Alternate Email:</strong> Not provided</div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Alternate Email hidden</span>
                </div>
              )}
              {canViewContactInfo && member.phone ? (
                <div><strong>Phone:</strong> <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline">{String((member as Record<string, unknown>).country_code)} {member.phone}</a></div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Phone hidden</span>
                </div>
              )}
              {canViewContactInfo && member.linkedin_url ? (
                <div><strong>LinkedIn:</strong> <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{member.linkedin_url}</a></div>
              ) : canViewContactInfo ? (
                <div><strong>LinkedIn:</strong> Not provided</div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>LinkedIn hidden</span>
                </div>
              )}
              {member.website_url ? (
                <div><strong>Website:</strong> <a href={member.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{member.website_url}</a></div>
              ) : (
                <div><strong>Website:</strong> Not provided</div>
              )}
              {canViewContactInfo && (member as Record<string, unknown>).other_social_media_handles ? (
                <div><strong>Other Social Media:</strong> {String((member as Record<string, unknown>).other_social_media_handles)}</div>
              ) : canViewContactInfo ? (
                <div><strong>Other Social Media:</strong> Not provided</div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Other Social Media hidden</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h4 className="font-semibold mb-2">Professional Information</h4>
            
            {/* Education Details */}
            <div className="mb-4">
              <h5 className="font-medium mb-2">Education</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Program:</strong> {member.program || "Not provided"}</div>
                <div><strong>Graduation Year:</strong> {member.graduation_year || "Not provided"}</div>
              </div>
            </div>

            {/* Organizations */}
            <div>
              <h5 className="font-medium mb-2">Organizations</h5>
              {Array.isArray((member as Record<string, unknown>).organizations) && ((member as Record<string, unknown>).organizations as unknown[]).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {((member as Record<string, unknown>).organizations as Record<string, unknown>[]).map((org: Record<string, unknown>, index: number) => (
                    <div key={String(org.id || index)} className="border rounded-lg p-3 bg-gray-50">
                      <h6 className="font-medium text-primary mb-2">
                        Organization {index + 1}: {String(org.currentOrg || '-')}
                      </h6>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><strong>Type:</strong> {String(org.orgType || '-')}</p>
                        <p><strong>Experience:</strong> {String(org.experience || '-')}</p>
                        <p><strong>Role:</strong> {String(org.role || '-')}</p>
                        <p><strong>Description:</strong> {String(org.description || '-')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No organizations provided</div>
              )}
            </div>
          </div>

          {/* Communication Preferences */}
          <div>
            <h4 className="font-semibold mb-2">Communication Preferences</h4>
            <div className="space-y-2 text-sm">
              {Array.isArray((member as Record<string, unknown>).preferred_mode_of_communication) && ((member as Record<string, unknown>).preferred_mode_of_communication as unknown[]).length > 0 ? (
                <div>
                  <strong>Preferred Mode of Communication:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {((member as Record<string, unknown>).preferred_mode_of_communication as string[]).map((mode: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {mode}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div><strong>Preferred Mode of Communication:</strong> Not provided</div>
              )}
            </div>
          </div>

          {/* Mentoring & Contributions */}
          <div>
            <h4 className="font-semibold mb-2">Mentoring & Contributions</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Willing to Mentor:</strong> {String((member as Record<string, unknown>).willing_to_mentor || "Not provided")}</div>
              <div>
                <strong>Areas of Contribution:</strong> 
                {Array.isArray((member as Record<string, unknown>).areas_of_contribution) && ((member as Record<string, unknown>).areas_of_contribution as unknown[]).length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {((member as Record<string, unknown>).areas_of_contribution as string[]).map((area: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground"> Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h4 className="font-semibold mb-2">Additional Information</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Bio:</strong> {member.bio || "Not provided"}</div>
              {member.skills && member.skills.length > 0 ? (
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
              ) : (
                <div><strong>Skills:</strong> Not provided</div>
              )}
              {member.interests && member.interests.length > 0 ? (
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
              ) : (
                <div><strong>Interests:</strong> Not provided</div>
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
