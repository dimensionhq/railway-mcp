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
	projectId: z
		.string()
		.describe(
			'ID of the project to get information about (obtain from RAILWAY_PROJECT_LIST)',
		),
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
	name: z
		.string()
		.describe(
			'Name for the new project (e.g., "My Web App", "API Backend"). Should be descriptive and unique within your account.',
		),
	teamId: z
		.string()
		.optional()
		.describe(
			'Optional: Team ID to create the project under. Omit to create in personal account. Required for team-based projects.',
		),
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
	projectId: z
		.string()
		.describe(
			'ID of the project to delete (obtain from RAILWAY_PROJECT_LIST). WARNING: This permanently deletes ALL services, databases, and data.',
		),
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
	projectId: z
		.string()
		.describe(
			'ID of the project to list environments for (obtain from RAILWAY_PROJECT_LIST)',
		),
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
			description:
				'List all projects in your Railway account. Returns project names, IDs, creation dates, and basic metadata. This is typically the first tool to use when working with Railway.',
			bestFor: [
				'Getting an overview of all projects and their status',
				'Finding project IDs needed for other operations',
				'Project discovery and account management',
				'Starting point for any Railway workflow',
			],
			notFor: [
				'Getting detailed project information (use RAILWAY_PROJECT_INFO)',
				'Listing services within projects (use RAILWAY_SERVICE_LIST)',
				'Creating new projects (use RAILWAY_PROJECT_CREATE)',
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
			description:
				'Get detailed information about a specific Railway project. Returns project metadata, environment details, service counts, and configuration settings.',
			bestFor: [
				'Viewing comprehensive project details and current status',
				'Understanding project structure before making changes',
				'Checking available environments (production, staging, etc.)',
				'Project health and configuration review',
			],
			notFor: [
				'Listing all projects (use RAILWAY_PROJECT_LIST)',
				'Getting service-specific details (use RAILWAY_SERVICE_INFO)',
				'Managing environments (use RAILWAY_PROJECT_ENVIRONMENTS)',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST'],
				nextSteps: ['RAILWAY_SERVICE_LIST', 'RAILWAY_PROJECT_ENVIRONMENTS'],
				related: ['RAILWAY_VARIABLE_LIST', 'RAILWAY_PROJECT_DELETE'],
			},
		}),
		schema: projectInfoToolSchema,
		handler: projectInfoToolHandler,
	},
	{
		name: 'RAILWAY_PROJECT_CREATE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Create a new Railway project with default environments (production). Projects are containers for services, databases, and configurations.',
			bestFor: [
				'Starting new applications or microservices',
				'Setting up isolated development environments',
				'Creating project spaces for team collaboration',
				'Organizing related services under one project',
			],
			notFor: [
				'Duplicating existing projects (manually recreate services)',
				'Creating services directly (create project first)',
				'One-time deployments (consider existing projects)',
			],
			relations: {
				nextSteps: [
					'RAILWAY_SERVICE_CREATE_FROM_REPO',
					'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
					'RAILWAY_TEMPLATE_DEPLOY',
				],
				related: ['RAILWAY_PROJECT_INFO', 'RAILWAY_PROJECT_ENVIRONMENTS'],
			},
		}),
		schema: projectCreateToolSchema,
		handler: projectCreateToolHandler,
	},
	{
		name: 'RAILWAY_PROJECT_DELETE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Delete a Railway project and ALL its resources permanently. WARNING: This destroys all services, databases, volumes, domains, and data. Cannot be undone.',
			bestFor: [
				'Removing completely unused projects',
				'Cleaning up test or experimental projects',
				'Account cleanup and cost management',
			],
			notFor: [
				'Temporary project deactivation (no Railway equivalent)',
				'Individual service cleanup (use RAILWAY_SERVICE_DELETE)',
				'Production projects without extensive backup verification',
				'Projects with important data (backup first)',
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
			description:
				'List all environments in a project (production, staging, etc.). Returns environment IDs needed for service and variable operations.',
			bestFor: [
				'Viewing available project environments and their status',
				'Getting environment IDs for service operations',
				'Understanding project structure and deployment stages',
				'Managing multi-environment configurations',
			],
			notFor: [
				'Creating new environments (Railway manages automatically)',
				'Environment-specific service details (use RAILWAY_SERVICE_LIST)',
				'Variable management (use RAILWAY_VARIABLE_LIST)',
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

