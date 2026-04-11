import dotenv from 'dotenv';
import path from 'path';

const nodeEnv = process.env.NODE_ENV || 'development';

// Higher-priority files are loaded first so shell-provided env stays authoritative
// while local overrides still beat the base .env file when shell env is absent.
const envFiles = [
  `.env.${nodeEnv}.local`,
  '.env.local',
  `.env.${nodeEnv}`,
  '.env',
];

for (const relativeFile of envFiles) {
  dotenv.config({ path: path.resolve(process.cwd(), relativeFile), quiet: true });
}
