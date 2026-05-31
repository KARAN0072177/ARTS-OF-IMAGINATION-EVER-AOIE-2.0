import Link from "next/link";

export default function HomePage() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Arts of Imagination Ever
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
          Your AOIE account is ready for the next step.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Verify your email, sign in, and continue into a simple workspace built
          for profile and creative account management.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Create account
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          Account status
        </h2>
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3 rounded-md bg-emerald-50 p-4">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Email verification supported
              </p>
              <p className="mt-1 text-sm text-slate-600">
                New accounts receive a verification email before login.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md bg-cyan-50 p-4">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Default role is user
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Artist permissions can be assigned intentionally later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
