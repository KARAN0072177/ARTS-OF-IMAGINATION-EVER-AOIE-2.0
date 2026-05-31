export default function DashboardPage() {
  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          A focused starting point for account and creative profile tools.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Profile", "Keep your public account details accurate."],
          ["Uploads", "Manage future submissions from one place."],
          ["Settings", "Control account access and preferences."],
        ].map(([title, description]) => (
          <div
            key={title}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-slate-950">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
