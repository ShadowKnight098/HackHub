import { neon, neonConfig } from '@neondatabase/serverless';
import { env } from './env';

neonConfig.fetchConnectionCache = true;

const connectionString = env.databaseUrl;

/**
 * Neon Serverless SQL Client.
 * Runs SQL queries over HTTPS directly from the browser or serverless edge.
 */
export const sql = connectionString ? neon(connectionString) : null;

export const isNeonConfigured = Boolean(connectionString && connectionString.startsWith('postgres'));
