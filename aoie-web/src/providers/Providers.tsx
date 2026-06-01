"use client";

import AuthSessionProvider from "@/providers/SessionProvider";

import { SocketProvider } from "./SocketProvider";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthSessionProvider>
      <SocketProvider>
        {children}
      </SocketProvider>
    </AuthSessionProvider>
  );
}