import { RailwayApiClient } from '@/api/api-client';
import { DomainService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const domainListToolSchema = z.object({
	projectId: z.string().describe('ID of the project containing the service'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment that the service is in to list domains from (usually obtained from service_list)',
		),
	serviceId: z.string().describe('ID of the service to list domains for'),
});

const domainListToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, environmentId, serviceId } =
			domainListToolSchema.parse(args);
		const domainService = new DomainService(railway);
		return domainService.listDomains(projectId, environmentId, serviceId);
	} catch (error) {
		logger.error({
			message: 'Error while listing domains',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while listing domains', {
			error,
		});
	}
};

const domainCreateToolSchema = z.object({
	environmentId: z.string().describe('ID of the environment'),
	serviceId: z.string().describe('ID of the service'),
	domain: z
		.string()
		.optional()
		.describe(
			"Custom domain name (optional, as railway will generate one for you and is generally better to leave it up to railway to generate one. There's usually no need to specify this and there are no use cases for overriding it.)",
		),
	suffix: z
		.string()
		.optional()
		.describe(
			'Suffix for the domain (optional, railway will generate one for you and is generally better to leave it up to railway to generate one.)',
		),
	targetPort: z
		.number()
		.optional()
		.describe(
			'Target port for the domain (optional, as railway will use the default port for the service and detect it automatically.)',
		),
});

const domainCreateToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { environmentId, serviceId, domain, suffix, targetPort } =
			domainCreateToolSchema.parse(args);
		const domainService = new DomainService(railway);
		return domainService.createServiceDomain({
			environmentId,
			serviceId,
			domain,
			suffix,
			targetPort,
		});
	} catch (error) {
		logger.error({
			message: 'Error while creating domain',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while creating domain', {
			error,
		});
	}
};

const domainCheckToolSchema = z.object({
	domain: z.string().describe('Domain name to check availability for'),
});

const domainCheckToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { domain } = domainCheckToolSchema.parse(args);
		const domainService = new DomainService(railway);
		return domainService.checkDomainAvailability(domain);
	} catch (error) {
		logger.error({
			message: 'Error while checking domain availability',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while checking domain availability', {
			error,
		});
	}
};

const domainUpdateToolSchema = z.object({
	id: z.string().describe('ID of the domain to update'),
	targetPort: z.number().describe('New port number to route traffic to'),
});

const domainUpdateToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { id, targetPort } = domainUpdateToolSchema.parse(args);
		const domainService = new DomainService(railway);
		return domainService.updateServiceDomain({ id, targetPort });
	} catch (error) {
		logger.error({
			message: 'Error while updating domain',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while updating domain', {
			error,
		});
	}
};

const domainDeleteToolSchema = z.object({
	id: z.string().describe('ID of the domain to delete'),
});

const domainDeleteToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { id } = domainDeleteToolSchema.parse(args);
		const domainService = new DomainService(railway);
		return domainService.deleteServiceDomain(id);
	} catch (error) {
		logger.error({
			message: 'Error while deleting domain',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while deleting domain', {
			error,
		});
	}
};

const allTools = [
	{
		name: 'RAILWAY_DOMAIN_LIST',
		description: formatToolDescription({
			type: 'API',
			description: 'List all domains (both service and custom) for a service',
			bestFor: [
				'Viewing service endpoints',
				'Managing domain configurations',
				'Auditing domain settings',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DOMAIN_CREATE', 'RAILWAY_DOMAIN_UPDATE'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_TCP_PROXY_LIST'],
			},
		}),
		schema: domainListToolSchema,
		handler: domainListToolHandler,
	},
	{
		name: 'RAILWAY_DOMAIN_CREATE',
		description: formatToolDescription({
			type: 'API',
			description: 'Create a new domain for a service',
			bestFor: [
				'Setting up custom domains',
				'Configuring service endpoints',
				'Adding HTTPS endpoints',
			],
			notFor: [
				'TCP proxy setup (use RAILWAY_TCP_PROXY_CREATE)',
				'Internal service communication',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST', 'RAILWAY_DOMAIN_CHECK'],
				nextSteps: ['RAILWAY_DOMAIN_UPDATE'],
				alternatives: ['RAILWAY_TCP_PROXY_CREATE'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_DOMAIN_LIST'],
			},
		}),
		schema: domainCreateToolSchema,
		handler: domainCreateToolHandler,
	},
	{
		name: 'RAILWAY_DOMAIN_CHECK',
		description: formatToolDescription({
			type: 'API',
			description: 'Check if a domain is available for use',
			bestFor: [
				'Validating domain availability',
				'Pre-deployment checks',
				'Domain planning',
			],
			relations: {
				nextSteps: ['RAILWAY_DOMAIN_CREATE'],
				related: ['RAILWAY_DOMAIN_LIST'],
			},
		}),
		schema: domainCheckToolSchema,
		handler: domainCheckToolHandler,
	},
	{
		name: 'RAILWAY_DOMAIN_UPDATE',
		description: formatToolDescription({
			type: 'API',
			description: "Update a domain's configuration",
			bestFor: [
				'Changing target ports',
				'Updating domain settings',
				'Reconfiguring endpoints',
			],
			notFor: [
				'Changing domain names (delete and recreate instead)',
				'TCP proxy configuration',
			],
			relations: {
				prerequisites: ['RAILWAY_DOMAIN_LIST'],
				nextSteps: ['RAILWAY_DOMAIN_LIST'],
				related: ['RAILWAY_SERVICE_UPDATE'],
			},
		}),
		schema: domainUpdateToolSchema,
		handler: domainUpdateToolHandler,
	},
	{
		name: 'RAILWAY_DOMAIN_DELETE',
		description: formatToolDescription({
			type: 'API',
			description: 'Delete a domain from a service',
			bestFor: [
				'Removing unused domains',
				'Cleaning up configurations',
				'Domain management',
			],
			notFor: [
				'Temporary domain disabling',
				'Port updates (use RAILWAY_DOMAIN_UPDATE)',
			],
			relations: {
				prerequisites: ['RAILWAY_DOMAIN_LIST'],
				alternatives: ['RAILWAY_DOMAIN_UPDATE'],
				related: ['RAILWAY_SERVICE_UPDATE'],
			},
		}),
		schema: domainDeleteToolSchema,
		handler: domainDeleteToolHandler,
	},
];

export default allTools;

