import { useAuth } from '../../contexts/auth-context';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User, Settings, LogOut, Shield, Briefcase } from 'lucide-react';
import { useLocation } from 'wouter';

export const UserMenu = () => {
  const { employee } = useAuth();
  const [, setLocation] = useLocation();
  const { signOut } = useAuth();

  if (!employee) {
    return (
      <Button
        variant="ghost"
        onClick={() => setLocation('/login')}
      >
        Sign In
      </Button>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    setLocation('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return employee.username.substring(0, 2).toUpperCase();
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      franchise_manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      factory_manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrator',
      franchise_manager: 'Franchise Manager',
      factory_manager: 'Factory Manager',
    };
    return labels[role] || role;
  };

  // Get profile image from employee data
  const profileImage = (employee as any)?.profileImage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={profileImage || ''} alt={employee.fullName} />
            <AvatarFallback className="bg-primary text-white">
              {getInitials(employee.fullName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {employee.fullName || employee.username}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {employee.email || employee.employeeId}
            </p>
            <div className="pt-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(
                  employee.role
                )}`}
              >
                <Shield className="inline w-3 h-3 mr-1" />
                {getRoleLabel(employee.role)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              <Briefcase className="inline w-3 h-3 mr-1" />
              ID: {employee.employeeId}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation('/profile')}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
