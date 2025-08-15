import * as Sentry from '@sentry/node';
import type { Express, Request, Response, NextFunction } from 'express';

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
