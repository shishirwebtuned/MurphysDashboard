"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, X, Send, CheckCircle, Sparkles, ShieldCheck } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  loading?: boolean;
}

export function EmailModal({ open, onClose, onSubmit, loading }: ModalProps) {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setError("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    onSubmit(email);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Decorative gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 opacity-50" />
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 z-10 w-5 h-5 rounded-full  cursor-pointer hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 "
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* Header with animated icon */}
                <div className="relative px-4 pt-10 pb-6 text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-10 h-10 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-xl relative"
                  >
                    <Mail className="w-5 h-5 text-white" />
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-2xl bg-purple-400 blur-xl"
                    />
                  </motion.div>
                  
                  <h3 className="text-3xl font-bold text-gray-900 mb-2 relative">
                    Magic Link Sign-in
                  </h3>
                  <p className="text-gray-600 text-sm relative">
                    Secure, passwordless authentication sent directly to your inbox
                  </p>
                </div>

                {/* Content */}
                <div className="px-8 pb-8 relative">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field with floating label */}
                    <div className="space-y-2">
                      <Label htmlFor="modal-email" className="text-gray-800 font-semibold text-sm flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-600" />
                        Email Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="modal-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@company.com"
                          className="h-12 pl-4 pr-4 border-2 rounded border-gray-200 focus-visible:border-purple-500 focus-visible:ring-purple-500/20 text-base transition-all"
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-xl border-2 border-red-200 flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Feature highlights */}
                  

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-13 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending Magic Link...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Send className="w-5 h-5" />
                          <span>Send Magic Link</span>
                        </div>
                      )}
                    </Button>

                    {/* Footer info */}
                    <p className="text-center text-xs text-gray-500 mt-4">
                      Check your spam folder if you don't see the email
                    </p>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
