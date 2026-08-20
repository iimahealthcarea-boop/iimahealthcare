import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Edit,
  Users,
  Search,
  Star,
  Briefcase,
  BarChart3,
  MapPin,
  Heart,
  SlidersHorizontal,
  Info,
  Network,
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { ReactNode } from 'react';
import { useGreeting } from '@/hooks/useGreeting';

type Profile = Tables<'profiles'>;

export type HomeTab = 'all' | 'directory';

interface HomeSectionProps {
  firstName?: string | null;
  recentMembers: Profile[];
  recentLoading: boolean;
  totalMembers: number;
  shownMembers: number;
  isStarred: (userId: string) => boolean;
  activeTab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
  onOpenDirectory: () => void;
  onOpenProfile: () => void;
  onViewMember: (member: Profile) => void;
  /** Existing "Raise an Issue" dialog trigger, passed through unchanged. */
  issueTrigger: ReactNode;
}

const getInitials = (firstName?: string | null, lastName?: string | null) =>
  `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

/** Deterministic avatar tint so each member keeps a stable colour, as in the design. */
const AVATAR_TINTS = [
  'bg-blue-700',
  'bg-purple-500',
  'bg-teal-700',
  'bg-emerald-800',
  'bg-indigo-600',
  'bg-cyan-700',
];
const tintFor = (id: string) => {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
};

const QUICK_FILTERS = [
  { icon: Briefcase, label: 'Organization Type', value: 'All types' },
  { icon: BarChart3, label: 'Experience Level', value: 'All levels' },
  { icon: MapPin, label: 'Location', value: 'All locations' },
  { icon: Heart, label: 'Interests', value: 'All interests' },
];

export default function HomeSection({
  firstName,
  recentMembers,
  recentLoading,
  totalMembers,
  shownMembers,
  isStarred,
  activeTab,
  onTabChange,
  onOpenDirectory,
  onOpenProfile,
  onViewMember,
  issueTrigger,
}: HomeSectionProps) {
  const greeting = useGreeting();

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Welcome — greeting follows the time of day in IST */}
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-bold leading-tight sm:text-3xl">
          {greeting.text}, {firstName || 'there'}!{' '}
          <span aria-hidden="true">{greeting.emoji}</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          {greeting.subtitle}
        </p>
      </div>

      {/* Edit Profile / Raise an Issue */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenProfile}
          className="min-w-0 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
            <Edit className="h-5 w-5 flex-shrink-0 text-foreground/80 sm:mt-0.5" />
            <div className="min-w-0">
              <div className="break-words font-semibold">Edit Profile</div>
              <div className="break-words text-xs text-muted-foreground sm:text-sm">
                Update your information
              </div>
            </div>
          </div>
        </button>

        {issueTrigger}
      </div>

      {/* Discover Alumni */}
      <div className="min-w-0 rounded-xl bg-primary/[0.07] p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Users className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary" />
            <div className="min-w-0">
              <h2 className="break-words text-lg font-bold text-primary">Discover Alumni</h2>
              <p className="break-words text-sm text-muted-foreground">
                Find and connect with alumni across organizations
              </p>
            </div>
          </div>
          <Button onClick={onOpenDirectory} className="w-full flex-shrink-0 sm:w-auto">
            <Search className="mr-2 h-4 w-4 flex-shrink-0" />
            Search Directory
          </Button>
        </div>
      </div>

      {/* All Members / My Directory tabs */}
      <div className="min-w-0 border-b border-border">
        <div className="grid grid-cols-2">
          {([
            { key: 'all' as HomeTab, label: 'All Members' },
            { key: 'directory' as HomeTab, label: 'My Directory' },
          ]).map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                aria-current={active ? 'page' : undefined}
                className={`-mb-px min-w-0 border-b-2 px-2 py-3 text-sm font-medium transition-colors sm:text-base ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="block truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recently Joined */}
      <div className="min-w-0">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <h2 className="min-w-0 truncate text-lg font-bold">Recently Joined</h2>
          <button
            type="button"
            onClick={onOpenDirectory}
            className="flex-shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            View all
          </button>
        </div>

        {recentLoading ? (
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <Skeleton className="mx-auto mb-3 h-16 w-16 rounded-full" />
                <Skeleton className="mx-auto mb-2 h-4 w-3/4" />
                <Skeleton className="mx-auto h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : recentMembers.length === 0 ? (
          <Card className="min-w-0">
            <CardContent className="p-6 text-center">
              <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No members to show yet.</p>
            </CardContent>
          </Card>
        ) : (
          /* Wraps into a grid rather than scrolling sideways, so nothing is cut off. */
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {recentMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onViewMember(member)}
                className="relative min-w-0 rounded-xl border bg-card p-4 text-center transition-all hover:border-primary/40 hover:shadow-sm"
              >
                {isStarred(member.user_id) && (
                  <Star
                    className="absolute right-3 top-3 h-5 w-5 fill-amber-400 text-amber-400"
                    aria-label="Starred"
                  />
                )}
                <Avatar className="mx-auto mb-3 h-16 w-16">
                  <AvatarImage
                    src={member.avatar_url || ''}
                    alt={`${member.first_name} ${member.last_name}`}
                  />
                  <AvatarFallback
                    className={`${tintFor(member.id)} text-lg font-semibold text-white`}
                  >
                    {getInitials(member.first_name, member.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="line-clamp-2 break-words text-sm font-bold leading-tight">
                  {member.first_name} {member.last_name}
                </div>
                {member.position && (
                  <div className="mt-1 line-clamp-1 break-words text-xs text-muted-foreground">
                    {member.position}
                  </div>
                )}
                {member.organization && (
                  <div className="line-clamp-1 break-words text-xs text-muted-foreground">
                    {member.organization}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="min-w-0">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <h2 className="min-w-0 truncate text-lg font-bold">Quick Filters</h2>
          <button
            type="button"
            onClick={onOpenDirectory}
            aria-label="Open all filters"
            className="flex-shrink-0 rounded-md p-1.5 text-primary hover:bg-primary/10"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          {QUICK_FILTERS.map(({ icon: Icon, label, value }) => (
            <button
              key={label}
              type="button"
              onClick={onOpenDirectory}
              className="min-w-0 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex min-w-0 items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="break-words font-medium">{label}</div>
                  <div className="break-words text-sm text-muted-foreground">{value}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Showing count */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl bg-primary/[0.07] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Info className="h-4 w-4 flex-shrink-0 text-primary" />
          <span className="min-w-0 break-words text-sm text-primary">
            Showing {shownMembers} of {totalMembers} members
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenDirectory}
          className="flex-shrink-0 text-sm font-medium text-primary hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Expand Your Network */}
      <div className="min-w-0 rounded-xl bg-primary/[0.07] p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Network className="h-5 w-5 text-primary" />
            </span>
            <div className="min-w-0">
              <h2 className="break-words font-bold">Expand Your Network</h2>
              <p className="break-words text-sm text-muted-foreground">
                Use advanced search to find alumni by skills, bio, interests and more.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onOpenDirectory}
            className="w-full flex-shrink-0 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary sm:w-auto"
          >
            Advanced Search
          </Button>
        </div>
      </div>
    </div>
  );
}
