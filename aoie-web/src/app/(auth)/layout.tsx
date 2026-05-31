export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
          <section className="hidden border-r border-slate-200 bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                AOIE 2.0
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight">
                A cleaner home for creative accounts.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
                Sign in, verify your email, and manage your creative profile
                from one focused workspace.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-300">
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                Email verification keeps new accounts trustworthy.
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                New members start as users and can be promoted later.
              </div>
            </div>
          </section>

          <section className="flex min-h-[620px] items-center justify-center p-6 sm:p-10">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
