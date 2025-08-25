import { RailwayApiClient } from '@/api/api-client';
import { ServiceService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { RegionCodeSchema } from '@/utils/types.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const serviceListToolSchema = z.object({
	projectId: z.string().describe('ID of the project to list services from'),
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
	projectId: z.string().describe('ID of the project containing the service'),
	serviceId: z.string().describe('ID of the service to get information about'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to check (usually obtained from service_list)',
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
	projectId: z.string().describe('ID of the project to create the service in'),
	repo: z
		.string()
		.describe("GitHub repository URL or name (e.g., 'owner/repo')"),
	name: z.string().optional().describe('Optional custom name for the service'),
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
	projectId: z.string().describe('ID of the project to create the service in'),
	image: z
		.string()
		.describe("Docker image to use (e.g., 'postgres:13-alpine')"),
	name: z.string().optional().describe('Optional custom name for the service'),
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
	projectId: z.string().describe('ID of the project containing the service'),
	serviceId: z.string().describe('ID of the service to update'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to update (usually obtained from service_info)',
		),
	region: RegionCodeSchema.optional().describe(
		'Optional: Region to deploy the service in',
	),
	rootDirectory: z
		.string()
		.optional()
		.describe('Optional: Root directory containing the service code'),
	buildCommand: z
		.string()
		.optional()
		.describe('Optional: Command to build the service'),
	startCommand: z
		.string()
		.optional()
		.describe('Optional: Command to start the service'),
	numReplicas: z
		.number()
		.optional()
		.describe('Optional: Number of service replicas to run'),
	healthcheckPath: z
		.string()
		.optional()
		.describe('Optional: Path for health checks'),
	sleepApplication: z
		.boolean()
		.optional()
		.describe('Optional: Whether to enable sleep mode'),
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
	projectId: z.string().describe('ID of the project containing the service'),
	serviceId: z.string().describe('ID of the service to delete'),
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
	serviceId: z.string().describe('ID of the service to restart'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment where the service should be restarted (usually obtained from service_info)',
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
			description: 'List all services in a specific Railway project',
			bestFor: [
				"Getting an overview of a project's services",
				'Finding service IDs',
				'Checking service status',
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
			description: 'Get detailed information about a specific service',
			bestFor: [
				'Viewing service configuration and status',
				'Checking deployment details',
				'Monitoring service health',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_LIST', 'RAILWAY_VARIABLE_LIST'],
				related: ['RAILWAY_SERVICE_UPDATE', 'RAILWAY_DEPLOYMENT_TRIGGER'],
			},
		}),
		schema: serviceInfoToolSchema,
		handler: serviceInfoToolHandler,
	},
	{
		name: 'RAILWAY_SERVICE_CREATE_FROM_REPO',
		description: formatToolDescription({
			type: 'API',
			description: 'Create a new service from a GitHub repository',
			bestFor: [
				'Deploying applications from source code',
				'Services that need build processes',
				'GitHub-hosted projects',
			],
			notFor: [
				'Pre-built Docker images (use RAILWAY_SERVICE_CREATE_FROM_IMAGE)',
				'Database deployments (use RAILWAY_DATABASE_DEPLOY)',
				'Static file hosting',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST'],
				nextSteps: ['RAILWAY_VARIABLE_SET', 'RAILWAY_SERVICE_UPDATE'],
				alternatives: [
					'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
					'RAILWAY_DATABASE_DEPLOY',
				],
				related: ['RAILWAY_DEPLOYMENT_TRIGGER', 'RAILWAY_SERVICE_INFO'],
			},
		}),
		schema: serviceCreateFromRepoToolSchema,
		handler: serviceCreateFromRepoToolHandler,
	},
	{
		name: 'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
		description: formatToolDescription({
			type: 'API',
			description: 'Create a new service from a Docker image',
			bestFor: [
				'Custom database deployments',
				'Pre-built container deployments',
				'Specific version requirements',
			],
			notFor: [
				'Standard database deployments (use RAILWAY_DATABASE_DEPLOY)',
				'GitHub repository deployments (use RAILWAY_SERVICE_CREATE_FROM_REPO)',
				'Services needing build process',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST'],
				nextSteps: [
					'RAILWAY_VARIABLE_SET',
					'RAILWAY_SERVICE_UPDATE',
					'RAILWAY_TCP_PROXY_CREATE',
				],
				alternatives: [
					'RAILWAY_DATABASE_DEPLOY',
					'RAILWAY_SERVICE_CREATE_FROM_REPO',
				],
				related: ['RAILWAY_VOLUME_CREATE', 'RAILWAY_DEPLOYMENT_TRIGGER'],
			},
		}),
		schema: serviceCreateFromImageToolSchema,
		handler: serviceCreateFromImageToolHandler,
	},
	{
		name: 'RAILWAY_SERVICE_UPDATE',
		description: formatToolDescription({
			type: 'API',
			description: "Update a service's configuration",
			bestFor: [
				'Changing service settings',
				'Updating resource limits',
				'Modifying deployment configuration',
			],
			notFor: [
				'Updating environment variables (use RAILWAY_VARIABLE_SET)',
				'Restarting services (use RAILWAY_SERVICE_RESTART)',
				'Triggering new deployments (use RAILWAY_DEPLOYMENT_TRIGGER)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST', 'RAILWAY_SERVICE_INFO'],
				nextSteps: ['RAILWAY_DEPLOYMENT_TRIGGER'],
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
			description: 'Delete a service from a project',
			bestFor: [
				'Removing unused services',
				'Cleaning up test services',
				'Project reorganization',
			],
			notFor: [
				'Temporary service stoppage (use RAILWAY_SERVICE_RESTART)',
				'Updating service configuration (use RAILWAY_SERVICE_UPDATE)',
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
			description: 'Restart a service in a specific environment',
			bestFor: [
				'Applying configuration changes',
				'Clearing service state',
				'Resolving runtime issues',
			],
			notFor: [
				'Deploying new code (use RAILWAY_DEPLOYMENT_TRIGGER)',
				'Updating service config (use RAILWAY_SERVICE_UPDATE)',
				'Long-term service stoppage (use RAILWAY_SERVICE_DELETE)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				alternatives: ['RAILWAY_DEPLOYMENT_TRIGGER'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_DEPLOYMENT_LOGS'],
			},
		}),
		schema: serviceRestartToolSchema,
		handler: serviceRestartToolHandler,
	},
];

export default allTools;

