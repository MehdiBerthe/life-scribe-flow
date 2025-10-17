import { FormEvent, useMemo, useState } from "react";
import { useUserParam } from "./useUserParam";

const Journal = () => {
  const user = useUserParam();
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const userLabel = useMemo(() => user ?? "anonymous", [user]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 px-6 py-10 text-slate-50">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-light/70">Journal</p>
          <h1 className="text-3xl font-semibold">Capture a note for {userLabel}</h1>
          <p className="text-sm text-slate-300">
            Submit entries via the <code>create_journal_entry</code> tool so they persist to Supabase with the correct
            row-level security context (<code>auth.uid() = user_id</code> for end users).
          </p>
        </header>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-200">What's on your mind?</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-[160px] rounded-xl border border-white/10 bg-slate-950/60 p-4 text-base text-slate-100 placeholder:text-slate-500 focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/40"
              placeholder="Write a quick reflection, insight, or gratitude."
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-200">Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/40"
              placeholder="restoration, gratitude, wins"
            />
            <span className="text-xs text-slate-400">Comma-separated tags will be split by the tool handler.</span>
          </label>

          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-light px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand"
          >
            Save entry
          </button>
        </form>

        {submitted && (
          <p className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            This is a static demo. In the full integration, call the <code>create_journal_entry</code> tool with the
            textarea contents and tags array.
          </p>
        )}
      </div>
    </main>
  );
};

export default Journal;
