import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'staging', 'test']).optional(),

	PORT: z.number().int().min(1).max(65535).default(8081),

	SENTRY_DSN: z.string(),
});

function createEnv(env: NodeJS.ProcessEnv) {
	const safeParseResult = envSchema.safeParse(env);
	if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
	return safeParseResult.data;
}

export const env = createEnv(process.env);

