import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, Star, X } from 'lucide-react';

export const EXPERIENCE_LEVELS = [
  'Student',
  'Recent Graduate',
  'Entry Level',
  'Mid Level',
  'Senior Level',
  'Executive',
];

export const ORGANIZATION_TYPES = [
  'Hospital / Clinic',
  'HealthTech Company',
  'Pharmaceutical',
  'Biotech',
  'Medical Devices',
  'Consulting Firm',
  'Public Health / Policy Organization',
  'Health Insurance',
  'Academic / Research Institution',
  'Startup / Entrepreneurial Venture',
  'Investment / Venture Capital',
  'Other',
];

interface MemberFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  experienceFilter: string;
  onExperienceFilterChange: (value: string) => void;
  organizationTypeFilter: string;
  onOrganizationTypeFilterChange: (value: string) => void;
  showStarredOnly: boolean;
  onShowStarredOnlyChange: (value: boolean) => void;
  /** Star filter is hidden for admins, matching existing behaviour. */
  showStarFilter?: boolean;
  resultLabel: string;
  searchPlaceholder?: string;
  idPrefix: string;
}

/**
 * Compact search + filters. The search field is always visible; the dropdown
 * filters collapse behind a "Filters" toggle on small screens so the directory
 * list stays the focus, and expand inline from md upwards.
 */
export default function MemberFilterBar({
  searchTerm,
  onSearchTermChange,
  experienceFilter,
  onExperienceFilterChange,
  organizationTypeFilter,
  onOrganizationTypeFilterChange,
  showStarredOnly,
  onShowStarredOnlyChange,
  showStarFilter = true,
  resultLabel,
  searchPlaceholder = 'Search by name, organization, skills...',
  idPrefix,
}: MemberFilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount =
    (experienceFilter !== 'all' ? 1 : 0) +
    (organizationTypeFilter !== 'all' ? 1 : 0) +
    (showStarredOnly ? 1 : 0);

  const clearAll = () => {
    onSearchTermChange('');
    onExperienceFilterChange('all');
    onOrganizationTypeFilterChange('all');
    onShowStarredOnlyChange(false);
  };

  const hasAnything = activeFilterCount > 0 || searchTerm.length > 0;

  return (
    <div className="w-full min-w-0 space-y-3">
      {/* Search row */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`${idPrefix}-search`}
            aria-label="Search members"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="h-11 w-full min-w-0 pl-9 pr-9"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchTermChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Toggle is only needed while the filters are collapsed (below md). */}
        <Button
          type="button"
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          className="h-11 flex-shrink-0 px-3 md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-2 sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 min-w-[1.25rem] justify-center px-1 text-[11px]"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters: collapsible under md, always shown from md up */}
      <div className={`${filtersOpen ? 'grid' : 'hidden'} min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid lg:grid-cols-3`}>
        <div className="min-w-0">
          <Select value={experienceFilter} onValueChange={onExperienceFilterChange}>
            <SelectTrigger
              id={`${idPrefix}-experience`}
              aria-label="Experience level"
              className="h-11 w-full min-w-0"
            >
              <SelectValue placeholder="All experience levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All experience levels</SelectItem>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <Select
            value={organizationTypeFilter}
            onValueChange={onOrganizationTypeFilterChange}
          >
            <SelectTrigger
              id={`${idPrefix}-orgtype`}
              aria-label="Organization type"
              className="h-11 w-full min-w-0"
            >
              <SelectValue placeholder="All organization types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All organization types</SelectItem>
              {ORGANIZATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showStarFilter && (
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <Button
              type="button"
              variant={showStarredOnly ? 'default' : 'outline'}
              onClick={() => onShowStarredOnlyChange(!showStarredOnly)}
              className="h-11 w-full"
            >
              <Star
                className={`mr-2 h-4 w-4 flex-shrink-0 ${showStarredOnly ? 'fill-current' : ''}`}
              />
              <span className="truncate">
                {showStarredOnly ? 'Showing starred' : 'Starred only'}
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* Result summary */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg bg-primary/5 px-3 py-2">
        <span className="min-w-0 break-words text-xs text-primary sm:text-sm">{resultLabel}</span>
        {hasAnything && (
          <button
            type="button"
            onClick={clearAll}
            className="flex-shrink-0 text-xs font-medium text-primary hover:underline sm:text-sm"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
