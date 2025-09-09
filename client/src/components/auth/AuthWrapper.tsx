import { useNetlifyIdentity } from '@/hooks/use-netlify-identity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading, isAuthenticated, login } = useNetlifyIdentity();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Checking authentication status</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to FabZClean</CardTitle>
            <CardDescription>
              Please sign in to access your dashboard and manage your cleaning operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={login} 
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              You'll be redirected to the Netlify Identity login page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated, show the main application
  return <>{children}</>;
}
