/**
 * LinkedIn personal profile URL validation and normalization.
 *
 * Only personal profile URLs (linkedin.com/in/<slug>) are accepted. Company,
 * school, jobs and directory pages are rejected — a member's own profile is
 * what the directory is for.
 *
 * Kept in sync with the `profiles_linkedin_url_format` CHECK constraint in
 * supabase/migrations/20260819000000_add_linkedin_url_format_check.sql
 */

/** LinkedIn paths that are valid URLs but are not personal profiles. */
const NON_PROFILE_PATHS = [
  'company',
  'school',
  'showcase',
  'jobs',
  'pub/dir',
  'groups',
  'learning',
  'help',
  'feed',
  'posts',
  'events',
  'newsletters',
];

/**
 * Matches an optional scheme, an optional country/www subdomain, then
 * linkedin.com/in/<slug>. Slug is intentionally permissive about characters
 * (LinkedIn allows Unicode slugs) but must not contain a path separator,
 * query string or fragment.
 */
const PROFILE_PATTERN =
  /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?(?:www\.)?linkedin\.com\/in\/([^/?#\s]+)\/?$/i;

/** Any linkedin.com URL, used to tell "wrong LinkedIn page" from "not LinkedIn". */
const LINKEDIN_DOMAIN_PATTERN =
  /^(?:https?:\/\/)?(?:[a-z0-9-]+\.)*linkedin\.com(?:\/|$)/i;

export interface LinkedInValidationResult {
  valid: boolean;
  error?: string;
  /** Canonical form to persist, present only when valid. */
  normalized?: string;
}

/**
 * Validate and normalize a LinkedIn personal profile URL.
 *
 * Normalization strips tracking/query params, fragments, trailing slashes and
 * stray whitespace, then rewrites to a canonical
 * `https://www.linkedin.com/in/<slug>` form. Profile slugs — including the
 * hash-style suffixes LinkedIn appends (e.g. `-510aaa120`) — are preserved
 * exactly.
 */
export const validateLinkedInUrl = (
  input: string | null | undefined
): LinkedInValidationResult => {
  if (!input || !input.trim()) {
    return { valid: false, error: 'LinkedIn URL is required' };
  }

  // Users paste from mobile share sheets, which can introduce stray spaces
  // inside the URL (e.g. "linkedin.com/ in/name- 123").
  let candidate = input.trim().replace(/\s+/g, '');

  // Drop query string and fragment before matching: LinkedIn's mobile share
  // links carry ?utm_source=share_via&utm_medium=member_android etc.
  candidate = candidate.split('#')[0].split('?')[0];

  // Strip a leading @, a common convention when writing handles by hand.
  candidate = candidate.replace(/^@/, '');

  const match = candidate.match(PROFILE_PATTERN);

  if (!match) {
    if (LINKEDIN_DOMAIN_PATTERN.test(candidate)) {
      const path = candidate
        .replace(/^(?:https?:\/\/)?(?:[a-z0-9-]+\.)*linkedin\.com/i, '')
        .replace(/^\//, '');
      const section = NON_PROFILE_PATHS.find(
        (p) => path.toLowerCase() === p || path.toLowerCase().startsWith(`${p}/`)
      );

      if (section) {
        return {
          valid: false,
          error: `That is a LinkedIn ${section} page. Please enter your personal profile URL (linkedin.com/in/...).`,
        };
      }

      return {
        valid: false,
        error:
          'Enter your personal LinkedIn profile URL, e.g. https://www.linkedin.com/in/your-name',
      };
    }

    return {
      valid: false,
      error:
        'Enter a valid LinkedIn profile URL, e.g. https://www.linkedin.com/in/your-name',
    };
  }

  const slug = match[1];

  // A bare "/in/" with nothing after it slips past the pattern only if the
  // slug is empty, but guard explicitly rather than relying on that.
  if (!slug) {
    return {
      valid: false,
      error:
        'Enter a valid LinkedIn profile URL, e.g. https://www.linkedin.com/in/your-name',
    };
  }

  return {
    valid: true,
    normalized: `https://www.linkedin.com/in/${slug}`,
  };
};
