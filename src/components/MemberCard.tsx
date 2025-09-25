import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Building, GraduationCap, Mail, Linkedin, Phone, Clock } from "lucide-react";
import { ProfileChangeTimeline } from "@/components/ProfileChangeTimeline";
import { useState } from "react";

interface ChangeRecord {
  updatedBy: string;
  updatedAt: string;
  changedFields: string[];
  isAdmin: boolean;
}

interface MemberData {
  id: string;
  firstName: string;
  lastName: string;
  program: string;
  graduationYear: number;
  currentOrg: string;
  orgType: string;
  city: string;
  country: string;
  role: string;
  yearsExperience: number;
  linkedin?: string;
  email: string;
  phone?: string;
  phoneVisible?: boolean;
  interests: string[];
  profileImageUrl?: string;
  avatar_url?: string;
  change_history?: ChangeRecord[];
}

interface MemberCardProps {
  member: MemberData;
  showContactInfo?: boolean;
  onViewProfile?: (memberId: string) => void;
  hideProfileButton?: boolean;
  isAdmin?: boolean;
}

export function MemberCard({ member, showContactInfo = false, onViewProfile, hideProfileButton = false, isAdmin = false }: MemberCardProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getOrgTypeColor = (orgType: string) => {
    const colors: Record<string, string> = {
      'Hospital/Clinic': 'bg-red-100 text-red-800',
      'HealthTech': 'bg-blue-100 text-blue-800',
      'Pharmaceutical': 'bg-green-100 text-green-800',
      'Biotech': 'bg-purple-100 text-purple-800',
      'Medical Devices': 'bg-orange-100 text-orange-800',
      'Consulting': 'bg-gray-100 text-gray-800',
      'Public Health/Policy': 'bg-indigo-100 text-indigo-800',
      'Health Insurance': 'bg-yellow-100 text-yellow-800',
      'Academic/Research': 'bg-pink-100 text-pink-800',
      'Startup': 'bg-emerald-100 text-emerald-800',
      'VC': 'bg-violet-100 text-violet-800',
    };
    return colors[orgType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatar_url || member.profileImageUrl || ''} alt={`${member.firstName} ${member.lastName}`} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(member.firstName, member.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                {member.firstName} {member.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {member.program} '{member.graduationYear.toString().slice(-2)}
              </p>
            </div>
          </div>
          <Badge className={getOrgTypeColor(member.orgType)} variant="secondary">
            {member.orgType}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Building className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="font-medium text-foreground">{member.currentOrg}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{member.role}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{member.city}, {member.country}</span>
          </div>
        </div>

        {member.interests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Areas of Interest</p>
            <div className="flex flex-wrap gap-1">
              {member.interests.slice(0, 3).map((interest, index) => (
                <Badge key={index} variant="outline" className="text-xs py-0">
                  {interest}
                </Badge>
              ))}
              {member.interests.length > 3 && (
                <Badge variant="outline" className="text-xs py-0">
                  +{member.interests.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {showContactInfo && (
          <div className="space-y-1 pt-2 border-t">
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{member.email}</span>
            </div>
            {member.phoneVisible && member.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">{member.phone}</span>
              </div>
            )}
            {member.linkedin && (
              <div className="flex items-center text-sm">
                <Linkedin className="h-4 w-4 mr-2 text-muted-foreground" />
                <a 
                  href={member.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <span className="text-xs text-muted-foreground">
            {member.yearsExperience}+ years experience
          </span>
          <div className="flex gap-2">
            {isAdmin && member.change_history && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTimeline(true)}
              >
                <Clock className="h-4 w-4 mr-1" />
                Timeline
              </Button>
            )}
            {!hideProfileButton && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewProfile?.(member.id)}
              >
                View Profile
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Profile Change Timeline */}
      <ProfileChangeTimeline
        changeHistory={member.change_history || []}
        isOpen={showTimeline}
        onClose={() => setShowTimeline(false)}
        profileName={`${member.firstName} ${member.lastName}`}
      />
    </Card>
  );
}