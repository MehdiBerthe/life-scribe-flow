import { useMemo } from "react";
import { useUserParam } from "./useUserParam";

const mockTrends = [
  { label: "Focus Score", change: "+6", description: "Improved from last week thanks to consistent deep work blocks." },
  { label: "Mood Index", change: "+2", description: "Daily gratitude entries show a steady upward trend." },
  { label: "Energy", change: "-1", description: "Slight dip after late meetings — schedule earlier shut down routines." }
];

const Insights = () => {
  const user = useUserParam();
  const heading = useMemo(() => (user ? `Weekly insights for ${user}` : "Weekly insights"), [user]);

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-950 px-6 py-10 text-slate-50">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-light/70">Insights</p>
        <h1 className="text-3xl font-semibold">{heading}</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Tool <code>reflect_on_week</code> aggregates journal entries and signals for the selected user. Render the
          response in this component or trigger follow-up actions.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {mockTrends.map((trend) => (
          <article
            key={trend.label}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur"
          >
            <div className="text-xs uppercase tracking-wide text-slate-300">{trend.label}</div>
            <div className="text-3xl font-semibold text-white">{trend.change}</div>
            <p className="text-sm text-slate-300">{trend.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
        <h2 className="text-lg font-medium text-white">Workflow recommendations</h2>
        <ul className="mt-3 list-inside list-disc space-y-2">
          <li>Trigger follow-up prompts asking the user how they feel about each trend.</li>
          <li>Use <code>plan_daily_focus</code> to drop the user back into the dashboard with updated metadata.</li>
          <li>Create celebratory nudges via Twilio when positive streaks continue.</li>
        </ul>
      </section>
    </main>
  );
};

export default Insights;
