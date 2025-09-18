import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  currentUser?: {
    name: string;
    role: 'admin' | 'member';
    profileComplete?: boolean;
  };
  onLogout?: () => void;
}

export function Header({ currentUser, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">IIMA Healthcare SIG</h1>
                <p className="text-xs text-muted-foreground">Alumni Directory</p>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <a href="#directory" className="text-sm font-medium hover:text-primary transition-colors">
              Directory
            </a>
            <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">
              About SIG
            </a>
            <a href="#resources" className="text-sm font-medium hover:text-primary transition-colors">
              Resources
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentUser.name}</span>
                    {currentUser.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">Admin</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  {currentUser.role === 'admin' && (
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
                <Button size="sm">
                  Apply to Join
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}