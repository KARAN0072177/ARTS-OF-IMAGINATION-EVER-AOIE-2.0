import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/models/User";

import CompleteProfileForm from "@/components/auth/CompleteProfileForm";

export default async function CompleteProfilePage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const user = await User.findById(
    session.user.id
  )
    .select("username usernameSetupRequired")
    .lean();

  if (!user) {
    redirect("/login");
  }

  if (
    user.username &&
    !user.usernameSetupRequired
  ) {
    redirect("/feed");
  }

  return <CompleteProfileForm />;
}
