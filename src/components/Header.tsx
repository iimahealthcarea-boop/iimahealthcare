import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-10 w-10 text-blue-200" />
              <div>
                <h1 className="text-2xl font-bold">IIM-AMS</h1>
                <p className="text-sm text-blue-200">Alumni Management System</p>
              </div>
            </div>
          </div>

          {showUserInfo && user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-blue-100">
                <User className="h-5 w-5" />
                <span className="text-sm">
                  Welcome, {profile?.first_name} {profile?.last_name}
                </span>
              </div>
              {showSignOut && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Account
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="w-full flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="w-full flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
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