import { RailwayApiClient } from '@/api/api-client';
import { DeploymentService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const deploymentListToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project containing the service (obtain from RAILWAY_PROJECT_LIST)',
		),
	serviceId: z
		.string()
		.describe(
			'ID of the service to list deployments for (obtain from RAILWAY_SERVICE_LIST)',
		),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to list deployments from. Usually the production or staging environment ID obtained from RAILWAY_SERVICE_LIST response.',
		),
	limit: z
		.number()
		.optional()
		.describe(
			'Optional: Maximum number of recent deployments to return. Defaults to 10. Use higher values (20-50) for detailed deployment history analysis.',
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
	projectId: z
		.string()
		.describe('ID of the project (obtain from RAILWAY_PROJECT_LIST)'),
	serviceId: z
		.string()
		.describe('ID of the service to deploy (obtain from RAILWAY_SERVICE_LIST)'),
	environmentId: z
		.string()
		.describe(
			'ID of the target environment for deployment (production, staging, etc. from RAILWAY_SERVICE_LIST)',
		),
	commitSha: z
		.string()
		.describe(
			'Specific Git commit SHA to deploy. Must be a valid 40-character Git commit hash from the connected repository. Use "latest" or "HEAD" for most recent commit.',
		),
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
	deploymentId: z
		.string()
		.describe(
			'ID of the deployment to get logs for (obtain from RAILWAY_DEPLOYMENT_LIST response)',
		),
	limit: z
		.number()
		.optional()
		.describe(
			'Optional: Maximum number of log entries to fetch. Defaults to 100. Use 200-500 for detailed debugging, 50-100 for quick status checks.',
		),
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
	deploymentId: z
		.string()
		.describe(
			'ID of the deployment to check status for (obtain from RAILWAY_DEPLOYMENT_LIST or RAILWAY_DEPLOYMENT_TRIGGER response)',
		),
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
				'List recent deployments for a service in a specific environment. Shows deployment status, timestamps, commit information, and deployment IDs needed for other deployment operations.',
			bestFor: [
				'Viewing deployment history and tracking changes over time',
				'Monitoring service updates and deployment frequency',
				'Getting deployment IDs for logs or status checks',
				'Debugging deployment issues by reviewing recent activity',
			],
			notFor: [
				'Triggering new deployments (use RAILWAY_DEPLOYMENT_TRIGGER)',
				'Getting real-time service status (use RAILWAY_SERVICE_INFO)',
				'Viewing build logs (use RAILWAY_DEPLOYMENT_LOGS)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_LOGS', 'RAILWAY_DEPLOYMENT_STATUS'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_DEPLOYMENT_TRIGGER'],
			},
		}),
		schema: deploymentListToolSchema,
		handler: deploymentListToolHandler,
	},
	{
		name: 'RAILWAY_DEPLOYMENT_TRIGGER',
		description: formatToolDescription({
			type: 'API',
			description:
				'Trigger a new deployment for a service from a specific Git commit. Initiates the build and deployment process, returning a deployment ID for tracking progress.',
			bestFor: [
				'Deploying new code changes from Git repository',
				'Rolling back to a previous commit by specifying its SHA',
				'Applying configuration updates that require redeployment',
				'Forcing a fresh deployment when automatic deployments fail',
			],
			notFor: [
				'Restarting services without code changes (use RAILWAY_SERVICE_RESTART)',
				'Updating service configuration only (use RAILWAY_SERVICE_UPDATE)',
				'Database schema changes (handle via migration scripts)',
				'Environment variable updates (use RAILWAY_VARIABLE_SET then restart)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_STATUS', 'RAILWAY_DEPLOYMENT_LOGS'],
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
			description:
				'Get build and deployment logs for a specific deployment. Shows the complete deployment process including build steps, dependency installation, and deployment status messages.',
			bestFor: [
				'Debugging failed deployments and build errors',
				'Monitoring active deployment progress in real-time',
				'Checking build output and dependency installation logs',
				'Analyzing deployment performance and timing issues',
			],
			notFor: [
				'Service runtime logs after deployment (check service logs)',
				'Database query logs (use database-specific logging)',
				'Application logs during normal operation',
			],
			relations: {
				prerequisites: [
					'RAILWAY_DEPLOYMENT_LIST',
					'RAILWAY_DEPLOYMENT_TRIGGER',
				],
				nextSteps: ['RAILWAY_DEPLOYMENT_STATUS'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_SERVICE_RESTART'],
			},
		}),
		schema: deploymentLogsToolSchema,
		handler: deploymentLogsToolHandler,
	},
	{
		name: 'RAILWAY_DEPLOYMENT_STATUS',
		description: formatToolDescription({
			type: 'API',
			description:
				'Check the current status and health of a deployment. Returns deployment state, success/failure status, and basic health check information.',
			bestFor: [
				'Monitoring active deployment progress and completion',
				'Verifying successful deployments before proceeding',
				'Checking for deployment failures and error states',
				'Validating deployment health before traffic routing',
			],
			notFor: [
				'Getting detailed error logs (use RAILWAY_DEPLOYMENT_LOGS)',
				'Service runtime performance monitoring',
				'Database connection status checks',
			],
			relations: {
				prerequisites: [
					'RAILWAY_DEPLOYMENT_LIST',
					'RAILWAY_DEPLOYMENT_TRIGGER',
				],
				nextSteps: ['RAILWAY_DEPLOYMENT_LOGS', 'RAILWAY_SERVICE_INFO'],
				related: ['RAILWAY_SERVICE_RESTART', 'RAILWAY_DOMAIN_LIST'],
			},
		}),
		schema: deploymentStatusToolSchema,
		handler: deploymentStatusToolHandler,
	},
];

export default allTools;

