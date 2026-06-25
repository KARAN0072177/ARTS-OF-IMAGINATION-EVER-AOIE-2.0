import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.id;
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "super-admin";

  return (
    <NavbarClient 
      isLoggedIn={isLoggedIn} 
      isAdmin={isAdmin} 
    />
  );
}

