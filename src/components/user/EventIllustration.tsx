/**
 * Event illustration from the reference design: a domed campus building with a
 * group of attendees on a pale blue disc, ringed by confetti. Inline SVG so it
 * scales cleanly and adds no asset/dependency weight.
 */
export default function EventIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Alumni gathering at the IIMA campus"
      className={className}
    >
      {/* Pale disc backdrop */}
      <circle cx="100" cy="100" r="66" fill="#DBE7FF" />

      <g clipPath="url(#evt-disc)">
        <clipPath id="evt-disc">
          <circle cx="100" cy="100" r="66" />
        </clipPath>

        {/* Campus building */}
        <g fill="#FFFFFF" stroke="#3B6FD4" strokeWidth="2.5" strokeLinejoin="round">
          {/* Dome */}
          <path d="M78 78a22 22 0 0 1 44 0z" />
          <rect x="72" y="78" width="56" height="6" rx="1.5" />
          {/* Columns block */}
          <rect x="76" y="84" width="48" height="42" />
        </g>
        <path d="M100 50v8" stroke="#3B6FD4" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="100" cy="49" r="2.5" fill="#3B6FD4" />

        {/* Column gaps */}
        <g stroke="#3B6FD4" strokeWidth="2.2" strokeLinecap="round">
          <path d="M86 90v30M100 90v30M114 90v30" />
        </g>

        {/* Base steps */}
        <rect x="66" y="126" width="68" height="6" rx="2" fill="#FFFFFF" stroke="#3B6FD4" strokeWidth="2.5" />

        {/* Attendee silhouettes */}
        <g fill="#2C5BC4">
          <circle cx="72" cy="132" r="8" />
          <path d="M60 166v-13a12 12 0 0 1 24 0v13z" />
        </g>
        <g fill="#1E4BA8">
          <circle cx="128" cy="132" r="8" />
          <path d="M116 166v-13a12 12 0 0 1 24 0v13z" />
        </g>
        <g fill="#3B6FD4">
          <circle cx="100" cy="128" r="9.5" />
          <path d="M86 166v-15a14 14 0 0 1 28 0v15z" />
        </g>
      </g>

      {/* Confetti ring */}
      <g strokeLinecap="round">
        <path d="M32 62l6-4" stroke="#F4B740" strokeWidth="3.5" />
        <path d="M44 44l3 6" stroke="#3B6FD4" strokeWidth="3.5" />
        <rect x="26" y="92" width="7" height="7" rx="1.5" fill="#F4B740" transform="rotate(20 29 95)" />
        <circle cx="40" cy="120" r="3.5" fill="#7C5BD9" />
        <path d="M52 148l5 4" stroke="#E8574A" strokeWidth="3.5" />
        <circle cx="66" cy="36" r="3.5" fill="#E8574A" />
        <path d="M96 24l0 7" stroke="#7C5BD9" strokeWidth="3.5" />
        <rect x="124" y="30" width="7" height="7" rx="1.5" fill="#3B6FD4" transform="rotate(-25 127 33)" />
        <path d="M152 48l-4 6" stroke="#F4B740" strokeWidth="3.5" />
        <circle cx="168" cy="76" r="3.5" fill="#3B6FD4" />
        <path d="M174 104l7 2" stroke="#E8574A" strokeWidth="3.5" />
        <rect x="160" y="128" width="7" height="7" rx="1.5" fill="#7C5BD9" transform="rotate(35 163 131)" />
        <path d="M140 158l5 5" stroke="#3B6FD4" strokeWidth="3.5" />
        <circle cx="104" cy="176" r="3.5" fill="#F4B740" />
        <path d="M74 172l-3 6" stroke="#7C5BD9" strokeWidth="3.5" />
      </g>
    </svg>
  );
}
