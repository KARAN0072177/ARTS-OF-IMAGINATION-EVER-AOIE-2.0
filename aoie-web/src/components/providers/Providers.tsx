"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

import { SocketProvider } from "@/providers/SocketProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SocketProvider>{children}</SocketProvider>
    </SessionProvider>
  );
}
