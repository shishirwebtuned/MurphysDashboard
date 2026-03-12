import React from 'react'
import { Spinner } from '@/components/ui/spinner'

function SpinnerComponent() {
  return (
    <div className="spinner-container flex  z-50 justify-center items-center">
      <Spinner className="h-6 w-6" />
    </div>
  )
}

export default SpinnerComponent