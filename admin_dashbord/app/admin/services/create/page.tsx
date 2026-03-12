import React, { Suspense } from 'react';
import CreateServiceClient from './CreateServiceClient';

// Server component wrapper: renders the client-only UI component inside a Suspense
// boundary to handle the CSR bailout caused by useSearchParams.
export default function Page() {
  return (
    <Suspense fallback={<div />}> 
      <CreateServiceClient />
    </Suspense>
  );
}
