import { config } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod/v4';

function findEnvFile(): string | undefined {
  // 1. Check process.cwd() first (project root when run from root scripts)
  const cwdEnv = path.join(process.cwd(), '.env');
  if (fs.existsSync(cwdEnv)) {
    return cwdEnv;
  }

  // 2. Walk up from the directory of this file to find .env
  let dir = path.dirname(new URL(import.meta.url).pathname);
  const root = path.parse(dir).root;

  while (dir !== root) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    dir = path.dirname(dir);
  }

  // 3. No .env found — production uses injected env vars
  return undefined;
}

const envFile = findEnvFile();
if (envFile) {
  config({ path: envFile });
}

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .refine((val) => val.startsWith('mysql://'), {
      message: 'DATABASE_URL must start with mysql://',
    }),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
