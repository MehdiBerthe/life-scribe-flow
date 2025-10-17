import { access, constants, copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const key = 'LIFEX_COMPONENT_URL';

async function ensureEnvFile(): Promise<string> {
  const cwd = process.cwd();
  const envPath = resolve(cwd, '.env');
  const examplePath = resolve(cwd, '.env.example');

  try {
    await access(envPath, constants.F_OK);
    return envPath;
  } catch {
    await copyFile(examplePath, envPath);
    console.log('No .env file detected; copied from .env.example.');
    return envPath;
  }
}

function validateHttpsUrl(value: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch (error) {
    throw new Error(`Invalid URL provided for ${key}: ${(error as Error).message}`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`${key} must use HTTPS (received protocol: ${parsed.protocol || 'unknown'}).`);
  }
}

function setEnvValue(content: string, value: string): string {
  const lines = content.split(/\r?\n/);
  let found = false;

  const updated = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`${key}=${value}`);
  }

  return updated.join('\n');
}

async function main() {
  const [, , url] = process.argv;

  if (!url) {
    console.error(`Usage: npm run set:component-url -- <https_url>`);
    process.exitCode = 1;
    return;
  }

  validateHttpsUrl(url);

  const envPath = await ensureEnvFile();
  const original = await readFile(envPath, 'utf8');
  const next = setEnvValue(original, url);

  if (original === next) {
    console.log(`${key} already set to ${url}`);
    return;
  }

  await writeFile(envPath, `${next}\n`, 'utf8');
  console.log(`Updated ${key} in ${envPath} to ${url}`);
  console.log('Restart npm run dev:app so the Apps SDK manifest picks up the new origin.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
