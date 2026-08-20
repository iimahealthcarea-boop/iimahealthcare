import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, ThumbsUp, Bell, X, Loader2 } from 'lucide-react';
import { ActiveEvent, useEventAttendees } from '@/hooks/useActiveEvent';
import EventAttendeesDialog from './EventAttendeesDialog';
import EventIllustration from './EventIllustration';

interface EventCardProps {
  event: ActiveEvent;
  onRsvp: () => Promise<boolean>;
  rsvpPending: boolean;
  onEnableReminder: () => Promise<boolean>;
  reminderPending: boolean;
}

const PREVIEW_COUNT = 5;

const getInitials = (first?: string | null, last?: string | null) =>
  `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();

/**
 * Event announcement modal, laid out to match the reference design:
 * illustration + header on one row, description, RSVP panel, attendee row,
 * and a ruled-off reminder footer.
 */
export default function EventCard({
  event,
  onRsvp,
  rsvpPending,
  onEnableReminder,
  reminderPending,
}: EventCardProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const [showAttendees, setShowAttendees] = useState(false);
  const { attendees, loading: attendeesLoading } = useEventAttendees(event.id, true);

  const preview = attendees.slice(0, PREVIEW_COUNT);
  const overflow = Math.max(event.attendee_count - preview.length, 0);

  const handleRsvp = async () => {
    const ok = await onRsvp();
    toast(
      ok
        ? { title: "You're in!", description: 'Thanks for showing your interest.' }
        : {
            title: 'Could not save your RSVP',
            description: 'Please try again in a moment.',
            variant: 'destructive',
          }
    );
  };

  const handleReminder = async () => {
    const ok = await onEnableReminder();
    toast(
      ok
        ? { title: 'Reminder enabled', description: "We'll remind you closer to the event." }
        : {
            title: 'Could not enable the reminder',
            description: 'Please try again in a moment.',
            variant: 'destructive',
          }
    );
  };

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[3px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          <DialogPrimitive.Content
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-2xl duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            aria-describedby="event-modal-desc"
          >
            <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-md p-1 text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:right-5 sm:top-5">
              <X className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            <div className="min-w-0 overflow-y-auto overflow-x-hidden px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
              {/* Illustration + header */}
              <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
                <EventIllustration className="h-28 w-28 flex-shrink-0 sm:h-[128px] sm:w-[128px]" />

                <div className="min-w-0 flex-1 pr-8 sm:pr-7">
                  <span className="inline-block rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-600">
                    Upcoming Event
                  </span>

                  <DialogPrimitive.Title className="mt-2.5 break-words text-[21px] font-bold leading-tight text-slate-900 sm:text-[25px]">
                    {event.title}
                  </DialogPrimitive.Title>

                  <div className="mt-2.5 space-y-1.5">
                    {event.date_label && (
                      <div className="flex min-w-0 items-center justify-center gap-2 text-[15px] text-slate-600 sm:justify-start">
                        <Calendar className="h-[18px] w-[18px] flex-shrink-0 text-slate-500" strokeWidth={2} />
                        <span className="break-words">{event.date_label}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex min-w-0 items-center justify-center gap-2 text-[15px] text-slate-600 sm:justify-start">
                        <MapPin className="h-[18px] w-[18px] flex-shrink-0 text-slate-500" strokeWidth={2} />
                        <span className="break-words">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <DialogPrimitive.Description
                  id="event-modal-desc"
                  className="mt-5 break-words text-[15px] leading-relaxed text-slate-600 sm:mt-6"
                >
                  {event.description}
                </DialogPrimitive.Description>
              )}

              {/* RSVP */}
              {event.has_rsvped ? (
                <div className="mt-5 flex min-w-0 items-center gap-3.5 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 sm:p-4">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <ThumbsUp className="h-[22px] w-[22px] text-white" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <div className="break-words text-[15px] font-bold text-slate-900">You're in!</div>
                    <div className="break-words text-sm text-slate-600">
                      Thanks for showing your interest.
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRsvp}
                  disabled={rsvpPending}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                >
                  {rsvpPending ? (
                    <>
                      <Loader2 className="h-[18px] w-[18px] flex-shrink-0 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2.2} />
                      You're In
                    </>
                  )}
                </button>
              )}

              {/* Attendees */}
              <div className="mt-6 min-w-0">
                <div className="mb-3.5 flex min-w-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Users className="h-[18px] w-[18px] flex-shrink-0 text-blue-600" strokeWidth={2} />
                    <span className="min-w-0 break-words text-[15px] text-slate-700">
                      {event.attendee_count === 0
                        ? 'Be the first to join'
                        : `${event.attendee_count} ${
                            event.attendee_count === 1 ? 'alumnus is' : 'alumni are'
                          } joining`}
                    </span>
                  </div>
                  {event.attendee_count > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAttendees(true)}
                      className="flex-shrink-0 text-[15px] font-semibold text-blue-600 hover:underline"
                    >
                      See all
                    </button>
                  )}
                </div>

                {attendeesLoading ? (
                  <div className="flex gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="min-w-0">
                        <Skeleton className="mb-2 h-14 w-14 rounded-full" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                    ))}
                  </div>
                ) : preview.length > 0 ? (
                  <div className="flex min-w-0 flex-wrap justify-center gap-x-1.5 gap-y-4 sm:justify-start sm:gap-x-3">
                    {preview.map((a) => (
                      <div key={a.user_id} className="w-[48px] min-w-0 text-center sm:w-[68px]">
                        <Avatar className="mx-auto mb-2 h-12 w-12 sm:h-[60px] sm:w-[60px]">
                          <AvatarImage
                            src={a.avatar_url || ''}
                            alt={`${a.first_name || ''} ${a.last_name || ''}`}
                          />
                          <AvatarFallback className="bg-blue-600 text-sm font-semibold text-white">
                            {getInitials(a.first_name, a.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="break-words text-[10px] font-medium leading-tight text-slate-700 sm:text-xs">
                          {a.first_name} {a.last_name}
                        </div>
                      </div>
                    ))}

                    {overflow > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAttendees(true)}
                        className="w-[48px] min-w-0 text-center sm:w-[68px]"
                      >
                        <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 sm:h-[60px] sm:w-[60px] sm:text-sm">
                          +{overflow}
                        </span>
                        <span className="block truncate text-xs leading-tight text-slate-700">
                          More
                        </span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Reminder footer */}
              {event.reminders_enabled && (
                <div className="mt-5 min-w-0 border-t border-slate-200 pt-4">
                  {event.reminder_opted_in ? (
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Bell className="h-[18px] w-[18px] flex-shrink-0 text-blue-600" strokeWidth={2} />
                      <span className="min-w-0 break-words text-sm text-slate-600">
                        We'll remind you closer to the event
                      </span>
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Bell className="h-[18px] w-[18px] flex-shrink-0 text-slate-500" strokeWidth={2} />
                        <span className="min-w-0 break-words text-sm text-slate-600">
                          We'll remind you closer to the event
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleReminder}
                        disabled={reminderPending}
                        className="flex h-11 w-full flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 px-5 text-[15px] font-semibold text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 sm:w-auto"
                      >
                        {reminderPending ? (
                          <>
                            <Loader2 className="h-[18px] w-[18px] flex-shrink-0 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Bell className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2.2} />
                            Remind Me
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <EventAttendeesDialog
        eventId={event.id}
        eventTitle={event.title}
        isOpen={showAttendees}
        onOpenChange={setShowAttendees}
      />
    </>
  );
}
