import {
  AlertCircle,
  CheckCircle2,
  MailCheck,
} from "lucide-react";
import Link from "next/link";

import VerificationCompleteSignal from "@/components/auth/VerificationCompleteSignal";

interface VerifyEmailPageProps {
  searchParams: Promise<{
    status?: string;
    email?: string;
  }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { status = "", email = "" } =
    await searchParams;

  const isSuccess = status === "success";
  const isExpired = status === "expired";

  return (
    <div className="w-full max-w-md text-center">
      {isSuccess && (
        <VerificationCompleteSignal
          email={email}
        />
      )}

      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          isSuccess
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 size={32} />
        ) : isExpired ? (
          <AlertCircle size={32} />
        ) : (
          <MailCheck size={32} />
        )}
      </div>

      <h2 className="mt-6 text-3xl font-semibold text-slate-950">
        {isSuccess
          ? "Verification completed"
          : isExpired
          ? "Verification link expired"
          : "Verification link invalid"}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {isSuccess ? (
          <>
            Your email
            {email ? (
              <>
                {" "}
                <span className="font-semibold text-slate-950">
                  {email}
                </span>
              </>
            ) : null}{" "}
            has been verified successfully.
            You can close this tab and sign
            in from the original window.
          </>
        ) : isExpired ? (
          <>
            This verification link is no
            longer active. Please create a
            new account request or contact
            support if you need help.
          </>
        ) : (
          <>
            This verification link could not
            be matched to an account. Please
            check the latest email from AOIE
            and try again.
          </>
        )}
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
        <p className="text-sm font-semibold text-slate-950">
          {isSuccess
            ? "What to do next"
            : "Need a fresh start?"}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {isSuccess
            ? "Return to AOIE and sign in with your verified account. This tab is safe to close."
            : "Go back to registration and submit your account details again to receive a new verification email."}
        </p>
      </div>

      <Link
        href={isSuccess ? "/login" : "/register"}
        className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {isSuccess
          ? "Go to sign in"
          : "Back to register"}
      </Link>
    </div>
  );
}
