import { MailWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpamFolderNoticeProps {
  className?: string;
}

/**
 * Shown immediately after an email-sent action.
 *
 * Users were missing the spam/junk instruction when it was rendered as the
 * smallest, faintest line on the screen, and assumed the email never arrived.
 * This keeps the footprint small (no full-width banner) but gives the
 * instruction real hierarchy: an icon, a bold lead-in, and a tinted surface
 * that separates it from the surrounding body copy.
 */
export default function SpamFolderNotice({ className }: SpamFolderNoticeProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left",
        className,
      )}
    >
      <MailWarning className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
      <p className="min-w-0 break-words text-sm leading-snug text-amber-900">
        <strong className="font-semibold">Don't see it?</strong> Check your{" "}
        <strong className="font-semibold">spam or junk folder</strong> — emails
        sometimes land there.
      </p>
    </div>
  );
}
