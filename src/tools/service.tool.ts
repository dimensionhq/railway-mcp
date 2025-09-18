import { RailwayApiClient } from '@/api/api-client';
import { ServiceService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { RegionCodeSchema } from '@/utils/types.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const serviceListToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project to list services from (obtain from RAILWAY_PROJECT_LIST)',
		),
});

const serviceListToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId } = serviceListToolSchema.parse(args);
		const serviceService = new ServiceService(railway);
		return serviceService.listServices(projectId);
	} catch (error) {
		logger.error({
			message: 'Error while listing services',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while listing services', {
			error,
		});
	}
};

const serviceInfoToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project containing the service (obtain from RAILWAY_PROJECT_LIST)',
		),
	serviceId: z
		.string()
		.describe(
			'ID of the service to get information about (obtain from RAILWAY_SERVICE_LIST)',
		),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to check (obtain from RAILWAY_SERVICE_LIST response). Usually production environment.',
		),
});

const serviceInfoToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, serviceId, environmentId } =
			serviceInfoToolSchema.parse(args);
		const serviceService = new ServiceService(railway);
		return serviceService.getServiceInfo(projectId, serviceId, environmentId);
	} catch (error) {
		logger.error({
			message: 'Error while getting service info',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while getting service info', {
			error,
		});
	}
};

const serviceCreateFromRepoToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project to create the service in (obtain from RAILWAY_PROJECT_LIST)',
		),
	repo: z
		.string()
		.describe(
			"GitHub repository URL or name. Examples: 'https://github.com/user/repo', 'user/repo', or 'user/repo#branch' for specific branch.",
		),
	name: z
		.string()
		.optional()
		.describe(
			'Optional: Custom name for the service. If omitted, Railway uses the repository name. Useful for clarity in multi-service projects.',
		),
});

const serviceCreateFromRepoToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, repo, name } =
			serviceCreateFromRepoToolSchema.parse(args);
		const serviceService = new ServiceService(railway);
		return serviceService.createServiceFromRepo(projectId, repo, name);
	} catch (error) {
		logger.error({
			message: 'Error while creating service from repo',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while creating service from repo', {
			error,
		});
	}
};

const serviceCreateFromImageToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project to create the service in (obtain from RAILWAY_PROJECT_LIST)',
		),
	image: z
		.string()
		.describe(
			"Docker image to use. Examples: 'postgres:13-alpine', 'redis:7-alpine', 'nginx:latest', 'node:18-alpine'. Include tag for version control.",
		),
	name: z
		.string()
		.optional()
		.describe(
			'Optional: Custom name for the service. If omitted, Railway uses the image name. Recommended for databases and multiple instances.',
		),
});

const serviceCreateFromImageToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, image, name } =
			serviceCreateFromImageToolSchema.parse(args);
		const serviceService = new ServiceService(railway);
		return serviceService.createServiceFromImage(projectId, image, name);
	} catch (error) {
		logger.error({
			message: 'Error while creating service from image',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while creating service from image', {
			error,
		});
	}
};

const serviceUpdateToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project containing the service (obtain from RAILWAY_PROJECT_LIST)',
		),
	serviceId: z
		.string()
		.describe('ID of the service to update (obtain from RAILWAY_SERVICE_LIST)'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to update (obtain from RAILWAY_SERVICE_INFO or RAILWAY_SERVICE_LIST). Usually production environment.',
		),
	region: RegionCodeSchema.optional().describe(
		'Optional: Region to deploy the service in (us-west1, us-east4, etc.). Changes require redeployment.',
	),
	rootDirectory: z
		.string()
		.optional()
		.describe(
			'Optional: Root directory containing the service code (e.g., "backend", "api", "."). Useful for monorepos.',
		),
	buildCommand: z
		.string()
		.optional()
		.describe(
			'Optional: Command to build the service (e.g., "npm run build", "yarn build", "make build"). Overrides auto-detection.',
		),
	startCommand: z
		.string()
		.optional()
		.describe(
			'Optional: Command to start the service (e.g., "npm start", "node index.js", "python app.py"). Overrides auto-detection.',
		),
	numReplicas: z
		.number()
		.optional()
		.describe(
			'Optional: Number of service replicas to run (1-20). Higher values for load balancing and availability.',
		),
	healthcheckPath: z
		.string()
		.optional()
		.describe(
			'Optional: HTTP path for health checks (e.g., "/health", "/api/status"). Used for deployment verification.',
		),
	sleepApplication: z
		.boolean()
		.optional()
		.describe(
			'Optional: Enable sleep mode to reduce costs. Service sleeps when inactive and wakes on requests (adds cold start delay).',
		),
});

const serviceUpdateToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, serviceId, environmentId, ...config } =
			serviceUpdateToolSchema.parse(args);
		const serviceService = new ServiceService(railway);
		return serviceService.updateService(
			projectId,
			serviceId,
			environmentId,
			config,
		);
	} catch (error) {
		logger.error({
			message: 'Error while updating service',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while updating service', {
			error,
		});
	}
};

const serviceDeleteToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project containing the service (obtain from RAILWAY_PROJECT_LIST)',
		),
	serviceId: z
		.string()
		.describe(
			'ID of the service to delete (obtain from RAILWAY_SERVICE_LIST). WARNING: Permanently deletes service and data.',
		),
});

const serviceDeleteToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, serviceId } = serviceDeleteToolSchema.parse(args);
		const serviceService = new ServiceService(railway);
		return serviceService.deleteService(projectId, serviceId);
	} catch (error) {
		logger.error({
			message: 'Error while deleting service',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while deleting service', {
			error,
		});
	}
};

const serviceRestartToolSchema = z.object({
	serviceId: z
		.string()
		.describe(
			'ID of the service to restart (obtain from RAILWAY_SERVICE_LIST)',
		),
	environmentId: z
		.string()
		.describe(
			'ID of the environment where the service should be restarted (obtain from RAILWAY_SERVICE_INFO). Usually production environment.',
		),
});

const serviceRestartToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { serviceId, environmentId } = serviceRestartToolSchema.parse(args);
		const serviceService = new ServiceService(railway);
		return serviceService.restartService(serviceId, environmentId);
	} catch (error) {
		logger.error({
			message: 'Error while restarting service',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while restarting service', {
			error,
		});
	}
};

