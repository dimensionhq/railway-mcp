import { RailwayApiClient } from '@/api/api-client';
import { TcpProxyService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const tcpProxyListToolSchema = z.object({
	environmentId: z
		.string()
		.describe(
			'ID of the environment containing the service (obtain from RAILWAY_SERVICE_LIST)',
		),
	serviceId: z
		.string()
		.describe(
			'ID of the service to list TCP proxies for (obtain from RAILWAY_SERVICE_LIST)',
		),
});

const tcpProxyListToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { environmentId, serviceId } = tcpProxyListToolSchema.parse(args);
		const tcpProxyService = new TcpProxyService(railway);
		return tcpProxyService.listTcpProxies(environmentId, serviceId);
	} catch (error) {
		logger.error({
			message: 'Error while listing TCP proxies',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while listing TCP proxies', {
			error,
		});
	}
};

const tcpProxyCreateToolSchema = z.object({
	environmentId: z
		.string()
		.describe(
			'ID of the environment (obtain from RAILWAY_SERVICE_LIST or RAILWAY_SERVICE_INFO)',
		),
	serviceId: z
		.string()
		.describe(
			'ID of the service to create TCP proxy for (obtain from RAILWAY_SERVICE_LIST)',
		),
	applicationPort: z
		.number()
		.describe(
			"Port number that your application/service listens on (e.g., 5432 for PostgreSQL, 3306 for MySQL, 6379 for Redis, 27017 for MongoDB). Check your service's Dockerfile EXPOSE statement or application configuration.",
		),
});

const tcpProxyCreateToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { environmentId, serviceId, applicationPort } =
			tcpProxyCreateToolSchema.parse(args);
		const tcpProxyService = new TcpProxyService(railway);
		return tcpProxyService.createTcpProxy({
			environmentId,
			serviceId,
			applicationPort,
		});
	} catch (error) {
		logger.error({
			message: 'Error while creating TCP proxy',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while creating TCP proxy', {
			error,
		});
	}
};

const tcpProxyDeleteToolSchema = z.object({
	proxyId: z
		.string()
		.describe(
			'ID of the TCP proxy to delete (obtain from RAILWAY_TCP_PROXY_LIST response). WARNING: This will break external connections.',
		),
});

const tcpProxyDeleteToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { proxyId } = tcpProxyDeleteToolSchema.parse(args);
		const tcpProxyService = new TcpProxyService(railway);
		return tcpProxyService.deleteTcpProxy(proxyId);
	} catch (error) {
		logger.error({
			message: 'Error while deleting TCP proxy',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while deleting TCP proxy', {
			error,
		});
	}
};

const allTools = [
	{
		name: 'RAILWAY_TCP_PROXY_LIST',
		description: formatToolDescription({
			type: 'API',
			description:
				'List all TCP proxies for a service in a specific environment. TCP proxies provide external access to non-HTTP services like databases.',
			bestFor: [
				'Viewing TCP proxy configurations and connection details',
				'Managing external database and service access',
				'Getting connection strings for database clients',
				'Auditing service endpoints and security configurations',
			],
			notFor: [
				'HTTP/HTTPS endpoints (use RAILWAY_DOMAIN_LIST)',
				'Creating new TCP proxies (use RAILWAY_TCP_PROXY_CREATE)',
				'Internal service communication (use private networking)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_TCP_PROXY_CREATE'],
				related: ['RAILWAY_DOMAIN_LIST', 'RAILWAY_SERVICE_INFO'],
			},
		}),
		schema: tcpProxyListToolSchema,
		handler: tcpProxyListToolHandler,
	},
	{
		name: 'RAILWAY_TCP_PROXY_CREATE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Create a new TCP proxy for a service to enable external connections. Essential for database access and non-HTTP services.',
			bestFor: [
				'Setting up external database access (PostgreSQL, MySQL, MongoDB, Redis)',
				'Configuring connections for database management tools',
				'Exposing TCP-based services to external applications',
				'Enabling direct database connections from local development',
			],
			notFor: [
				'HTTP/HTTPS web endpoints (use RAILWAY_DOMAIN_CREATE)',
				'Internal service-to-service communication (use private networking)',
				'REST API endpoints (use domains instead)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_TCP_PROXY_LIST', 'RAILWAY_VARIABLE_LIST'],
				alternatives: ['RAILWAY_DOMAIN_CREATE'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_VARIABLE_SET'],
			},
		}),
		schema: tcpProxyCreateToolSchema,
		handler: tcpProxyCreateToolHandler,
	},
	{
		name: 'RAILWAY_TCP_PROXY_DELETE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Delete a TCP proxy and remove external access. WARNING: This immediately breaks all external connections using this proxy.',
			bestFor: [
				'Removing unused or obsolete TCP proxies',
				'Security management and access control',
				'Cleaning up database connection endpoints',
				'Cost optimization by removing unnecessary proxies',
			],
			notFor: [
				'Temporary proxy disabling (no Railway equivalent)',
				'Port updates (delete and recreate proxy)',
				'Production database proxies without connection migration',
			],
			relations: {
				prerequisites: ['RAILWAY_TCP_PROXY_LIST'],
				related: ['RAILWAY_TCP_PROXY_CREATE'],
			},
		}),
		schema: tcpProxyDeleteToolSchema,
		handler: tcpProxyDeleteToolHandler,
	},
];

export default allTools;

