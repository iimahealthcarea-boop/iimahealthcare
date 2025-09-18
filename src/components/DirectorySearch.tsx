import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FilterOptions {
  programs: string[];
  orgTypes: string[];
  graduationYears: string[];
  locations: string[];
  experienceLevels: string[];
}

interface ActiveFilters {
  program?: string;
  orgType?: string;
  graduationYear?: string;
  location?: string;
  experienceLevel?: string;
}

interface DirectorySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  filterOptions: FilterOptions;
  resultsCount: number;
}

export function DirectorySearch({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFiltersChange,
  filterOptions,
  resultsCount
}: DirectorySearchProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof ActiveFilters, value: string) => {
    onFiltersChange({
      ...activeFilters,
      [key]: value === "all" ? undefined : value
    });
  };

  const clearFilter = (key: keyof ActiveFilters) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(activeFilters).filter(
    key => activeFilters[key as keyof ActiveFilters]
  ).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, organization, role, interests..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-20"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
        >
          <Filter className="h-4 w-4 mr-1" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {Object.entries(activeFilters).map(([key, value]) => 
            value && (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {key}: {value}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => clearFilter(key as keyof ActiveFilters)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Panel */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <label className="text-sm font-medium">Program</label>
              <Select
                value={activeFilters.program || "all"}
                onValueChange={(value) => handleFilterChange("program", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {filterOptions.programs.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Type</label>
              <Select
                value={activeFilters.orgType || "all"}
                onValueChange={(value) => handleFilterChange("orgType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {filterOptions.orgTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Graduation Year</label>
              <Select
                value={activeFilters.graduationYear || "all"}
                onValueChange={(value) => handleFilterChange("graduationYear", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {filterOptions.graduationYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select
                value={activeFilters.location || "all"}
                onValueChange={(value) => handleFilterChange("location", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {filterOptions.locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Experience Level</label>
              <Select
                value={activeFilters.experienceLevel || "all"}
                onValueChange={(value) => handleFilterChange("experienceLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {filterOptions.experienceLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {resultsCount} member{resultsCount !== 1 ? 's' : ''} found
          {searchQuery && ` for "${searchQuery}"`}
        </span>
      </div>
    </div>
  );
}