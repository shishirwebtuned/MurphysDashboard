import React, { Suspense } from 'react'
import ProfileUpdateForm from '@/app/page/profileUpdateForm';

function page() {
  return (
    <>
      <Suspense fallback={<div>Loading profile...</div>}>
        <ProfileUpdateForm />
      </Suspense>
    </>
  )
}

export default page