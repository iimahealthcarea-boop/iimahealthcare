/**
 * Organization name matching for client-side member search.
 *
 * Organizations live in the `organizations` JSONB column as
 * [{ currentOrg, orgType, role, experience, description }, ...]. The legacy
 * scalar `profiles.organization` column is not written by any current UI, so
 * matching on it alone finds nothing.
 *
 * Mirrors the admin-side search, which matches the same currentOrg names via
 * the generated `organizations_search_text` column.
 */

type OrganizationEntry = {
  currentOrg?: unknown;
};

/**
 * Extract every organization name from a profile's `organizations` JSONB.
 * All entries are returned, not just the first, so a member is findable by any
 * organization they have listed.
 */
export const getOrganizationNames = (organizations: unknown): string[] => {
  if (!Array.isArray(organizations)) return [];

  return organizations
    .map((entry) => (entry as OrganizationEntry)?.currentOrg)
    .filter((name): name is string => typeof name === 'string' && name.trim() !== '');
};

/**
 * Case-insensitive substring match against any of the profile's organization
 * names. `searchLower` is expected to already be lower-cased by the caller,
 * matching the surrounding filter code.
 */
export const matchesOrganization = (
  organizations: unknown,
  searchLower: string
): boolean =>
  getOrganizationNames(organizations).some((name) =>
    name.toLowerCase().includes(searchLower)
  );
