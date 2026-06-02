"use client";

import {
  ArrowRight,
  CheckCircle2,
  MailCheck,
} from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";

import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

interface RegisterResponse {
  success: boolean;
  message: string;
}

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [
    verificationEmail,
    setVerificationEmail,
  ] = useState("");
  const [
    verificationComplete,
    setVerificationComplete,
  ] = useState(false);

  useEffect(() => {
    if (!verificationEmail) {
      return;
    }

    const handleVerified = (
      event: StorageEvent
    ) => {
      if (
        event.key !== "aoie-email-verified" ||
        !event.newValue
      ) {
        return;
      }

      try {
        const payload = JSON.parse(
          event.newValue
        ) as {
          email?: string;
        };

        if (
          payload.email?.toLowerCase() ===
          verificationEmail.toLowerCase()
        ) {
          setVerificationComplete(true);
        }
      } catch {
        return;
      }
    };

    const existingValue =
      localStorage.getItem(
        "aoie-email-verified"
      );

    if (existingValue) {
      handleVerified(
        new StorageEvent("storage", {
          key: "aoie-email-verified",
          newValue: existingValue,
        })
      );
    }

    window.addEventListener(
      "storage",
      handleVerified
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleVerified
      );
    };
  }, [verificationEmail]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        }
      );

      const data: RegisterResponse =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Something went wrong"
        );

        return;
      }

      setSuccess(data.message);
      setVerificationEmail(email.toLowerCase());

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (verificationEmail) {
    if (verificationComplete) {
      return (
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={32} />
          </div>

          <h2 className="mt-6 text-3xl font-semibold text-slate-950">
            Verification completed
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your email{" "}
            <span className="font-semibold text-slate-950">
              {verificationEmail}
            </span>{" "}
            has been verified successfully.
            You can now sign in to AOIE.
          </p>

          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left">
            <div className="flex gap-3">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-emerald-700"
              />
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Account ready
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  This registration step is
                  complete. Sign in and start
                  exploring the gallery.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Go to sign in
            <ArrowRight size={16} />
          </Link>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <MailCheck size={30} />
        </div>

        <h2 className="mt-6 text-3xl font-semibold text-slate-950">
          Verification email sent
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          We sent a verification link to{" "}
          <span className="font-semibold text-slate-950">
            {verificationEmail}
          </span>
          . Open that email and click the
          verification button to activate
          your AOIE account.
        </p>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
          <div className="flex gap-3">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-cyan-700"
            />
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Next step
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Keep this tab open, verify
                your email in the new tab,
                then come back and sign in.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Go to sign in
          <ArrowRight size={16} />
        </Link>

        <button
          type="button"
          onClick={() => {
            setVerificationEmail("");
            setVerificationComplete(false);
            setSuccess("");
          }}
          className="mt-4 text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Get started
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">
          Create your account
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Register as a standard user. Artist access can be enabled later.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="username"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Username
          </label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            placeholder="karanvani"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            placeholder="Create a password"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Confirm Password
          </label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            placeholder="Repeat your password"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Creating account..."
            : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          or
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleAuthButton label="Sign up with Google" />

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-semibold text-cyan-700 hover:text-cyan-800"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
