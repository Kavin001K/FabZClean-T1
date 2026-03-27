import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

export function SessionTimeoutWarning() {
    const { showSessionWarning, sessionTimeRemaining, extendSession, signOut } = useAuth();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await signOut();
        window.location.href = '/login';
    };

    const handleExtend = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        extendSession();
    };

    return (
        <AlertDialog open={showSessionWarning}>
            <AlertDialogContent className="max-w-md" onEscapeKeyDown={(e) => e.preventDefault()}>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                        <Clock className="w-5 h-5 animate-pulse" />
                        Session Expiring Soon
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4">
                            <p>
                                Your session will expire due to inactivity. You will be automatically logged out.
                            </p>

                            <div className="flex items-center justify-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="text-center">
                                    <p className="text-sm text-amber-700 dark:text-amber-300">Time Remaining</p>
                                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                                        {formatTime(sessionTimeRemaining)}
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Click "Stay Logged In" to continue your session, or "Logout Now" to end it immediately.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout Now
                    </Button>
                    <Button
                        onClick={handleExtend}
                        className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Stay Logged In
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
