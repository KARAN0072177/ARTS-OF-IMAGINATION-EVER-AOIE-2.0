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
  const [role, setRole] = useState<Role>(initialRole);
  const [isVerified, setIsVerified] = useState(initialIsVerified);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canManageAdminRoles = currentAdminRole === "super-admin";
  const roleChanged = role !== initialRole;
  const verifyChanged = isVerified !== initialIsVerified;
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

      setMessage("User account updated successfully.");
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
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl space-y-5 text-slate-100">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shadow-inner">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Account Governance
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Update account security role and email verification state. Admin role mutations are restricted to super-admins.
          </p>
        </div>
      </div>

      <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
        Account Role
        <select
          value={role}
          disabled={roleSelectDisabled}
          onChange={(event) =>
            setRole(event.target.value as Role)
          }
          className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-extrabold text-white outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-900 disabled:text-slate-500"
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
        <p className="rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3.5 text-xs font-bold text-amber-300">
          Role editing is locked because this is your active logged-in session. You can still toggle verification.
        </p>
      )}

      {!canManageAdminRoles && !isSelf && (
        <p className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 text-xs font-bold text-slate-400">
          Admin and super-admin privilege mutation requires super-admin authorization.
        </p>
      )}

      <label className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs font-bold text-slate-300 cursor-pointer hover:bg-slate-950">
        <input
          type="checkbox"
          checked={isVerified}
          disabled={isSaving}
          onChange={(event) =>
            setIsVerified(event.target.checked)
          }
          className="mt-0.5 h-4 w-4 rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
        />
        <span className="leading-relaxed">
          Mark email address as officially verified in DB.
        </span>
      </label>

      {message && (
        <p className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-xs font-bold text-emerald-300">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3.5 text-xs font-bold text-rose-300">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!hasChanges || isSaving}
        onClick={saveChanges}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3.5 text-xs font-black text-white shadow-lg shadow-cyan-600/25 transition hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
        Save Governance Changes
      </button>
    </div>
  );
}
