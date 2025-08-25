import { RailwayApiClient } from '@/api/api-client';
import { DeploymentService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const deploymentListToolSchema = z.object({
	projectId: z.string().describe('ID of the project containing the service'),
	serviceId: z.string().describe('ID of the service to list deployments for'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to list deployments from (usually obtained from service_list)',
		),
	limit: z
		.number()
		.optional()
		.describe(
			'Optional: Maximum number of deployments to return (default: 10)',
		),
});

const deploymentListToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const {
			projectId,
			serviceId,
			environmentId,
			limit = 10,
		} = deploymentListToolSchema.parse(args);
		const deploymentService = new DeploymentService(railway);
		return deploymentService.listDeployments(
			projectId,
			serviceId,
			environmentId,
			limit,
		);
	} catch (error) {
		logger.error({
			message: 'Error while listing deployments',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while listing deployments', {
			error,
		});
	}
};

const deploymentTriggerToolSchema = z.object({
	projectId: z.string().describe('ID of the project'),
	serviceId: z.string().describe('ID of the service'),
	environmentId: z.string().describe('ID of the environment'),
	commitSha: z.string().describe('Specific commit SHA from the Git repository'),
});

const deploymentTriggerToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, serviceId, environmentId, commitSha } =
			deploymentTriggerToolSchema.parse(args);
		const deploymentService = new DeploymentService(railway);
		return deploymentService.triggerDeployment(
			projectId,
			serviceId,
			environmentId,
			commitSha,
		);
	} catch (error) {
		logger.error({
			message: 'Error while triggering deployment',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while triggering deployment', {
			error,
		});
	}
};

const deploymentLogsToolSchema = z.object({
	deploymentId: z.string().describe('ID of the deployment to get logs for'),
	limit: z
		.number()
		.optional()
		.describe('Maximum number of log entries to fetch'),
});

const deploymentLogsToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { deploymentId, limit = 100 } = deploymentLogsToolSchema.parse(args);
		const deploymentService = new DeploymentService(railway);
		return deploymentService.getDeploymentLogs(deploymentId, limit);
	} catch (error) {
		logger.error({
			message: 'Error while getting deployment logs',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while getting deployment logs', {
			error,
		});
	}
};

const deploymentStatusToolSchema = z.object({
	deploymentId: z.string().describe('ID of the deployment to check status for'),
});

const deploymentStatusToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { deploymentId } = deploymentStatusToolSchema.parse(args);
		const deploymentService = new DeploymentService(railway);
		return deploymentService.healthCheckDeployment(deploymentId);
	} catch (error) {
		logger.error({
			message: 'Error while checking deployment status',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while checking deployment status', {
			error,
		});
	}
};

const allTools = [
	{
		name: 'RAILWAY_DEPLOYMENT_LIST',
		description: formatToolDescription({
			type: 'API',
			description:
				'List recent deployments for a service in a specific environment',
			bestFor: ['Viewing deployment history', 'Monitoring service updates'],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_LOGS', 'RAILWAY_DEPLOYMENT_TRIGGER'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_SERVICE_RESTART'],
			},
		}),
		schema: deploymentListToolSchema,
		handler: deploymentListToolHandler,
	},
	{
		name: 'RAILWAY_DEPLOYMENT_TRIGGER',
		description: formatToolDescription({
			type: 'API',
			description: 'Trigger a new deployment for a service',
			bestFor: [
				'Deploying code changes',
				'Applying configuration updates',
				'Rolling back to previous states',
			],
			notFor: [
				'Restarting services (use RAILWAY_SERVICE_RESTART)',
				'Updating service config (use RAILWAY_SERVICE_UPDATE)',
				'Database changes',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_LOGS', 'RAILWAY_DEPLOYMENT_STATUS'],
				alternatives: ['RAILWAY_SERVICE_RESTART'],
				related: ['RAILWAY_VARIABLE_SET', 'RAILWAY_SERVICE_UPDATE'],
			},
		}),
		schema: deploymentTriggerToolSchema,
		handler: deploymentTriggerToolHandler,
	},
	{
		name: 'RAILWAY_DEPLOYMENT_LOGS',
		description: formatToolDescription({
			type: 'API',
			description: 'Get logs for a specific deployment',
			bestFor: [
				'Debugging deployment issues',
				'Monitoring deployment progress',
				'Checking build output',
			],
			notFor: ['Service runtime logs', 'Database logs'],
			relations: {
				prerequisites: ['RAILWAY_DEPLOYMENT_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_STATUS'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_DEPLOYMENT_TRIGGER'],
			},
		}),
		schema: deploymentLogsToolSchema,
		handler: deploymentLogsToolHandler,
	},
	{
		name: 'RAILWAY_DEPLOYMENT_STATUS',
		description: formatToolDescription({
			type: 'API',
			description: 'Check the current status of a deployment',
			bestFor: [
				'Monitoring deployment progress',
				'Verifying successful deployments',
				'Checking for deployment failures',
			],
			notFor: ['Service runtime logs', 'Database logs'],
			relations: {
				prerequisites: [
					'RAILWAY_DEPLOYMENT_LIST',
					'RAILWAY_DEPLOYMENT_TRIGGER',
				],
				nextSteps: ['RAILWAY_DEPLOYMENT_LOGS'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_SERVICE_RESTART'],
			},
		}),
		schema: deploymentStatusToolSchema,
		handler: deploymentStatusToolHandler,
	},
];

export default allTools;

