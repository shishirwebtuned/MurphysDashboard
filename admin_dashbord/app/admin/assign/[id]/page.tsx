  'use client';
import React from 'react'
import Header from '@/app/page/common/header';
import { useParams } from 'next/navigation';


export default function Page() {
  const params = useParams();
  const { id } = params;
  
  return (
    <>
      <Header
        title="Assign Page"
        description="Assign services to clients"
        link="/admin/assign"
        linkText="Go to Assignments"
      />

   
   </>
  )
}
