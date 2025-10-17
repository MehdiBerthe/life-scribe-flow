import { useMemo } from "react";
import { useUserParam } from "./useUserParam";

const Dashboard = () => {
  const user = useUserParam();
  const greeting = useMemo(() => {
    if (!user) {
      return "Focus dashboard";
    }
    return `Focus dashboard for ${user}`;
  }, [user]);

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-950 px-6 py-10 text-slate-50">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-light/70">Daily Focus</p>
        <h1 className="text-3xl font-semibold">{greeting}</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          This iframe renders independently inside ChatGPT. Data hydration happens through tool responses and actions
          delivered to the Apps runtime.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
          <h2 className="text-lg font-medium">Today's Priorities</h2>
          <p className="mt-2 text-sm text-slate-300">
            Show prioritized goals, linked actions, or scheduling hints supplied by the agent.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            <li className="rounded-lg border border-white/10 bg-white/5 p-3">Focus on deep work for 90 minutes.</li>
            <li className="rounded-lg border border-white/10 bg-white/5 p-3">Prepare weekly sync outline.</li>
            <li className="rounded-lg border border-white/10 bg-white/5 p-3">Take a 15 minute mindfulness break.</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-brand/20 bg-brand/10 p-5 shadow-xl backdrop-blur">
          <h2 className="text-lg font-medium">Signals to Watch</h2>
          <p className="mt-2 text-sm text-slate-100/80">
            Visualize latest biometric or productivity signals to guide your focus and energy levels.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-200/80">Energy</p>
              <p className="mt-2 text-2xl font-semibold text-white">78%</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-200/80">Mood</p>
              <p className="mt-2 text-2xl font-semibold text-white">Calm</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-200/80">Sleep</p>
              <p className="mt-2 text-2xl font-semibold text-white">7.3h</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-200/80">Focus Score</p>
              <p className="mt-2 text-2xl font-semibold text-white">92</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
        <h2 className="text-lg font-medium text-white">Integration notes</h2>
        <ul className="mt-3 list-inside list-disc space-y-2">
          <li>Read the <code>?user=</code> parameter to hydrate the experience for the requesting profile.</li>
          <li>Fetch data using Supabase or actions with authenticated requests.</li>
          <li>Emit updates back through tools like <code>create_journal_entry</code> or other custom actions.</li>
        </ul>
      </section>
    </main>
  );
};

export default Dashboard;
