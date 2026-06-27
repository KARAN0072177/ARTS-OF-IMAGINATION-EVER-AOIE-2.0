import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ArtistApplication from "@/models/ArtistApplication";
import ArtworkReport from "@/models/ArtworkReport";
import AdminClientLayout from "@/components/admin/AdminClientLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  const isAdmin =
    session.user.role === "admin" ||
    session.user.role === "super-admin";

  if (!isAdmin) {
    redirect("/feed");
  }

  await connectDB();
  const [pendingCount, pendingReportsCount] = await Promise.all([
    ArtistApplication.countDocuments({
      status: "pending",
    }),
    ArtworkReport.countDocuments({
      status: "pending",
    }),
  ]);

  return (
    <AdminClientLayout
      userRole={session.user.role}
      pendingCount={pendingCount}
      pendingReportsCount={pendingReportsCount}
    >
      {children}
    </AdminClientLayout>
  );
}
