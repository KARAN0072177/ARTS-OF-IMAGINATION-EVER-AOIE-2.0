"use client";

import {
  createContext,
  useContext,
  useEffect,
} from "react";

import { useSession } from "next-auth/react";

import { socket } from "@/lib/socket";

const SocketContext =
  createContext(socket);

export function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } =
    useSession();

  useEffect(() => {
    if (
      !session?.user?.id
    ) {
      socket.disconnect();
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      "join_notifications",
      session.user.id
    );

    console.log(
      "Joined notification room:",
      session.user.id
    );

    return undefined;
  }, [session]);

  return (
    <SocketContext.Provider
      value={socket}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(
    SocketContext
  );
}
