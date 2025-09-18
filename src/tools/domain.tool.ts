import { RailwayApiClient } from '@/api/api-client';
import { DomainService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const domainListToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project containing the service (obtain from RAILWAY_PROJECT_LIST)',
		),
	environmentId: z
		.string()
		.describe(
			'ID of the environment that the service is in (obtain from RAILWAY_SERVICE_LIST response). Usually production or staging environment.',
		),
	serviceId: z
		.string()
		.describe(
			'ID of the service to list domains for (obtain from RAILWAY_SERVICE_LIST)',
		),
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
	environmentId: z
		.string()
		.describe(
			'ID of the environment (obtain from RAILWAY_SERVICE_LIST response)',
		),
	serviceId: z
		.string()
		.describe(
			'ID of the service to create domain for (obtain from RAILWAY_SERVICE_LIST)',
		),
	domain: z
		.string()
		.optional()
		.describe(
			"Optional: Custom domain name (e.g., 'api.myapp.com'). RECOMMENDED TO OMIT - Railway auto-generates optimized domains. Only specify for custom domain requirements.",
		),
	suffix: z
		.string()
		.optional()
		.describe(
			'Optional: Domain suffix. RECOMMENDED TO OMIT - Railway auto-generates appropriate suffixes. Only needed for specific domain naming requirements.',
		),
	targetPort: z
		.number()
		.optional()
		.describe(
			'Optional: Port number to route traffic to (e.g., 3000, 8080). RECOMMENDED TO OMIT - Railway auto-detects the correct port from your service configuration.',
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
	domain: z
		.string()
		.describe(
			'Domain name to check availability for (e.g., "myapp.railway.app" or "api.mycompany.com"). Used before creating custom domains.',
		),
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
	id: z
		.string()
		.describe(
			'ID of the domain to update (obtain from RAILWAY_DOMAIN_LIST response)',
		),
	targetPort: z
		.number()
		.describe(
			'New port number to route traffic to (e.g., 3000, 8080, 5432). Must match a port your service is listening on.',
		),
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
	id: z
		.string()
		.describe(
			'ID of the domain to delete (obtain from RAILWAY_DOMAIN_LIST response). WARNING: This will make the domain inaccessible.',
		),
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
			description:
				'List all domains (both Railway-generated and custom) for a service. Shows domain URLs, SSL status, target ports, and domain IDs needed for management operations.',
			bestFor: [
				'Viewing all service endpoints and public URLs',
				'Managing domain configurations and SSL certificates',
				'Auditing domain settings and port configurations',
				'Getting domain IDs for update or delete operations',
			],
			notFor: [
				'Creating new domains (use RAILWAY_DOMAIN_CREATE)',
				'Checking domain availability (use RAILWAY_DOMAIN_CHECK)',
				'TCP proxy endpoints (use RAILWAY_TCP_PROXY_LIST)',
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
			description:
				'Create a new HTTP/HTTPS domain for a service. Railway automatically generates optimized domains with SSL certificates. Custom domains require DNS configuration.',
			bestFor: [
				'Setting up public web endpoints for applications',
				'Creating Railway-generated domains (recommended approach)',
				'Configuring custom domains with your own DNS',
				'Adding HTTPS endpoints with automatic SSL certificates',
			],
			notFor: [
				'Database connections (use RAILWAY_TCP_PROXY_CREATE)',
				'Internal service-to-service communication (use private networking)',
				'Non-HTTP protocols (use RAILWAY_TCP_PROXY_CREATE)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DOMAIN_LIST', 'RAILWAY_DOMAIN_UPDATE'],
				alternatives: ['RAILWAY_TCP_PROXY_CREATE'],
				related: ['RAILWAY_DOMAIN_CHECK', 'RAILWAY_SERVICE_INFO'],
			},
		}),
		schema: domainCreateToolSchema,
		handler: domainCreateToolHandler,
	},
	{
		name: 'RAILWAY_DOMAIN_CHECK',
		description: formatToolDescription({
			type: 'API',
			description:
				'Check if a domain name is available for use on Railway. Validates domain format and availability before attempting to create custom domains.',
			bestFor: [
				'Validating custom domain availability before creation',
				'Pre-deployment domain planning and validation',
				'Checking domain name conflicts and formatting',
				'Verifying domain ownership requirements',
			],
			notFor: [
				'Checking Railway-generated domains (always available)',
				'Domain DNS configuration validation',
				'SSL certificate status checks',
			],
			relations: {
				nextSteps: ['RAILWAY_DOMAIN_CREATE'],
				related: ['RAILWAY_DOMAIN_LIST', 'RAILWAY_DOMAIN_CREATE'],
			},
		}),
		schema: domainCheckToolSchema,
		handler: domainCheckToolHandler,
	},
	{
		name: 'RAILWAY_DOMAIN_UPDATE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Update a domain configuration, primarily the target port. Use when your service changes ports or you need to route traffic differently.',
			bestFor: [
				'Changing target ports when service configuration changes',
				'Redirecting traffic to different application ports',
				'Reconfiguring endpoints after service updates',
				'Fixing port misconfigurations causing 502/503 errors',
			],
			notFor: [
				'Changing domain names (delete and recreate instead)',
				'TCP proxy port configuration (use RAILWAY_TCP_PROXY_CREATE)',
				'SSL certificate management (handled automatically)',
			],
			relations: {
				prerequisites: ['RAILWAY_DOMAIN_LIST'],
				nextSteps: ['RAILWAY_DOMAIN_LIST', 'RAILWAY_SERVICE_INFO'],
				related: ['RAILWAY_SERVICE_UPDATE', 'RAILWAY_DEPLOYMENT_TRIGGER'],
			},
		}),
		schema: domainUpdateToolSchema,
		handler: domainUpdateToolHandler,
	},
	{
		name: 'RAILWAY_DOMAIN_DELETE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Delete a domain from a service. WARNING: This immediately makes the domain inaccessible and cannot be undone. Use carefully in production.',
			bestFor: [
				'Removing unused or obsolete domains',
				'Cleaning up test or staging domain configurations',
				'Domain management and security cleanup',
				'Removing accidentally created domains',
			],
			notFor: [
				'Temporary domain disabling (no Railway equivalent)',
				'Port updates (use RAILWAY_DOMAIN_UPDATE instead)',
				'Production domains without proper backup planning',
			],
			relations: {
				prerequisites: ['RAILWAY_DOMAIN_LIST'],
				alternatives: ['RAILWAY_DOMAIN_UPDATE'],
				related: ['RAILWAY_DOMAIN_CREATE'],
			},
		}),
		schema: domainDeleteToolSchema,
		handler: domainDeleteToolHandler,
	},
];

export default allTools;