const allTools = [
	{
		name: 'RAILWAY_SERVICE_LIST',
		description: formatToolDescription({
			type: 'API',
			description:
				'List all services in a specific Railway project. Returns service names, IDs, types, status, and environment information needed for other service operations.',
			bestFor: [
				'Getting an overview of all services in a project and their current status',
				'Finding service IDs needed for other service operations',
				'Checking which services are running, building, or crashed',
				'Understanding project architecture and service relationships',
			],
			notFor: [
				'Getting detailed service configuration (use RAILWAY_SERVICE_INFO)',
				'Listing projects (use RAILWAY_PROJECT_LIST)',
				'Managing individual services (use specific service tools)',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST'],
				nextSteps: ['RAILWAY_SERVICE_INFO', 'RAILWAY_DEPLOYMENT_LIST'],
				related: ['RAILWAY_PROJECT_INFO', 'RAILWAY_VARIABLE_LIST'],
			},
		}),
		schema: serviceListToolSchema,
		handler: serviceListToolHandler,
	},
	{
		name: 'RAILWAY_SERVICE_INFO',
		description: formatToolDescription({
			type: 'API',
			description:
				'Get comprehensive information about a specific service. Returns configuration, deployment status, resource usage, domains, variables, and health metrics.',
			bestFor: [
				'Viewing detailed service configuration and current status',
				'Checking deployment details and build information',
				'Monitoring service health and resource usage',
				'Getting environment and domain information for the service',
			],
			notFor: [
				'Listing all services (use RAILWAY_SERVICE_LIST)',
				'Getting deployment logs (use RAILWAY_DEPLOYMENT_LOGS)',
				'Managing service configuration (use RAILWAY_SERVICE_UPDATE)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_LIST', 'RAILWAY_VARIABLE_LIST'],
				related: ['RAILWAY_SERVICE_UPDATE', 'RAILWAY_DOMAIN_LIST'],
			},
		}),
		schema: serviceInfoToolSchema,
		handler: serviceInfoToolHandler,
	},
	{
		name: 'RAILWAY_SERVICE_CREATE_FROM_REPO',
		description: formatToolDescription({
			type: 'API',
			description:
				'Create a new service from a GitHub repository. Railway will automatically detect the framework, install dependencies, build, and deploy your application.',
			bestFor: [
				'Deploying web applications from source code',
				'Services that need automatic build processes (Node.js, Python, Go, etc.)',
				'GitHub-hosted projects with standard project structures',
				'Applications requiring custom build and start commands',
			],
			notFor: [
				'Pre-built Docker images (use RAILWAY_SERVICE_CREATE_FROM_IMAGE)',
				'Standard database deployments (use RAILWAY_TEMPLATE_DEPLOY)',
				'Static file hosting (consider static site hosts)',
				'Non-GitHub repositories (use Docker image approach)',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST'],
				nextSteps: ['RAILWAY_SERVICE_INFO', 'RAILWAY_VARIABLE_SET'],
				alternatives: [
					'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
					'RAILWAY_TEMPLATE_DEPLOY',
				],
				related: ['RAILWAY_DEPLOYMENT_TRIGGER', 'RAILWAY_DOMAIN_CREATE'],
			},
		}),
		schema: serviceCreateFromRepoToolSchema,
		handler: serviceCreateFromRepoToolHandler,
	},
	{
		name: 'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Create a new service from a Docker image. Ideal for deploying pre-built containers, custom databases, or specific software versions.',
			bestFor: [
				'Custom database deployments with specific configurations',
				'Pre-built container deployments from Docker Hub or registries',
				'Specific software versions or custom-built images',
				'Services that require precise environment control',
			],
			notFor: [
				'Standard database deployments (use RAILWAY_TEMPLATE_DEPLOY)',
				'GitHub repository deployments (use RAILWAY_SERVICE_CREATE_FROM_REPO)',
				'Applications needing build processes from source',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST'],
				nextSteps: [
					'RAILWAY_VARIABLE_SET',
					'RAILWAY_SERVICE_INFO',
					'RAILWAY_TCP_PROXY_CREATE',
				],
				alternatives: [
					'RAILWAY_TEMPLATE_DEPLOY',
					'RAILWAY_SERVICE_CREATE_FROM_REPO',
				],
				related: ['RAILWAY_VOLUME_CREATE', 'RAILWAY_DOMAIN_CREATE'],
			},
		}),
		schema: serviceCreateFromImageToolSchema,
		handler: serviceCreateFromImageToolHandler,
	},
	{
		name: 'RAILWAY_SERVICE_UPDATE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Update a service configuration including build commands, resource limits, health checks, and deployment settings. Changes may require redeployment.',
			bestFor: [
				'Changing build and start commands for custom deployments',
				'Updating resource limits and replica counts for scaling',
				'Modifying deployment configuration and health checks',
				'Configuring sleep mode and regional deployment settings',
			],
			notFor: [
				'Updating environment variables (use RAILWAY_VARIABLE_SET)',
				'Restarting services without config changes (use RAILWAY_SERVICE_RESTART)',
				'Triggering deployments only (use RAILWAY_DEPLOYMENT_TRIGGER)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST', 'RAILWAY_SERVICE_INFO'],
				nextSteps: ['RAILWAY_DEPLOYMENT_TRIGGER', 'RAILWAY_SERVICE_INFO'],
				related: ['RAILWAY_SERVICE_RESTART', 'RAILWAY_VARIABLE_SET'],
			},
		}),
		schema: serviceUpdateToolSchema,
		handler: serviceUpdateToolHandler,
	},
	{
		name: 'RAILWAY_SERVICE_DELETE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Permanently delete a service from a project. WARNING: This destroys all service data, deployments, domains, and configuration. Cannot be undone.',
			bestFor: [
				'Removing unused or obsolete services',
				'Cleaning up test or experimental services',
				'Project reorganization and cost management',
				'Removing services that are no longer needed',
			],
			notFor: [
				'Temporary service stoppage (no Railway equivalent)',
				'Updating service configuration (use RAILWAY_SERVICE_UPDATE)',
				'Production services without proper backup planning',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST', 'RAILWAY_SERVICE_INFO'],
				alternatives: ['RAILWAY_SERVICE_RESTART'],
				related: ['RAILWAY_PROJECT_DELETE'],
			},
		}),
		schema: serviceDeleteToolSchema,
		handler: serviceDeleteToolHandler,
	},
	{
		name: 'RAILWAY_SERVICE_RESTART',
		description: formatToolDescription({
			type: 'API',
			description:
				'Restart a service in a specific environment without deploying new code. Useful for applying environment variable changes or clearing service state.',
			bestFor: [
				'Applying environment variable changes without redeployment',
				'Clearing service state and memory leaks',
				'Resolving runtime issues and hung processes',
				'Quick service recovery without full deployment',
			],
			notFor: [
				'Deploying new code changes (use RAILWAY_DEPLOYMENT_TRIGGER)',
				'Updating service configuration (use RAILWAY_SERVICE_UPDATE first)',
				'Permanent service stoppage (use RAILWAY_SERVICE_DELETE)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				alternatives: ['RAILWAY_DEPLOYMENT_TRIGGER'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_VARIABLE_SET'],
			},
		}),
		schema: serviceRestartToolSchema,
		handler: serviceRestartToolHandler,
	},
];

export default allTools;

