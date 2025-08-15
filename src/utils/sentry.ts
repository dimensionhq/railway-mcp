import * as Sentry from '@sentry/node';
import type { Express, Request, Response, NextFunction } from 'express';

export const initializeSentry = () => {
	const dsn = process.env.SENTRY_DSN;

	if (!dsn) {
		console.warn('SENTRY_DSN not provided, error tracking disabled');
		return;
	}

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
};

export const setupSentryExpressErrorHandler = (app: Express) => {
	if (process.env.SENTRY_DSN) {
		Sentry.setupExpressErrorHandler(app);
	}
};

export const captureError = (error: Error, context?: Record<string, any>) => {
	Sentry.withScope((scope) => {
		if (context) {
			scope.setContext('additional', context);
		}
		Sentry.captureException(error);
	});
};
