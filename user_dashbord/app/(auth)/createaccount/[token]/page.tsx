"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect } from "react";  
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

interface CreateAccountPageProps {
  token?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const CreateAccountContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathToken = (params as { token?: string })?.token;
  const queryToken = searchParams?.get?.("token");
  const token = pathToken ?? queryToken ?? "";

  const extractToken = (input: string) => {
    if (!input) return "";
    let v = input;
    for (let i = 0; i < 5; i++) {
      try {
        const decoded = decodeURIComponent(v);
        if (decoded === v) break;
        v = decoded;
      } catch {
        break;
      }
    }
    v = v.replace(/^[\?&]*token=/i, "");
    const jwt = v.match(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    return jwt ? jwt[0] : v;
  };

  const raw = extractToken(token);
  const encoded = encodeURIComponent(raw);

  const [showDialog, setShowDialog] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [user, setUser] = useState<CreateAccountPageProps | undefined>();
  const [isVerifying, setIsVerifying] = useState(false);

  const validate = () => {
    if (!email) return "Email is required";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const varifyEmailFromToken = async (token: string) => {
    setIsVerifying(true);
    try {
      const response = await axiosInstance.post(`/invite/verify-token`, {
        token: encoded,
      });
      setUser(response.data.data);
      setEmail(response.data.data.email);
    } catch (error: any) {
      setMessageType('error');
      setMessage(error?.response?.data?.message ?? (typeof error?.response?.data === 'string' ? error.response.data : undefined) ?? error?.message ?? 'Invalid or expired token');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (token) {
      varifyEmailFromToken(token);
    }
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!email) {
      setMessage('No email to accept');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await axiosInstance.post('/invite/update-status', {
        email,
        status: 'accepted'
      });
      setMessageType('success');
      setMessage('Invite accepted. Please set up your account.');
    } catch (err: any) {
      setMessageType('error');
      setMessage(err?.response?.data?.message ?? (typeof err?.response?.data === 'string' ? err.response.data : undefined) ?? err?.message ?? 'Failed to accept invite. You can still create an account.');
    } finally {
      setLoading(false);
      setShowDialog(false);
      setShowForm(true);
    }
  };

  const handleRejectInvite = async () => {
    if (!email) {
      setMessage('No email to reject');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await axiosInstance.post('/invite/update-status', {
        email,
        status: 'rejected'
      });
      setMessageType('success');
      setMessage('Invite rejected successfully.');
      setShowDialog(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      setMessageType('error');
      setMessage(err?.message || 'Failed to reject invite.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setMessage(null);
    const error = validate();
    if (error) {
      setMessage(error);
      setMessageType('error');
      return;
    }
    setLoading(true);
    try {
      // Call backend register API directly (no Firebase)
      const payload: any = {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email,
        password,
      };
      await axiosInstance.post('/auth/register', payload);
      setMessageType('success');
      setMessage('Account created successfully. You can now log in.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 800);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setMessage('Email is already in use. Please log in instead.');
      } else {
        setMessage(err?.response?.data?.message ?? (typeof err?.response?.data === 'string' ? err.response.data : undefined) ?? err?.message ?? 'Failed to create account.');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Invitation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center bg-muted">
                <Mail className="w-6 h-6 text-foreground" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Invitation Received
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You've been invited to join our platform
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {isVerifying && (
              <div className="rounded-lg border bg-muted/50 p-6 space-y-3">
                <div className="flex justify-center">
                  <svg
                    className="h-8 w-8 animate-spin text-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <p className="text-center font-medium text-foreground">Verifying invitation...</p>
                <p className="text-center text-sm text-muted-foreground">
                  Please wait while we validate your invitation 
                </p>
              </div>
            )}

            {!isVerifying && user && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-xs text-muted-foreground">Welcome,</p>
                <p className="font-semibold text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              </div>
            )}

            {!isVerifying && user && (
              <p className="text-sm text-center text-muted-foreground">
                Would you like to accept this invitation?
              </p>
            )}

            {user === undefined && (
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            )}
          </div>

          {message && messageType === 'error' && !isVerifying && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter className="sm:space-x-2">
            <AlertDialogCancel
              onClick={handleRejectInvite}
              disabled={loading || isVerifying || (messageType === 'error' && !!message)}
            >
              {loading ? 'Declining...' : 'Decline'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAcceptInvite}
              disabled={loading || isVerifying || (messageType === 'error' && !!message)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Account Creation Form */}
      {showForm && (
        <div className="w-full max-w-md">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            {/* Header */}
            <div className="space-y-2 text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center bg-muted">
                  <UserPlus className="w-6 h-6 text-foreground" />
                </div>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Create Account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your details to create your account
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium leading-none">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Message Alert */}
              {message && (
                <Alert variant={messageType === 'success' ? 'default' : 'destructive'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleCreateAccount}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <a
                href="/login"
                className="font-medium underline underline-offset-4 hover:text-primary"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAccountContent;