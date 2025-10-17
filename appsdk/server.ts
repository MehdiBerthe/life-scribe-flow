import "dotenv/config";
import { createServer } from "node:http";
import { createApp, defineTool, WindowOpenAIResource } from "@openai/apps-sdk";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const environmentSchema = z.object({
  SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
  SUPABASE_SERVICE_KEY: z.string().min(1, "SUPABASE_SERVICE_KEY is required"),
  LIFEX_COMPONENT_URL: z.string().url().default("http://localhost:5174")
});

const parsedEnv = environmentSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  LIFEX_COMPONENT_URL: process.env.LIFEX_COMPONENT_URL ?? "http://localhost:5174"
});

const supabase: SupabaseClient = createClient(parsedEnv.SUPABASE_URL, parsedEnv.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const journalEntryInput = z.object({
  userId: z.string().min(1, "userId is required"),
  text: z.string().min(1, "text is required"),
  tags: z.array(z.string()).default([])
});

const createJournalEntry = defineTool({
  name: "create_journal_entry",
  description: "Create a journal entry for the provided user along with optional tags.",
  inputSchema: journalEntryInput,
  async handler({ input }) {
    const timestamp = new Date().toISOString();
    // NOTE: RLS policy should ensure auth.uid() = user_id for regular clients. The service role key bypasses RLS on the server.
    const { data, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: input.userId,
        text: input.text,
        tags: input.tags,
        ts: timestamp
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create journal entry: ${error.message}`);
    }

    return {
      id: data?.id,
      timestamp,
      tags: input.tags
    };
  }
});

const planDailyFocusInput = z.object({
  userId: z.string().min(1, "userId is required"),
  date: z.string().optional()
});

const planDailyFocus = defineTool({
  name: "plan_daily_focus",
  description:
    "Return a link to the dashboard component with the user's context plus supporting goal data.",
  inputSchema: planDailyFocusInput,
  async handler({ input }) {
    const focusDate = input.date ? new Date(input.date) : new Date();
    const isoDate = focusDate.toISOString();

    // NOTE: RLS policy should ensure auth.uid() = user_id for goals/signals.
    const [{ data: goals, error: goalsError }, { data: signals, error: signalsError }] = await Promise.all([
      supabase
        .from("goals")
        .select("id,title,area,status,created_at")
        .eq("user_id", input.userId)
        .in("status", ["active", "planned"]),
      supabase
        .from("signals")
        .select("id,kind,value,ts")
        .eq("user_id", input.userId)
        .gte("ts", new Date(focusDate.getTime() - 1000 * 60 * 60 * 24).toISOString())
        .lte("ts", isoDate)
        .limit(20)
    ]);

    if (goalsError) {
      throw new Error(`Failed to load goals: ${goalsError.message}`);
    }
    if (signalsError) {
      throw new Error(`Failed to load signals: ${signalsError.message}`);
    }

    const resource: WindowOpenAIResource = {
      type: "window.openai.resource",
      resource: {
        url: `${parsedEnv.LIFEX_COMPONENT_URL}/dashboard?user=${encodeURIComponent(input.userId)}`,
        title: "Daily Focus Dashboard"
      }
    };

    return {
      ...resource,
      metadata: {
        focusDate: isoDate,
        goals: goals ?? [],
        signals: signals ?? []
      }
    };
  }
});

const reflectOnWeekInput = z.object({
  userId: z.string().min(1, "userId is required"),
  weekEnding: z.string().optional()
});

const reflectOnWeek = defineTool({
  name: "reflect_on_week",
  description: "Summarise journal entries, goals, and signals for the trailing week.",
  inputSchema: reflectOnWeekInput,
  async handler({ input }) {
    const endDate = input.weekEnding ? new Date(input.weekEnding) : new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // NOTE: RLS policy should ensure auth.uid() = user_id for journal_entries and signals.
    const [{ data: entries, error: entriesError }, { data: weeklySignals, error: signalsError }] = await Promise.all([
      supabase
        .from("journal_entries")
        .select("id,ts,text,tags")
        .eq("user_id", input.userId)
        .gte("ts", startIso)
        .lte("ts", endIso)
        .order("ts", { ascending: true }),
      supabase
        .from("signals")
        .select("id,kind,value,ts")
        .eq("user_id", input.userId)
        .gte("ts", startIso)
        .lte("ts", endIso)
        .order("ts", { ascending: true })
    ]);

    if (entriesError) {
      throw new Error(`Failed to load journal entries: ${entriesError.message}`);
    }
    if (signalsError) {
      throw new Error(`Failed to load signals: ${signalsError.message}`);
    }

    const tagCounts = (entries ?? []).reduce<Record<string, number>>((acc, entry) => {
      for (const tag of entry.tags ?? []) {
        acc[tag] = (acc[tag] ?? 0) + 1;
      }
      return acc;
    }, {});

    return {
      week: {
        start: startIso,
        end: endIso
      },
      totals: {
        entries: entries?.length ?? 0,
        signals: weeklySignals?.length ?? 0
      },
      tagCounts,
      entries,
      signals: weeklySignals
    };
  }
});

const app = createApp({
  tools: {
    create_journal_entry: createJournalEntry,
    plan_daily_focus: planDailyFocus,
    reflect_on_week: reflectOnWeek
  }
});

export default app;

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number.parseInt(process.env.PORT ?? "3030", 10);
  const server = createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Request URL missing" }));
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", tools: Object.keys(app.tools) }));
      return;
    }

    if (req.method === "POST" && req.url.startsWith("/tools/")) {
      const toolName = decodeURIComponent(req.url.slice("/tools/".length).split("?")[0]);
      const tool = (app.tools as Record<string, typeof createJournalEntry>)[toolName];

      if (!tool) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Tool ${toolName} not found` }));
        return;
      }

      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }

      let payload: { input?: unknown; context?: unknown } = {};
      try {
        payload = body ? JSON.parse(body) : {};
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
        return;
      }

      try {
        const result = await tool.handler({
          input: (payload?.input ?? {}) as never,
          context: (payload?.context ?? {}) as never
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ result }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown tool execution error"
          })
        );
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console -- CLI feedback for local development
    console.log(`Apps SDK server listening on http://localhost:${port}`);
  });
}
