"use client"
import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Router, ShieldCheck } from 'lucide-react'
import axiosInstance from '@/lib/axios'

interface OtpVerifyModalProps {
  /** The email address to send the OTP to (usually the logged-in user's email) */
  email: string
  /** Called when the OTP is successfully verified */
  onVerified: () => void
  /** Optional: Called when the user cancels the modal */
  onCancel?: () => void
}

type Step = 'sending' | 'enter' | 'verifying' | 'error'

const OtpVerifyModal: React.FC<OtpVerifyModalProps> = ({ email, onVerified, onCancel }) => {
  const [step, setStep] = useState<Step>('sending')
  const [code, setCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Send OTP as soon as the modal mounts
  useEffect(() => {
    if (email) {
      sendOtp()
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  const startCooldown = () => {
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const sendOtp = async () => {
    setStep('sending')
    setErrorMsg('')
    try {
      await axiosInstance.post('/admin-otp/send', { email })
      setStep('enter')
      startCooldown()
    } catch {
      setStep('error')
      setErrorMsg('Failed to send OTP. Please try again.')
    }
  }

  const handleVerify = async () => {
    if (code.length !== 6) {
      setErrorMsg('Please enter the 6-digit code sent to your email.')
      return
    }
    setStep('verifying')
    setErrorMsg('')
    try {
      const res = await axiosInstance.post('/admin-otp/verify', { email, code })
      if (res.data?.valid) {
        onVerified()
      } else {
        setStep('enter')
        setErrorMsg('Invalid or expired code. Please try again.')
      }
    } catch {
      setStep('enter')
      setErrorMsg('Invalid or expired code. Please try again.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleVerify()
  }

  return (
    <Dialog open>
      {/* Prevent closing by clicking outside — user must verify, unless onCancel is provided */}
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={onCancel ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={onCancel ? undefined : (e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>Access Verification Required</DialogTitle>
          </div>
          <DialogDescription>
            {step === 'sending'
              ? 'Sending a one-time access code to your email…'
              : `A 6-digit code was sent to ${email}. Enter it below to continue.`}
          </DialogDescription>
        </DialogHeader>

        {/* Sending spinner */}
        {step === 'sending' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Sending code to your email…</p>
          </div>
        )}

        {/* Enter code */}
        {(step === 'enter' || step === 'verifying') && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{email}</span>
            </div>

            <div className="space-y-1">
              <Label htmlFor="otp-input">One-Time Password</Label>
              <Input
                id="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  setCode(val)
                  setErrorMsg('')
                }}
                onKeyDown={handleKeyDown}
                disabled={step === 'verifying'}
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
              {errorMsg && (
                <p className="text-xs text-destructive mt-1">{errorMsg}</p>
              )}
            </div>
          </div>
        )}

        {/* Error state */}
        {step === 'error' && (
          <div className="py-4 text-center space-y-2">
            <p className="text-sm text-destructive">{errorMsg}</p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Resend button */}
          {(step === 'enter' || step === 'verifying' || step === 'error') && (
            <Button
              variant="outline"
              onClick={sendOtp}
              disabled={resendCooldown > 0 || step === 'verifying'}
              className="w-full sm:w-auto"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </Button>
          )}

          {/* Verify button */}
          {(step === 'enter' || step === 'verifying') && (
            <Button
              onClick={handleVerify}
              disabled={step === 'verifying' || code.length !== 6}
              className="w-full sm:w-auto"
            >
              {step === 'verifying' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>
          )}

          {/* Retry button on hard error */}
          {step === 'error' && (
            <Button onClick={sendOtp} className="w-full sm:w-auto">
              Try Again
            </Button>
          )}

          {/* Cancel button, if onCancel is provided */}
        
            <Button variant="secondary" onClick={() => window.history.back()} className="w-full sm:w-auto">
              Cancel
            </Button>
                </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OtpVerifyModal
