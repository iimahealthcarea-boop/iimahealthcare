import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraduationCap, User, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  showUserInfo?: boolean;
  showSignOut?: boolean;
}

export default function Header({ showUserInfo = false, showSignOut = false }: HeaderProps) {
  const { user, signOut } = useAuth();
  const profile = user?.profile;

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:h-20 sm:gap-4">
          {/* Brand — shrinks and truncates before it can push the actions off-screen */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <GraduationCap className="h-7 w-7 flex-shrink-0 text-blue-200 sm:h-10 sm:w-10" />
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight sm:text-xl lg:text-2xl">
                IIMA Healthcare SIG
              </h1>
              <p className="truncate text-[11px] text-blue-200 sm:text-sm">
                Directory
              </p>
            </div>
          </div>

          {showUserInfo && user && (
            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
              {/* Name is informative only — hidden on small screens where it would
                  crowd out the account menu (the menu repeats it). */}
              <div className="hidden min-w-0 items-center gap-3 text-blue-100 lg:flex">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || ''} alt="Profile" />
                  <AvatarFallback className="text-xs bg-blue-600 text-white">
                    {getInitials(profile?.first_name, profile?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[220px] truncate text-sm">
                  Welcome, {fullName}
                </span>
              </div>
              {showSignOut && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 sm:h-10 sm:px-4"
                    >
                      {/* Compact on mobile: avatar only. Full label from sm up. */}
                      <Avatar className="h-5 w-5 lg:hidden">
                        <AvatarImage src={profile?.avatar_url || ''} alt="Profile" />
                        <AvatarFallback className="bg-blue-600 text-[10px] text-white">
                          {getInitials(profile?.first_name, profile?.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <User className="hidden h-4 w-4 lg:mr-2 lg:inline" />
                      <span className="ml-2 hidden sm:inline lg:ml-0">Account</span>
                      <ChevronDown className="ml-1 h-4 w-4 sm:ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 max-w-[calc(100vw-1.5rem)]">
                    {fullName && (
                      <>
                        <DropdownMenuLabel className="truncate font-normal lg:hidden">
                          <span className="text-xs text-muted-foreground">Signed in as</span>
                          <div className="truncate text-sm font-medium">{fullName}</div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="lg:hidden" />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="w-full flex items-center">
                        <User className="h-4 w-4 mr-2 flex-shrink-0" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="w-full flex items-center">
                      <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
