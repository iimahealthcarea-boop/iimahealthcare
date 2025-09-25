import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  User, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  History
} from "lucide-react";
import { ProfileChange, getProfileChangeHistory, formatFieldName, formatFieldValue } from "@/utils/profileChangeTracker";

interface ProfileChangeTimelineProps {
  profileUserId: string;
  profileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileChangeTimeline({ 
  profileUserId, 
  profileName, 
  isOpen, 
  onClose 
}: ProfileChangeTimelineProps) {
  const [changes, setChanges] = useState<ProfileChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());

  const fetchChangeHistory = useCallback(async () => {
    setLoading(true);
    try {
      const changeHistory = await getProfileChangeHistory(profileUserId);
      setChanges(changeHistory);
    } catch (error) {
      console.error("Error fetching change history:", error);
    } finally {
      setLoading(false);
    }
  }, [profileUserId]);

  useEffect(() => {
    if (isOpen && profileUserId) {
      fetchChangeHistory();
    }
  }, [isOpen, profileUserId, fetchChangeHistory]);

  const toggleExpanded = (changeId: string) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChanges(newExpanded);
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return <Plus className="w-4 h-4" />;
      case 'update':
        return <Edit className="w-4 h-4" />;
      case 'approve':
        return <CheckCircle className="w-4 h-4" />;
      case 'reject':
        return <XCircle className="w-4 h-4" />;
      case 'admin_edit':
        return <User className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approve':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reject':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin_edit':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChangeTitle = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return 'Profile Created';
      case 'update':
        return 'Profile Updated';
      case 'approve':
        return 'Profile Approved';
      case 'reject':
        return 'Profile Rejected';
      case 'admin_edit':
        return 'Admin Edit';
      default:
        return 'Profile Changed';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Change Timeline</CardTitle>
                <CardDescription>
                  Complete history of changes for {profileName}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-6 pt-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : changes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No changes recorded yet</p>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {changes.length > 3 && (
                <div className="text-xs text-muted-foreground mb-2 text-center">
                  Scroll down to see all {changes.length} changes
                </div>
              )}
              <ScrollArea className="flex-1 w-full">
                <div className="space-y-4 pr-4 pb-4">
                {changes.map((change, index) => {
                  const isExpanded = expandedChanges.has(change.id);
                  const changedFieldsCount = Object.keys(change.changedFields).length;
                  
                  return (
                    <div key={change.id} className="relative">
                      {/* Timeline line */}
                      {index < changes.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-border"></div>
                      )}
                      
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`p-2 rounded-full ${getChangeColor(change.changeType)}`}>
                              {getChangeIcon(change.changeType)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm">
                                    {getChangeTitle(change.changeType)}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {changedFieldsCount} field{changedFieldsCount !== 1 ? 's' : ''} changed
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(change.updatedAt)}
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-3">
                                Changed by <span className="font-medium">{change.updatedByName}</span>
                              </p>
                              
                              {/* Field changes */}
                              {changedFieldsCount > 0 && (
                                <div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpanded(change.id)}
                                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-3 h-3 mr-1" />
                                        Hide details
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3 mr-1" />
                                        Show details
                                      </>
                                    )}
                                  </Button>
                                  
                                  {isExpanded && (
                                    <div className="mt-3 space-y-2">
                                      <Separator />
                                      {Object.entries(change.changedFields).map(([field, values]) => (
                                        <div key={field} className="text-sm">
                                          <div className="font-medium text-foreground mb-1">
                                            {formatFieldName(field)}
                                          </div>
                                          <div className="space-y-1 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                                From: {formatFieldValue(values.oldValue, field)}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                To: {formatFieldValue(values.newValue, field)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
