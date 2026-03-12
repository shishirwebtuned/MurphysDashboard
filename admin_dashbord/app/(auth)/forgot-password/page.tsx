"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "@/lib/axios";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      setStatus({ type: 'success', message: 'Password reset link sent! Please check your email.' });
      setSentToEmail(email);
      setShowDialog(true);
      setEmail('');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (typeof err?.response?.data === 'string' ? err.response.data : undefined) ?? err?.message ?? 'Something went wrong. Please try again.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-white border border-gray-200 p-10"
      >
        {/* Back Button */}
        <button
          onClick={() => router.push('/login')}
          className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to sign in</span>
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Forgot Password?</h1>
          <p className="text-base text-gray-500">
            Enter your email to receive a reset link
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <Input
              id="email"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-base shadow-none rounded"
            />
          </div>

          {/* Status Messages */}
          <AnimatePresence mode="wait">
            {status.type && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 border ${status.type === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
                  }`}
              >
                <p className={`text-sm ${status.type === "success" ? "text-green-800" : "text-red-800"
                  }`}>
                  {status.message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base"
            disabled={loading || !email}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending link...</span>
              </div>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>

        {/* Login Link */}
        <p className="mt-8 text-center text-base text-gray-600">
          Remember your password?{" "}
          <button
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </button>
        </p>

        {/* Mailbox check modal */}
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center justify-center mb-3">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <AlertDialogTitle>Check your inbox</AlertDialogTitle>
              <AlertDialogDescription>
                We've sent a password reset link to <strong>{sentToEmail}</strong>.
                Please check your mailbox and follow the instructions to reset your password.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <div className="flex items-center gap-2 ml-auto">
                <AlertDialogAction onClick={() => window.open(`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(sentToEmail)}`, '_blank')}>Open Gmail</AlertDialogAction>
                <Button variant="outline" onClick={() => window.open('https://outlook.live.com/mail/0/inbox/', '_blank')}>Open Outlook</Button>
                <AlertDialogCancel onClick={() => setShowDialog(false)}>Close</AlertDialogCancel>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}
