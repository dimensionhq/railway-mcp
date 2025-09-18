import { RailwayApiClient } from '@/api/api-client';
import { TemplatesService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const templateListToolSchema = z.object({
	searchQuery: z
		.string()
		.optional()
		.describe(
			'Optional: Search query to filter templates by name and description (e.g., "postgres", "redis", "nextjs", "django"). Leave empty to see all available templates.',
		),
});

const templateListToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { searchQuery } = templateListToolSchema.parse(args);
		const templatesService = new TemplatesService(railway);
		return templatesService.listTemplates(searchQuery);
	} catch (error) {
		logger.error({
			message: 'Error while listing templates',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while listing templates', {
			error,
		});
	}
};

const templateDeployToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project to create the service in (obtain from RAILWAY_PROJECT_LIST)',
		),
	templateId: z
		.string()
		.describe(
			'ID of the template to use (obtain from RAILWAY_TEMPLATE_LIST or RAILWAY_DATABASE_LIST_TYPES)',
		),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to deploy to (obtain from RAILWAY_PROJECT_ENVIRONMENTS). Usually production environment.',
		),
	teamId: z
		.string()
		.optional()
		.describe(
			'Optional: Team ID to create the service under. If not provided, uses your default team or personal account.',
		),
});

const templateDeployToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, templateId, environmentId, teamId } =
			templateDeployToolSchema.parse(args);
		const templatesService = new TemplatesService(railway);
		return templatesService.deployTemplate(
			projectId,
			templateId,
			environmentId,
			teamId,
		);
	} catch (error) {
		logger.error({
			message: 'Error while deploying template',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while deploying template', {
			error,
		});
	}
};

const templateGetWorkflowStatusToolSchema = z.object({
	workflowId: z
		.string()
		.describe(
			'ID of the workflow to get the status of (obtain from RAILWAY_TEMPLATE_DEPLOY response). Used to track deployment progress.',
		),
});

const templateGetWorkflowStatusToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { workflowId } = templateGetWorkflowStatusToolSchema.parse(args);
		const templatesService = new TemplatesService(railway);
		return templatesService.getWorkflowStatus(workflowId);
	} catch (error) {
		logger.error({
			message: 'Error while getting workflow status',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while getting workflow status', {
			error,
		});
	}
};

const allTools = [
	{
		name: 'RAILWAY_TEMPLATE_LIST',
		description: formatToolDescription({
			type: 'API',
			description:
				'List all available templates on Railway including databases, frameworks, and starter applications. Templates provide pre-configured services with optimal settings.',
			bestFor: [
				'Discovering available templates for databases and applications',
				'Planning service deployments with pre-configured setups',
				'Finding template IDs needed for deployment',
				'Exploring starter templates for popular frameworks',
			],
			notFor: [
				'Listing existing deployed services (use RAILWAY_SERVICE_LIST)',
				'Getting details of deployed services (use RAILWAY_SERVICE_INFO)',
				'Custom deployments from code (use RAILWAY_SERVICE_CREATE_FROM_REPO)',
			],
			relations: {
				nextSteps: ['RAILWAY_TEMPLATE_DEPLOY'],
				alternatives: [
					'RAILWAY_SERVICE_CREATE_FROM_REPO',
					'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
				],
				related: ['RAILWAY_DATABASE_LIST_TYPES'],
			},
		}),
		schema: templateListToolSchema,
		handler: templateListToolHandler,
	},
	{
		name: 'RAILWAY_TEMPLATE_DEPLOY',
		description: formatToolDescription({
			type: 'WORKFLOW',
			description:
				'Deploy a new service from a Railway template. This creates a fully configured service with optimal defaults and automatic setup.',
			bestFor: [
				'Deploying databases (PostgreSQL, MySQL, Redis, MongoDB) with optimal configuration',
				'Quick deployment of popular frameworks and starter applications',
				'Using pre-configured templates with best practices',
				'Setting up services with automatic environment variables and networking',
			],
			notFor: [
				'Custom applications from your own code (use RAILWAY_SERVICE_CREATE_FROM_REPO)',
				'Heavily customized service configurations',
				'Existing Docker images (use RAILWAY_SERVICE_CREATE_FROM_IMAGE)',
			],
			relations: {
				prerequisites: ['RAILWAY_TEMPLATE_LIST', 'RAILWAY_PROJECT_LIST'],
				alternatives: [
					'RAILWAY_SERVICE_CREATE_FROM_REPO',
					'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
				],
				nextSteps: [
					'RAILWAY_TEMPLATE_GET_WORKFLOW_STATUS',
					'RAILWAY_SERVICE_INFO',
				],
				related: ['RAILWAY_VARIABLE_LIST', 'RAILWAY_TCP_PROXY_CREATE'],
			},
		}),
		schema: templateDeployToolSchema,
		handler: templateDeployToolHandler,
	},
	{
		name: 'RAILWAY_TEMPLATE_GET_WORKFLOW_STATUS',
		description: formatToolDescription({
			type: 'API',
			description:
				'Get the status of a template deployment workflow. Shows progress, completion status, and any errors during template deployment.',
			bestFor: [
				'Checking template deployment workflow status and progress',
				'Monitoring template deployment progress in real-time',
				'Verifying successful template deployment completion',
				'Debugging failed template deployments',
			],
			notFor: [
				'Creating new services (use RAILWAY_TEMPLATE_DEPLOY)',
				'Checking service status after deployment (use RAILWAY_SERVICE_INFO)',
				'Getting deployment logs (use RAILWAY_DEPLOYMENT_LOGS)',
			],
			relations: {
				prerequisites: ['RAILWAY_TEMPLATE_DEPLOY'],
				nextSteps: ['RAILWAY_SERVICE_INFO', 'RAILWAY_SERVICE_LIST'],
				related: ['RAILWAY_DEPLOYMENT_STATUS', 'RAILWAY_SERVICE_INFO'],
			},
		}),
		schema: templateGetWorkflowStatusToolSchema,
		handler: templateGetWorkflowStatusToolHandler,
	},
];

export default allTools;

