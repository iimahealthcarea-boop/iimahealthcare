import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Clock, User, Shield, X, ChevronDown, ChevronUp } from "lucide-react";

interface ChangeRecord {
  updatedBy: string;
  updatedAt: string;
  changedFields: string[];
  isAdmin: boolean;
}

interface ProfileChangeTimelineProps {
  changeHistory: ChangeRecord[];
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
}

const formatFieldName = (fieldName: string): string => {
  const fieldMappings: Record<string, string> = {
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email",
    phone: "Phone",
    organization: "Organization",
    organization_type: "Organization Type",
    position: "Position",
    experience_level: "Experience Level",
    bio: "Bio",
    location: "Location",
    city: "City",
    country: "Country",
    linkedin_url: "LinkedIn URL",
    website_url: "Website URL",
    interests: "Interests",
    skills: "Skills",
    program: "Program",
    graduation_year: "Graduation Year",
    avatar_url: "Profile Picture",
    approval_status: "Approval Status"
  };
  
  return fieldMappings[fieldName] || fieldName;
};

export const ProfileChangeTimeline = ({ 
  changeHistory, 
  isOpen, 
  onClose, 
  profileName 
}: ProfileChangeTimelineProps) => {
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  const toggleEntry = (index: number) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEntries(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Profile Change Timeline
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Changes for {profileName}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {changeHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No changes recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {changeHistory
                  .slice()
                  .reverse()
                  .map((change, index) => {
                    const isExpanded = expandedEntries.has(index);
                    const actualIndex = changeHistory.length - 1 - index;
                    
                    return (
                      <div key={actualIndex} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {change.isAdmin ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                User
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(change.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEntry(index)}
                            className="h-auto p-1"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">
                              {change.changedFields.length} field{change.changedFields.length !== 1 ? 's' : ''} updated
                            </span>
                          </p>
                          
                          {isExpanded && (
                            <>
                              <Separator />
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Changed Fields:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {change.changedFields.map((field) => (
                                    <Badge key={field} variant="outline" className="text-xs">
                                      {formatFieldName(field)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};