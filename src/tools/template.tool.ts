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
			'Optional search query to filter templates by name and description',
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
	projectId: z.string().describe('ID of the project to create the service in'),
	templateId: z.string().describe('ID of the template to use'),
	environmentId: z.string().describe('ID of the environment to deploy to'),
	teamId: z
		.string()
		.optional()
		.describe(
			'ID of the team to create the service in (if not provided, will use the default team)',
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
	workflowId: z.string().describe('ID of the workflow to get the status of'),
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
			description: 'List all available templates on Railway',
			bestFor: [
				'Discovering available templates',
				'Planning service deployments',
				'Finding template IDs and sources',
			],
			notFor: ['Listing existing services', 'Getting service details'],
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
			description: 'Deploy a new service from a template',
			bestFor: [
				'Starting new services from templates',
				'Quick service deployment',
				'Using pre-configured templates',
			],
			notFor: [
				'Custom service configurations',
				'GitHub repository deployments (use RAILWAY_SERVICE_CREATE_FROM_REPO)',
			],
			relations: {
				prerequisites: ['RAILWAY_TEMPLATE_LIST'],
				alternatives: [
					'RAILWAY_SERVICE_CREATE_FROM_REPO',
					'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
					'RAILWAY_DATABASE_DEPLOY',
				],
				nextSteps: ['RAILWAY_SERVICE_INFO', 'RAILWAY_VARIABLE_LIST'],
				related: ['RAILWAY_SERVICE_UPDATE', 'RAILWAY_DEPLOYMENT_TRIGGER'],
			},
		}),
		schema: templateDeployToolSchema,
		handler: templateDeployToolHandler,
	},
	{
		name: 'RAILWAY_TEMPLATE_GET_WORKFLOW_STATUS',
		description: formatToolDescription({
			type: 'API',
			description: 'Get the status of a workflow',
			bestFor: [
				'Checking workflow status',
				'Monitoring template deployment progress',
				'Verifying deployment completion',
			],
			notFor: ['Creating new services'],
			relations: {
				prerequisites: ['RAILWAY_TEMPLATE_DEPLOY'],
				nextSteps: ['RAILWAY_SERVICE_INFO'],
				related: ['RAILWAY_TEMPLATE_LIST', 'RAILWAY_TEMPLATE_DEPLOY'],
			},
		}),
		schema: templateGetWorkflowStatusToolSchema,
		handler: templateGetWorkflowStatusToolHandler,
	},
];

export default allTools;

