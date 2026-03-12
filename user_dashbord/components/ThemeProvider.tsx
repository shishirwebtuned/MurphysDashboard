"use client";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // No DOM mutation here — html attributes are rendered from the server in layout.tsx
  return <>{children}</>;
}
