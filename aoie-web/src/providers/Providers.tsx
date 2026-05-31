"use client";

import AuthSessionProvider from "@/providers/SessionProvider";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthSessionProvider>
      {children}
    </AuthSessionProvider>
  );
}