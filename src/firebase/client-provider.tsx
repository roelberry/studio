'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // This component's only job is to ensure its children are rendered on the client.
  // The actual Firebase initialization is now handled within FirebaseProvider.
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
