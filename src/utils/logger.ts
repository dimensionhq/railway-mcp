import winston from 'winston';
import SentryTransport from 'winston-transport-sentry-node';

import { env } from '@/env';

let level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly' =
	'silly';

switch (env.NODE_ENV) {
	case 'production':
		level = 'info';
		break;
	case 'staging':
		level = 'debug';
		break;
	case 'development':
		level = 'silly';
		break;
	default:
		level = 'silly';
		break;
}

const winstonLogger = winston.createLogger({
	level,
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.errors({ stack: true }),
				winston.format.colorize(),
				winston.format.printf(({ level, message, stack }) => {
					if (stack) {
						return `${level}: ${message} \n${stack}`;
					}
					return `${level}: ${message}`;
				}),
			),
		}),
	],
});

if (env.SENTRY_DSN) {
	winstonLogger.add(
		new SentryTransport({
			sentry: {
				dsn: env.SENTRY_DSN,
				environment: env.NODE_ENV || 'production',
			},
			level: 'error',
			format: winston.format.combine(
				winston.format.errors({ stack: true }),
				winston.format.colorize(),
				winston.format.printf(({ level, message, stack }) => {
					if (stack) {
						return `${level}: ${message} \n${stack}`;
					}
					return `${level}: ${message}`;
				}),
			),
		}),
	);
}

export const logger = (() => {
	return {
		...winstonLogger,
		debug: winstonLogger.debug.bind(winstonLogger),
		info: winstonLogger.info.bind(winstonLogger),
		warn: winstonLogger.warn.bind(winstonLogger),
		//NOTE: Overriding the error method to enforce devs to pass the error correctly.
		//?@see https://github.com/ballerine-io/ballerine/pull/2955#issuecomment-2587143445
		error: ({ message, error }: { message?: string; error: unknown }) => {
			if (typeof message === 'string' && error !== undefined) {
				winstonLogger.error(message, error);
			} else {
				winstonLogger.error(error);
			}
		},
	};
})();

