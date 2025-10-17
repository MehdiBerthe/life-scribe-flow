import { z } from "zod";

declare global {
  namespace OpenAIApps {
    interface ToolExecutionContext {
      runId?: string;
      userId?: string;
    }
  }
}

export interface ToolExecutionContext extends OpenAIApps.ToolExecutionContext {}

export interface ToolDefinition<Schema extends z.ZodTypeAny = z.ZodTypeAny, Result = unknown> {
  name: string;
  description: string;
  inputSchema: Schema;
  handler: (args: { input: z.infer<Schema>; context: ToolExecutionContext }) => Promise<Result>;
}

export type AppConfig = {
  tools: Record<string, ToolDefinition>;
};

export type WindowOpenAIResource = {
  type: "window.openai.resource";
  resource: {
    url: string;
    title?: string;
    path?: string;
  };
};

export function createApp<T extends AppConfig>(config: T): T;

export function defineTool<Schema extends z.ZodTypeAny, Result>(definition: ToolDefinition<Schema, Result>): ToolDefinition<Schema, Result>;
