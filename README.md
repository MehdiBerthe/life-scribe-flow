# Life Scribe Flow – ChatGPT Apps SDK Integration

This project combines the existing Life Scribe Flow workspace with a ChatGPT Apps SDK server and a standalone component bundle that can be loaded inside ChatGPT Developer Mode. Follow the instructions below to configure your environment, run the local services, and connect them to ChatGPT for end-to-end testing.

## 1. Prerequisites
- Node.js 18+ and npm installed locally.
- A Supabase project with the following tables and RLS policies:
  - `profiles(id, email, created_at)`
  - `journal_entries(id, user_id, ts, text, tags)`
  - `goals(id, user_id, title, area, status, created_at)`
  - `signals(id, user_id, kind, value, ts)`
  - RLS policies should enforce `auth.uid() = user_id` for user-scoped operations; the Apps SDK server uses the service-role key and bypasses RLS.
- (Optional) A tunnelling utility such as [ngrok](https://ngrok.com/) so ChatGPT Developer Mode can reach your local services.

## 2. Environment configuration
1. Install dependencies (installs both the React bundle and the Apps SDK server packages):
   ```bash
   npm install
   ```
2. Copy the sample environment file and fill in the blanks with your Supabase credentials and public component URL. The project git-ignores `.env`, so these secrets stay on your machine while the committed `.env.example` documents which keys are required:
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` (service-role key, **keep this private**)
   - `LIFEX_COMPONENT_URL` (origin that ChatGPT will load for iframe components; defaults to `http://localhost:5174`)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (public anon key for the browser bundle)

## 3. Run the local stack
Open two terminals and start each process from the project root:

| Purpose | Command | Notes |
| --- | --- | --- |
| Apps SDK server (tools + Supabase) | `npm run dev:app` | Uses `SUPABASE_SERVICE_KEY`; only run locally. |
| Component iframe bundle | `npm run dev:components` | Serves `/dashboard`, `/journal`, and `/insights` on port 5174. |

Each iframe route reads the `?user=` query parameter supplied by ChatGPT to scope Supabase queries. The `plan_daily_focus` tool responds with a `window.openai.resource` that points to `/dashboard` with the encoded user ID.

## 4. Expose services to ChatGPT Developer Mode
1. Start your tunnel (example with ngrok):
   ```bash
   ngrok http 5174
   ```
2. Update `LIFEX_COMPONENT_URL` in `.env` to the HTTPS URL from ngrok. You can do this manually or run the helper script:
   ```bash
   npm run set:component-url -- https://<your-ngrok-subdomain>.ngrok.app
   ```
   After updating, restart `npm run dev:app` so the manifest and tools reference the public origin.
3. If ChatGPT needs direct access to the Apps SDK server, create a second tunnel for the port used by `npm run dev:app` and record the public URL.

## 5. Register in ChatGPT Developer Mode
1. Create (or open) your app in Developer Mode.
2. Upload `appsdk/components.manifest.ts` so ChatGPT knows about the `/dashboard`, `/journal`, and `/insights` iframes.
3. Point the MCP endpoint at the tunnelled URL from `npm run dev:app`.
4. Add the action manifests located in `/actions`:
   - `actions/supabase.yaml`
   - `actions/calendar.yaml`
   - `actions/twilio.yaml`
5. Save the configuration and launch a Developer Mode conversation. Invoke the tools or components; ChatGPT will append the active user ID to iframe URLs automatically.

## 6. Testing & quality checks
Run these commands before opening a pull request:

```bash
npx tsc --noEmit
npx tsc --noEmit -p components-app/tsconfig.json
npx vitest run
```

The Vitest suite covers intent routing and context assembly logic for the assistant workflow. All commands should pass without errors.

## 7. Troubleshooting
- Ensure Supabase tables exist and contain seed data when exercising the tools.
- If the iframe fails to load in ChatGPT, verify that `LIFEX_COMPONENT_URL` is HTTPS and reachable.
- For CORS issues, confirm that your tunnel forwards the correct port and that the Apps SDK server is running.

## 8. Next steps checklist
After you have confirmed the tunnel and Developer Mode registration, work through this quick checklist to validate the end-to-end experience:

1. **Ping the Apps SDK server** – Open `http://localhost:8787/health` (or your tunnel URL) to confirm the server is online before connecting it to ChatGPT.
2. **Exercise each iframe route locally** – Visit `http://localhost:5174/dashboard?user=<test-user>`, `/journal`, and `/insights` to ensure the components handle the `?user=` parameter and render without console errors.
3. **Dry run the tools** – Use a REST client (or curl) against the tunnelled Apps SDK endpoints for `create_journal_entry`, `plan_daily_focus`, and `reflect_on_week` with sample payloads to verify Supabase access succeeds.
4. **Re-run project checks** – Execute `npm run build:mcp` followed by the TypeScript and Vitest commands from section 6 whenever you change server or component logic.
5. **Capture QA notes** – Document any Supabase seed data, test user IDs, or tunnel URLs you rely on so future runs of Developer Mode can reproduce your environment quickly.

Happy building!
