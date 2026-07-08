import { COUNTRIES, type Country } from '@/data/countries';

/**
 * Returns the list of countries used by the country / dial-code selectors.
 *
 * Previously this fetched from restcountries.com at runtime, but that API's
 * v3.1 endpoint was deprecated and now returns an error object instead of an
 * array — which left every country dropdown empty. The data is now bundled
 * locally (see src/data/countries.ts) so the dropdowns always populate with no
 * network dependency. The hook keeps the same shape for backwards compatibility.
 */
export const useCountries = (): {
  countries: Country[];
  loading: boolean;
  error: string | null;
} => {
  return { countries: COUNTRIES, loading: false, error: null };
};

export type { Country };
