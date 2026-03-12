"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axiosInstance from "@/lib/axios";


function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // oobCode may be present in query or path; capture it once for reuse
  const oobCode = searchParams.get('oobCode');
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(true);
  const [email, setEmail] = useState("" );
  const [userId, setUserId] = useState("");

  console.log( email, "and", userId )


  // Verify the reset code on mount
  useEffect(() => {
    const code = searchParams.get('token');
    
    if (!code) {
      setStatus({ type: 'error', message: 'Invalid or missing reset code. Please request a new password reset link.' });
      setVerifyingCode(false);
      return;
    }

  
    
    const verifyCode = async () => {
      try {
  
        // Verify the password reset code is valid and get the user's email
        const userEmail = await axiosInstance.post('/auth/verify-forgot-password-token', { token: code });
        setEmail(userEmail.data.data.email);
        setUserId(userEmail.data.data.userId);
        setVerifyingCode(false);
      } catch (err: any) {
        const serverMsg = err?.response?.data?.message ?? (typeof err?.response?.data === 'string' ? err.response.data : undefined) ?? err?.message ?? 'Invalid or expired reset code. Please request a new password reset link.';
        setStatus({ type: 'error', message: serverMsg });
        setVerifyingCode(false);
      }
    };

    verifyCode();
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }


    setLoading(true);
    setStatus({ type: null, message: '' });
    
    try {
      // Confirm the password reset with the code and new password

       const response = await axiosInstance.post('/auth/reset-password', {
        id: userId,
        email: email,
        newPassword: password,
      });

      if(!userId){
        throw new Error('User ID is missing. Cannot reset password.');
      }

      if(response.status !== 200){
        throw new Error('Failed to reset password. Please try again.');
      }
      // Success
      setStatus({ type: 'success', message: 'Password reset successful! Redirecting to login...' });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {  
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message ?? (typeof err?.response?.data === 'string' ? err.response.data : undefined) ?? err?.message ?? 'Failed to reset password. Please try again.';
      setStatus({ type: 'error', message: serverMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white dark:bg-slate-800  border border-slate-200/60 dark:border-slate-700 p-8 md:p-10"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto"
          >
            <KeyRound className="w-6 h-6 text-primary" />
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 dark:text-white">
              Reset Your Password
            </h1>
            {email && (
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
                For account: <span className="font-semibold">{email}</span>
              </p>
            )}
          </motion.div>

          {/* Verifying Code State */}
          {verifyingCode ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mb-4"
              />
              <p className="text-slate-600 dark:text-slate-400">Verifying reset code...</p>
            </motion.div>
          ) : status.type === 'error'  ? (
            // Show error if code verification failed
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{status.message}</p>
              </div>
              <Button
                onClick={() => router.push('/forgot-password')}
                className="w-full h-12 text-base font-semibold"
              >
                Request New Reset Link
              </Button>
            </motion.div>
          ) : (
            // Show form if code is valid
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <form onSubmit={handleResetPassword} className="space-y-6">
                {/* New Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-10 pr-10 h-12 text-base transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Password must be at least 6 characters long
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-10 pr-10 h-12 text-base transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold  transition-all duration-300"
                  disabled={loading || !password || !confirmPassword}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Resetting...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>

              {/* Status Messages */}
              <AnimatePresence mode="wait">
                {status.type && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 overflow-hidden"
                  >
                    <div
                      className={`flex items-start gap-3 p-4 rounded-lg ${
                        status.type === "success"
                          ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                      }`}
                    >
                      {status.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <p
                        className={`text-sm ${
                          status.type === "success" 
                            ? "text-green-800 dark:text-green-200" 
                            : "text-red-800 dark:text-red-200"
                        }`}
                      >
                        {status.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400"
        >
          Remember your password?{" "}
          <button
            onClick={() => router.push('/login')}
            className="text-primary font-semibold hover:underline transition-all"
          >
            Sign in
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading reset page...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
