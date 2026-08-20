import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StarButton } from '@/components/StarButton';
import {
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Linkedin,
  Globe,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { ReactNode } from 'react';

type Profile = Tables<'profiles'>;

interface MemberListCardProps {
  member: Profile;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetails: () => void;
  /** Star control is hidden for admins, matching the previous behaviour. */
  showStar: boolean;
  isStarred: boolean;
  onToggleStar: () => void | Promise<void>;
  /** Tab-specific action rendered under the primary button row. */
  footerAction?: ReactNode;
}

const getInitials = (firstName?: string | null, lastName?: string | null) =>
  `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

/**
 * Shared alumni card used by both the Directory and My Network sections.
 * Layout is fluid: it never sets a fixed width, and every text node is allowed
 * to wrap so long names/organisations can't push the card past the viewport.
 */
export default function MemberListCard({
  member,
  isExpanded,
  onToggleExpand,
  onViewDetails,
  showStar,
  isStarred,
  onToggleStar,
  footerAction,
}: MemberListCardProps) {
  return (
    <Card className="flex min-w-0 flex-col overflow-hidden border border-border/70 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <CardContent className="flex h-full min-w-0 flex-col p-0">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/5 to-transparent p-4 pb-3 sm:p-5 sm:pb-4">
          {showStar && (
            <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
              <StarButton isStarred={isStarred} onToggle={() => Promise.resolve(onToggleStar())} size="sm" />
            </div>
          )}

          <div className="flex min-w-0 items-start gap-3 pr-9 sm:gap-4">
            <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-primary/20 sm:h-16 sm:w-16">
              <AvatarImage src={member.avatar_url || ''} alt={`${member.first_name} ${member.last_name}`} />
              <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground sm:text-lg">
                {getInitials(member.first_name, member.last_name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h3 className="mb-1 break-words text-base font-bold leading-tight text-foreground sm:text-lg">
                {member.first_name} {member.last_name}
              </h3>

              {member.position && (
                <p className="mb-1 line-clamp-2 break-words text-sm font-medium text-foreground/80">
                  {member.position}
                </p>
              )}

              {member.organization && (
                <div className="flex min-w-0 items-start gap-1.5">
                  <Building className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                    {member.organization}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Always-visible details */}
        <div className="min-w-0 flex-1 space-y-3 px-4 py-3 sm:px-5 sm:py-4">
          {(member.city || member.country) && (
            <div className="flex min-w-0 items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <p className="line-clamp-2 break-words text-sm text-muted-foreground">
                {member.city}
                {member.city && member.country && ', '}
                {member.country}
              </p>
            </div>
          )}

          {member.program && (
            <div className="flex min-w-0 items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <p className="line-clamp-2 break-words text-sm text-muted-foreground">
                {member.program}
                {member.graduation_year && ` (${member.graduation_year})`}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {member.experience_level && (
              <Badge
                variant="secondary"
                className="max-w-full whitespace-normal break-words px-2.5 py-0.5 text-xs font-medium"
              >
                {member.experience_level}
              </Badge>
            )}
            {member.organization_type && (
              <Badge
                variant="outline"
                className="max-w-full whitespace-normal break-words px-2.5 py-0.5 text-xs"
              >
                {member.organization_type}
              </Badge>
            )}
          </div>

          {!isExpanded && member.skills && member.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {member.skills.slice(0, 3).map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="max-w-full whitespace-normal break-words bg-primary/5 px-2 py-0.5 text-xs"
                >
                  {skill}
                </Badge>
              ))}
              {member.skills.length > 3 && (
                <Badge variant="outline" className="bg-muted px-2 py-0.5 text-xs">
                  +{member.skills.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="min-w-0 space-y-3 border-t bg-muted/30 px-4 pb-4 pt-4 sm:px-5">
            {member.bio && (
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  About
                </h4>
                <p className="break-words text-sm text-muted-foreground">{member.bio}</p>
              </div>
            )}

            {member.skills && member.skills.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="max-w-full whitespace-normal break-words bg-primary/5 px-2 py-0.5 text-xs"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {member.interests && member.interests.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  Interests
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {member.interests.map((interest, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="max-w-full whitespace-normal break-words px-2 py-0.5 text-xs"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {member.show_contact_info && (member.email || member.phone) && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  Contact
                </h4>
                <div className="space-y-2">
                  {member.email && (
                    <div className="flex min-w-0 items-center gap-2">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <a
                        href={`mailto:${member.email}`}
                        className="min-w-0 break-all text-sm text-blue-600 hover:underline"
                      >
                        {member.email}
                      </a>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex min-w-0 items-center gap-2">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <a
                        href={`tel:${member.phone}`}
                        className="min-w-0 break-all text-sm text-blue-600 hover:underline"
                      >
                        {member.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(member.linkedin_url || member.website_url) && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  Links
                </h4>
                <div className="flex flex-wrap gap-2">
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md border border-blue-200 px-3 py-1.5 text-sm text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                    >
                      <Linkedin className="h-4 w-4 flex-shrink-0" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {member.website_url && (
                    <a
                      href={member.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
                    >
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span>Website</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto border-t bg-muted/20 px-4 pb-4 pt-3 sm:px-5 sm:pt-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleExpand}
                className="h-9 min-w-[7rem] flex-1 text-xs font-medium sm:text-sm"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4 flex-shrink-0" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4 flex-shrink-0" />
                    Show More
                  </>
                )}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={onViewDetails}
                className="h-9 min-w-[7rem] flex-1 text-xs font-medium sm:text-sm"
              >
                <Eye className="mr-2 h-4 w-4 flex-shrink-0" />
                Full Profile
              </Button>
            </div>

            {footerAction}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
