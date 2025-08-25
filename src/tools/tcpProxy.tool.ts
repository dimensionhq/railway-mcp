import { RailwayApiClient } from '@/api/api-client';
import { TcpProxyService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const tcpProxyListToolSchema = z.object({
	environmentId: z
		.string()
		.describe('ID of the environment containing the service'),
	serviceId: z.string().describe('ID of the service to list TCP proxies for'),
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
		.describe('ID of the environment (usually obtained from service_info)'),
	serviceId: z.string().describe('ID of the service'),
	applicationPort: z
		.number()
		.describe(
			"Port of application/service to proxy, usually based off of the service's Dockerfile or designated running port.",
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
	proxyId: z.string().describe('ID of the TCP proxy to delete'),
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
				'List all TCP proxies for a service in a specific environment',
			bestFor: [
				'Viewing TCP proxy configurations',
				'Managing external access',
				'Auditing service endpoints',
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
			description: 'Create a new TCP proxy for a service',
			bestFor: [
				'Setting up database access',
				'Configuring external connections',
				'Exposing TCP services',
			],
			notFor: [
				'HTTP/HTTPS endpoints (use RAILWAY_DOMAIN_CREATE)',
				'Internal service communication',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_TCP_PROXY_LIST'],
				alternatives: ['RAILWAY_DOMAIN_CREATE'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_SERVICE_UPDATE'],
			},
		}),
		schema: tcpProxyCreateToolSchema,
		handler: tcpProxyCreateToolHandler,
	},
	{
		name: 'RAILWAY_TCP_PROXY_DELETE',
		description: formatToolDescription({
			type: 'API',
			description: 'Delete a TCP proxy',
			bestFor: [
				'Removing unused proxies',
				'Security management',
				'Endpoint cleanup',
			],
			notFor: ['Temporary proxy disabling', 'Port updates'],
			relations: {
				prerequisites: ['RAILWAY_TCP_PROXY_LIST'],
				related: ['RAILWAY_SERVICE_UPDATE'],
			},
		}),
		schema: tcpProxyDeleteToolSchema,
		handler: tcpProxyDeleteToolHandler,
	},
];

export default allTools;

