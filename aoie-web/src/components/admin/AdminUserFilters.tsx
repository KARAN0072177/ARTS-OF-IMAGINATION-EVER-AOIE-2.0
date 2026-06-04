"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  useState,
  useTransition,
} from "react";
import {
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

const roleOptions = [
  {
    label: "All roles",
    value: "all",
  },
  {
    label: "Users",
    value: "user",
  },
  {
    label: "Artists",
    value: "artist",
  },
  {
    label: "Admins",
    value: "admin",
  },
  {
    label: "Super admins",
    value: "super-admin",
  },
];

const verifiedOptions = [
  {
    label: "All status",
    value: "all",
  },
  {
    label: "Verified",
    value: "yes",
  },
  {
    label: "Unverified",
    value: "no",
  },
];

const providerOptions = [
  {
    label: "All logins",
    value: "all",
  },
  {
    label: "Email",
    value: "email",
  },
  {
    label: "Google",
    value: "google",
  },
];

export default function AdminUserFilters({
  q,
  role,
  verified,
  provider,
}: {
  q: string;
  role: string;
  verified: string;
  provider: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(q);
  const [isPending, startTransition] =
    useTransition();

  const selectedRole =
    roleOptions.find(
      (option) => option.value === role
    ) || roleOptions[0];
  const selectedVerified =
    verifiedOptions.find(
      (option) => option.value === verified
    ) || verifiedOptions[0];
  const selectedProvider =
    providerOptions.find(
      (option) => option.value === provider
    ) || providerOptions[0];
  const activeFilters = [
    q
      ? {
          label: `Search: ${q}`,
          key: "q",
        }
      : null,
    role !== "all"
      ? {
          label: selectedRole.label,
          key: "role",
        }
      : null,
    verified !== "all"
      ? {
          label: selectedVerified.label,
          key: "verified",
        }
      : null,
    provider !== "all"
      ? {
          label: selectedProvider.label,
          key: "provider",
        }
      : null,
  ].filter(Boolean) as {
    label: string;
    key: string;
  }[];

  function updateFilter(
    key: string,
    value: string
  ) {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    if (key !== "q" && query.trim()) {
      params.set("q", query.trim());
    }

    const nextQuery = params.toString();
    startTransition(() => {
      router.push(
        nextQuery
          ? `${pathname}?${nextQuery}`
          : pathname
      );
    });
  }

  function submitSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    updateFilter("q", query.trim());
  }

  return (
    <div className="border-b border-slate-100 bg-white">
      <form
        onSubmit={submitSearch}
        className="grid gap-3 p-5 lg:grid-cols-[1fr_170px_170px_170px_auto_auto]"
      >
        <label className="relative">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400 lg:hidden">
            Search
          </span>
          <Search className="pointer-events-none absolute left-4 top-[calc(50%+0.5rem)] h-4 w-4 -translate-y-1/2 text-slate-400 lg:top-1/2" />
          <input
            value={query}
            disabled={isPending}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search username or email"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-wait disabled:opacity-70"
          />
        </label>

        <label>
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400 lg:hidden">
            Role
          </span>
          <select
            value={role}
            disabled={isPending}
            onChange={(event) =>
              updateFilter(
                "role",
                event.target.value
              )
            }
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition hover:border-cyan-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-wait disabled:opacity-70"
          >
            {roleOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400 lg:hidden">
            Status
          </span>
          <select
            value={verified}
            disabled={isPending}
            onChange={(event) =>
              updateFilter(
                "verified",
                event.target.value
              )
            }
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition hover:border-cyan-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-wait disabled:opacity-70"
          >
            {verifiedOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400 lg:hidden">
            Login
          </span>
          <select
            value={provider}
            disabled={isPending}
            onChange={(event) =>
              updateFilter(
                "provider",
                event.target.value
              )
            }
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition hover:border-cyan-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-wait disabled:opacity-70"
          >
            {providerOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          disabled={isPending}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </button>
        <Link
          href="/admin/users"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Link>
      </form>

      {(activeFilters.length > 0 || isPending) && (
        <div className="flex flex-wrap items-center gap-2 px-5 pb-5">
          {isPending && (
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-extrabold text-cyan-700 ring-1 ring-cyan-100">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating results
            </span>
          )}

          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              disabled={isPending}
              onClick={() => {
                if (filter.key === "q") {
                  setQuery("");
                }

                updateFilter(filter.key, "all");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-wait disabled:opacity-70"
            >
              {filter.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
