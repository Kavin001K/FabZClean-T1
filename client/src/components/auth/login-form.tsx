import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { mergeUserSettings, readStoredUserSettings, resolveLandingPage } from '@/lib/user-settings';
import { handleFormEnterNavigation } from '@/lib/enter-navigation';

export const LoginForm: React.FC = () => {
  const [, setLocation] = useLocation();
  const { signIn } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error, employee } = await signIn(username, password);

      if (error) {
        setError(error);
      } else {
        if (redirectTo) {
          setLocation(redirectTo);
          return;
        }
        try {
          const token = localStorage.getItem('employee_token');
          if (token && employee) {
            const localSettings = readStoredUserSettings(employee.id);
            const settingsResponse = await fetch('/api/settings/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (settingsResponse.ok) {
              const settingsPayload = await settingsResponse.json();
              const normalizedSettings = mergeUserSettings(settingsPayload?.settings, localSettings);
              setLocation(resolveLandingPage(normalizedSettings.landingPage, employee.role));
              return;
            }

            setLocation(resolveLandingPage(localSettings.landingPage, employee.role));
            return;
          }
        } catch (settingsError) {
          console.warn('[Login] Falling back to default landing page:', settingsError);
        }

        setLocation(resolveLandingPage('/dashboard', employee?.role));
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/25 rounded-full blur-3xl animate-pulse will-change-transform" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-pulse will-change-transform" style={{ animationDelay: '2s', animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-primary/10 rounded-full blur-3xl animate-pulse will-change-transform" style={{ animationDelay: '1s', animationDuration: '12s' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMjIgNmgyVjIyaC0ydjE0em00LTI4aDJ2LTJoLTJ2MnptMCAyOGgydi0yaC0ydjJ6bTQ0LTMyaDJ2LTJoLTJ2MnptMCAzMmgydi0yaC0ydjJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
      </div>

      <div className={`relative z-10 w-full max-w-md px-4 transition-all duration-700 ease-out motion-reduce:transition-none ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-2 py-2 mb-4 transition-transform duration-500 hover:scale-105">
            <img src="/assets/fabclean-logo.png" alt="Fab Clean Logo" className="h-11 w-auto object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FabZClean</h1>
          <p className="text-slate-300 mt-1 text-sm">Laundry Management System</p>
        </div>

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:border-primary/35 hover:bg-white/[0.12]">
          <div className="h-1 w-full mb-6 rounded-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white">Welcome Back</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to your employee account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300 text-sm font-medium">User ID or Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter User ID or Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:bg-white/15 focus:border-primary/50 focus:ring-primary/20 transition-[background-color,border-color,box-shadow,transform] duration-200 rounded-xl"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:bg-white/15 focus:border-primary/50 focus:ring-primary/20 transition-[background-color,border-color,box-shadow,transform] duration-200 rounded-xl"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all duration-200 rounded-xl hover:-translate-y-0.5 active:translate-y-0"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-slate-500 mt-6">
            Contact your administrator to create an employee account
          </p>
        </div>

      </div>

      <div className="absolute bottom-1.5 left-0 right-0 px-3 text-center text-[9px] leading-tight text-slate-400/40">
        <p className="truncate sm:whitespace-normal">
          Copyright © 2026 Ace-Digital. All rights reserved.{" "}
          <span className="opacity-60">|</span>{" "}
          <a
            href="https://acedigital.space/Terms%20of%20Service"
            target="_blank"
            rel="noreferrer"
            className="text-slate-300/45 underline decoration-slate-400/30 underline-offset-2 transition-all hover:text-slate-200/80 focus-visible:text-slate-100"
          >
            Terms of Use
          </a>{" "}
          <span className="opacity-60">|</span>{" "}
          <a
            href="https://acedigital.space/Privacy%20Policy"
            target="_blank"
            rel="noreferrer"
            className="text-slate-300/45 underline decoration-slate-400/30 underline-offset-2 transition-all hover:text-slate-200/80 focus-visible:text-slate-100"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};
