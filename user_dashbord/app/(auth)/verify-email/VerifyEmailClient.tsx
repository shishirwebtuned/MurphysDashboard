'use client'

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import axiosInstance from "@/lib/axios";

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await axiosInstance.post('/auth/verify-email', { token });
        
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message || 'Email verified successfully!');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        
        const errorMsg = error.response?.data?.message || 'Verification failed';
        setMessage(errorMsg);
        
        if (errorMsg.includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
      }
    };

    verifyEmail();
  }, [token, router]);

  const handleResendEmail = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3">
          {[...Array(5)].map((_, i) => (
            <div
              key={`tr-${i}`}
              className="absolute border-l border-t border-blue-500"
              style={{
                width: `${100 + i * 30}px`,
                height: `${100 + i * 30}px`,
                right: `${i * 20}px`,
                top: `${i * 20}px`,
                transform: 'rotate(45deg)',
              }}
            />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4">
          {[...Array(3)].map((_, i) => (
            <div
              key={`bl-${i}`}
              className="absolute border-l border-b border-blue-500"
              style={{
                width: `${80 + i * 25}px`,
                height: `${80 + i * 25}px`,
                left: `${i * 18}px`,
                bottom: `${i * 18}px`,
                transform: 'rotate(45deg)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Brand Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-1/2 -translate-x-1/2"
      >
        <Image
          src="/logo.png"
          alt="Brand Logo"
          width={150}
          height={50}
        />
      </motion.div>

      {/* Verification Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative w-full max-w-md bg-white rounded-lg shadow-2xl p-8 mt-16"
      >
        <div className="text-center">
          {/* Loading State */}
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                Verifying Your Email
              </h2>
              <p className="text-sm text-neutral-600">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                Email Verified!
              </h2>
              <p className="text-sm text-neutral-600 mb-6">
                {message}
              </p>
              <p className="text-xs text-neutral-500">
                Redirecting to login page in 3 seconds...
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="mt-4 w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all"
              >
                Go to Login
              </Button>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                Verification Failed
              </h2>
              <p className="text-sm text-neutral-600 mb-6">
                {message}
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all"
              >
                Back to Login
              </Button>
            </>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <>
              <div className="flex justify-center mb-6">
                <Mail className="w-16 h-16 text-orange-500" />
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                Link Expired
              </h2>
              <p className="text-sm text-neutral-600 mb-6">
                {message}
              </p>
              <p className="text-xs text-neutral-500 mb-4">
                Please log in and request a new verification email.
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all"
              >
                Go to Login
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
