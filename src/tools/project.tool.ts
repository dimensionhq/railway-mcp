import { RailwayApiClient } from '@/api/api-client';
import { ProjectService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const projectListToolSchema = z.object({});

const projectListToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		projectListToolSchema.parse(args);
		const projectService = new ProjectService(railway);
		return projectService.listProjects();
	} catch (error) {
		logger.error({
			message: 'Error while listing projects',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while listing projects', {
			error,
		});
	}
};

const projectInfoToolSchema = z.object({
	projectId: z.string().describe('ID of the project to get information about'),
});

const projectInfoToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId } = projectInfoToolSchema.parse(args);
		const projectService = new ProjectService(railway);
		return projectService.getProject(projectId);
	} catch (error) {
		logger.error({
			message: 'Error while getting project info',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while getting project info', {
			error,
		});
	}
};

const projectCreateToolSchema = z.object({
	name: z.string().describe('Name for the new project'),
	teamId: z
		.string()
		.optional()
		.describe('Optional team ID to create the project under'),
});

const projectCreateToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { name, teamId } = projectCreateToolSchema.parse(args);
		const projectService = new ProjectService(railway);
		return projectService.createProject(name, teamId);
	} catch (error) {
		logger.error({
			message: 'Error while creating project',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while creating project', {
			error,
		});
	}
};

const projectDeleteToolSchema = z.object({
	projectId: z.string().describe('ID of the project to delete'),
});

const projectDeleteToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId } = projectDeleteToolSchema.parse(args);
		const projectService = new ProjectService(railway);
		return projectService.deleteProject(projectId);
	} catch (error) {
		logger.error({
			message: 'Error while deleting project',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while deleting project', {
			error,
		});
	}
};

const projectEnvironmentsToolSchema = z.object({
	projectId: z.string().describe('ID of the project'),
});

const projectEnvironmentsToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId } = projectEnvironmentsToolSchema.parse(args);
		const projectService = new ProjectService(railway);
		return projectService.listEnvironments(projectId);
	} catch (error) {
		logger.error({
			message: 'Error while listing project environments',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while listing project environments', {
			error,
		});
	}
};

const allTools = [
	{
		name: 'RAILWAY_PROJECT_LIST',
		description: formatToolDescription({
			type: 'API',
			description: 'List all projects in your Railway account',
			bestFor: [
				'Getting an overview of all projects',
				'Finding project IDs',
				'Project discovery and management',
			],
			relations: {
				nextSteps: ['RAILWAY_PROJECT_INFO', 'RAILWAY_SERVICE_LIST'],
				related: ['RAILWAY_PROJECT_CREATE', 'RAILWAY_PROJECT_DELETE'],
			},
		}),
		schema: projectListToolSchema,
		handler: projectListToolHandler,
	},
	{
		name: 'RAILWAY_PROJECT_INFO',
		description: formatToolDescription({
			type: 'API',
			description: 'Get detailed information about a specific Railway project',
			bestFor: [
				'Viewing project details and status',
				'Checking environments and services',
				'Project configuration review',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST'],
				nextSteps: ['RAILWAY_SERVICE_LIST', 'RAILWAY_VARIABLE_LIST'],
				related: ['RAILWAY_PROJECT_UPDATE', 'RAILWAY_PROJECT_DELETE'],
			},
		}),
		schema: projectInfoToolSchema,
		handler: projectInfoToolHandler,
	},
	{
		name: 'RAILWAY_PROJECT_CREATE',
		description: formatToolDescription({
			type: 'API',
			description: 'Create a new Railway project',
			bestFor: [
				'Starting new applications',
				'Setting up development environments',
				'Creating project spaces',
			],
			notFor: ['Duplicating existing projects'],
			relations: {
				nextSteps: [
					'RAILWAY_SERVICE_CREATE_FROM_REPO',
					'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
					'RAILWAY_DATABASE_DEPLOY',
				],
				related: ['RAILWAY_PROJECT_DELETE', 'RAILWAY_PROJECT_UPDATE'],
			},
		}),
		schema: projectCreateToolSchema,
		handler: projectCreateToolHandler,
	},
	{
		name: 'RAILWAY_PROJECT_DELETE',
		description: formatToolDescription({
			type: 'API',
			description: 'Delete a Railway project and all its resources',
			bestFor: ['Removing unused projects', 'Cleaning up test projects'],
			notFor: [
				'Temporary project deactivation',
				'Service-level cleanup (use RAILWAY_SERVICE_DELETE)',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST', 'RAILWAY_PROJECT_INFO'],
				alternatives: ['RAILWAY_SERVICE_DELETE'],
				related: ['RAILWAY_PROJECT_CREATE'],
			},
		}),
		schema: projectDeleteToolSchema,
		handler: projectDeleteToolHandler,
	},
	{
		name: 'RAILWAY_PROJECT_ENVIRONMENTS',
		description: formatToolDescription({
			type: 'API',
			description: 'List all environments in a project',
			bestFor: [
				'Viewing project environments',
				'Managing environment configurations',
				'Getting environment IDs',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST'],
				nextSteps: ['RAILWAY_SERVICE_LIST', 'RAILWAY_VARIABLE_LIST'],
				related: ['RAILWAY_PROJECT_INFO'],
			},
		}),
		schema: projectEnvironmentsToolSchema,
		handler: projectEnvironmentsToolHandler,
	},
];

export default allTools;

