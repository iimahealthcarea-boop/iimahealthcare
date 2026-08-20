import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, Building } from 'lucide-react';
import { useEventAttendees } from '@/hooks/useActiveEvent';

interface EventAttendeesDialogProps {
  eventId: string | null;
  eventTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const getInitials = (first?: string | null, last?: string | null) =>
  `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();

/** Full RSVP roster. Reuses existing profile data — no duplicated records. */
export default function EventAttendeesDialog({
  eventId,
  eventTitle,
  isOpen,
  onOpenChange,
}: EventAttendeesDialogProps) {
  const { attendees, loading, error, refresh } = useEventAttendees(eventId, isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="break-words">Who's joining</DialogTitle>
          <DialogDescription className="break-words">
            Alumni attending {eventTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Scrolls inside the dialog rather than pushing it past the viewport. */}
        <div className="-mx-1 max-h-[60vh] min-w-0 overflow-y-auto px-1">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                Couldn't load the attendee list.
              </p>
              <Button variant="outline" size="sm" onClick={refresh}>
                Try again
              </Button>
            </div>
          ) : attendees.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                No one has joined yet — be the first!
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {attendees.map((a) => (
                <li
                  key={a.user_id}
                  className="flex min-w-0 items-center gap-3 rounded-lg px-1 py-2"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src={a.avatar_url || ''}
                      alt={`${a.first_name || ''} ${a.last_name || ''}`}
                    />
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                      {getInitials(a.first_name, a.last_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {a.first_name} {a.last_name}
                    </div>
                    {a.position && (
                      <div className="truncate text-xs text-muted-foreground">{a.position}</div>
                    )}
                    {a.organization && (
                      <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                        <Building className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{a.organization}</span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
