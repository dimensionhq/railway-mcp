import * as Sentry from '@sentry/node';
import 'dotenv/config';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
	Sentry.init({
		dsn,
		environment: process.env.NODE_ENV || 'production',
		// Disable tracing and profiling
		tracesSampleRate: 0,
		profilesSampleRate: 0,
		// Minimal integrations for error handling only
		integrations: [
			Sentry.httpIntegration(),
			Sentry.onUncaughtExceptionIntegration(),
			Sentry.onUnhandledRejectionIntegration(),
		],
	});
} else {
	console.warn('SENTRY_DSN not provided, error tracking disabled');
}
