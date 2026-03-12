import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import VerifyEmailClient from './VerifyEmailClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>}>
      <VerifyEmailClient />
    </Suspense>
  )
}
