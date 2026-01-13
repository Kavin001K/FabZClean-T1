import { useAuth } from '../contexts/auth-context';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { UserX, LogOut } from 'lucide-react';

export default function AccountInactivePage() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <UserX className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Account Inactive</CardTitle>
          <CardDescription>
            Your account has been deactivated. Please contact your administrator for assistance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              If you believe this is an error, please reach out to support at{' '}
              <a href="mailto:support@fabzclean.com" className="underline">
                support@fabzclean.com
              </a>
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

