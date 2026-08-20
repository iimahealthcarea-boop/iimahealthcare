import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Mail, Phone, MapPin, Building, Calendar, Linkedin, Globe, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProfileLike {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  country_code?: string | null;
  avatar_url?: string | null;
  position?: string | null;
  organization?: string | null;
  organization_type?: string | null;
  experience_level?: string | null;
  program?: string | null;
  graduation_year?: number | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
  linkedin_url?: string | null;
  website_url?: string | null;
}

interface ProfileSectionProps {
  profile?: ProfileLike | null;
  email?: string | null;
}

const getInitials = (firstName?: string | null, lastName?: string | null) =>
  `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

/** Read-only summary of the signed-in user's own profile, with an edit entry point. */
export default function ProfileSection({ profile, email }: ProfileSectionProps) {
  const { signOut } = useAuth();
  const displayEmail = profile?.email || email;

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      {/* Identity header */}
      <Card className="min-w-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-transparent p-4 sm:p-6">
          <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <Avatar className="h-20 w-20 flex-shrink-0 ring-4 ring-background sm:h-24 sm:w-24">
              <AvatarImage src={profile?.avatar_url || ''} alt="Profile picture" />
              <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
                {getInitials(profile?.first_name, profile?.last_name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h1 className="break-words text-xl font-bold leading-tight sm:text-2xl">
                {profile?.first_name} {profile?.last_name}
              </h1>
              {profile?.position && (
                <p className="mt-1 break-words text-sm font-medium text-foreground/80">
                  {profile.position}
                </p>
              )}
              {profile?.organization && (
                <div className="mt-1 flex min-w-0 items-start justify-center gap-1.5 sm:justify-start">
                  <Building className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="break-words text-sm text-muted-foreground">
                    {profile.organization}
                  </span>
                </div>
              )}

              <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {profile?.experience_level && (
                  <Badge variant="secondary" className="max-w-full whitespace-normal break-words text-xs">
                    {profile.experience_level}
                  </Badge>
                )}
                {profile?.organization_type && (
                  <Badge variant="outline" className="max-w-full whitespace-normal break-words text-xs">
                    {profile.organization_type}
                  </Badge>
                )}
              </div>
            </div>

            <Link to="/profile" className="w-full flex-shrink-0 sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4 flex-shrink-0" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Details */}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 text-sm sm:p-5 sm:pt-0">
            {displayEmail && (
              <div className="flex min-w-0 items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <a href={`mailto:${displayEmail}`} className="min-w-0 break-all text-blue-600 hover:underline">
                  {displayEmail}
                </a>
              </div>
            )}
            {profile?.phone && (
              <div className="flex min-w-0 items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="min-w-0 break-all">
                  {profile.country_code} {profile.phone}
                </span>
              </div>
            )}
            {(profile?.city || profile?.country) && (
              <div className="flex min-w-0 items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="min-w-0 break-words">
                  {profile?.city}
                  {profile?.city && profile?.country && ', '}
                  {profile?.country}
                </span>
              </div>
            )}
            {profile?.linkedin_url && (
              <div className="flex min-w-0 items-center gap-2">
                <Linkedin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 break-all text-blue-600 hover:underline"
                >
                  LinkedIn
                </a>
              </div>
            )}
            {profile?.website_url && (
              <div className="flex min-w-0 items-center gap-2">
                <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 break-all text-blue-600 hover:underline"
                >
                  Website
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 text-sm sm:p-5 sm:pt-0">
            <div className="flex min-w-0 items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="min-w-0 break-words">
                {profile?.program || 'Not provided'}
                {profile?.graduation_year ? ` (${profile.graduation_year})` : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {profile?.bio && (
        <Card className="min-w-0">
          <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">About</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
            <p className="break-words text-sm text-muted-foreground">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {(profile?.skills?.length || profile?.interests?.length) && (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          {!!profile?.skills?.length && (
            <Card className="min-w-0">
              <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
                <CardTitle className="text-base sm:text-lg">Skills</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="max-w-full whitespace-normal break-words bg-primary/5 text-xs"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!!profile?.interests?.length && (
            <Card className="min-w-0">
              <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
                <CardTitle className="text-base sm:text-lg">Interests</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="max-w-full whitespace-normal break-words text-xs"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Sign out — standard placement at the bottom of the profile tab */}
      <div className="min-w-0 pt-1">
        <Button
          variant="outline"
          onClick={signOut}
          className="h-11 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
