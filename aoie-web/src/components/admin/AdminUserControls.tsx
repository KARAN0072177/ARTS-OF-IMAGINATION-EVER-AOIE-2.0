"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BadgeCheck,
  Loader2,
  Save,
  Shield,
} from "lucide-react";

const roles = [
  "user",
  "artist",
  "admin",
  "super-admin",
] as const;

type Role = (typeof roles)[number];

export default function AdminUserControls({
  userId,
  currentAdminId,
  currentAdminRole,
  initialRole,
  initialIsVerified,
}: {
  userId: string;
  currentAdminId: string;
  currentAdminRole: string;
  initialRole: Role;
  initialIsVerified: boolean;
}) {
  const router = useRouter();
  const isSelf = userId === currentAdminId;
  const [role, setRole] =
    useState<Role>(initialRole);
  const [isVerified, setIsVerified] =
    useState(initialIsVerified);
  const [isSaving, setIsSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] = useState("");

  const canManageAdminRoles =
    currentAdminRole === "super-admin";
  const roleChanged = role !== initialRole;
  const verifyChanged =
    isVerified !== initialIsVerified;
  const hasChanges = roleChanged || verifyChanged;
  const roleSelectDisabled = isSaving || isSelf;

  async function saveChanges() {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            isVerified,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not update user."
        );
      }

      setMessage("User account updated.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Account controls
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Update user role and verification status. Admin role changes are
            restricted to super-admin accounts.
          </p>
        </div>
      </div>

      <label className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
        Role
        <select
          value={role}
          disabled={roleSelectDisabled}
          onChange={(event) =>
            setRole(event.target.value as Role)
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          {roles.map((roleOption) => {
            const isAdminRole =
              roleOption === "admin" ||
              roleOption === "super-admin";

            return (
              <option
                key={roleOption}
                value={roleOption}
                disabled={
                  isAdminRole && !canManageAdminRoles
                }
              >
                {roleOption}
              </option>
            );
          })}
        </select>
      </label>

      {isSelf && (
        <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          Role editing is locked because this is your active admin account.
          You can still update verification status.
        </p>
      )}

      {!canManageAdminRoles && !isSelf && (
        <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
          Admin and super-admin roles are only available to super-admin
          accounts.
        </p>
      )}

      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={isVerified}
          disabled={isSaving}
          onChange={(event) =>
            setIsVerified(event.target.checked)
          }
          className="mt-1 h-4 w-4"
        />
        <span className="leading-6">
          Mark email as verified for this user.
        </span>
      </label>

      {message && (
        <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!hasChanges || isSaving}
        onClick={saveChanges}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : roleChanged ? (
          <Shield className="h-4 w-4" />
        ) : verifyChanged ? (
          <BadgeCheck className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save changes
      </button>
    </div>
  );
}
