import { RailwayApiClient } from '@/api/api-client';
import { VariableService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const variableListToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project containing the service (obtain from RAILWAY_PROJECT_LIST)',
		),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to list variables from (obtain from RAILWAY_SERVICE_LIST or RAILWAY_PROJECT_ENVIRONMENTS). Usually production environment.',
		),
	serviceId: z
		.string()
		.optional()
		.describe(
			'Optional: ID of the service to list variables for (obtain from RAILWAY_SERVICE_LIST). If omitted, lists shared variables available to all services in the environment.',
		),
});

const variableListToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, environmentId, serviceId } =
			variableListToolSchema.parse(args);
		const variableService = new VariableService(railway);
		return variableService.listVariables(projectId, environmentId, serviceId);
	} catch (error) {
		logger.error({
			message: 'Error while listing variables',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while listing variables', {
			error,
		});
	}
};

const variableSetToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project containing the service (obtain from RAILWAY_PROJECT_LIST)',
		),
	environmentId: z
		.string()
		.describe(
			'ID of the environment for the variable (obtain from RAILWAY_SERVICE_LIST). Usually production environment.',
		),
	name: z
		.string()
		.describe(
			'Name of the environment variable (e.g., "DATABASE_URL", "API_KEY", "PORT"). Use UPPERCASE with underscores by convention.',
		),
	value: z
		.string()
		.describe(
			'Value to set for the variable. Can be connection strings, API keys, configuration values, etc. Be careful with sensitive data.',
		),
	serviceId: z
		.string()
		.optional()
		.describe(
			'Optional: ID of the service for the variable (obtain from RAILWAY_SERVICE_LIST). If omitted, creates a shared variable available to all services.',
		),
});

const variableSetToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, environmentId, name, value, serviceId } =
			variableSetToolSchema.parse(args);
		const variableService = new VariableService(railway);
		return variableService.upsertVariable(
			projectId,
			environmentId,
			name,
			value,
			serviceId,
		);
	} catch (error) {
		logger.error({
			message: 'Error while setting variable',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while setting variable', {
			error,
		});
	}
};

const variableDeleteToolSchema = z.object({
	projectId: z
		.string()
		.describe('ID of the project (obtain from RAILWAY_PROJECT_LIST)'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to delete the variable from (obtain from RAILWAY_SERVICE_LIST). Usually production environment.',
		),
	name: z
		.string()
		.describe(
			'Name of the variable to delete (e.g., "DATABASE_URL", "API_KEY"). Must match exactly including case.',
		),
	serviceId: z
		.string()
		.optional()
		.describe(
			'Optional: ID of the service (obtain from RAILWAY_SERVICE_LIST). If omitted, deletes a shared variable.',
		),
});

const variableDeleteToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, environmentId, name, serviceId } =
			variableDeleteToolSchema.parse(args);
		const variableService = new VariableService(railway);
		return variableService.deleteVariable(
			projectId,
			environmentId,
			name,
			serviceId,
		);
	} catch (error) {
		logger.error({
			message: 'Error while deleting variable',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while deleting variable', {
			error,
		});
	}
};

const variableBulkSetToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project containing the service (obtain from RAILWAY_PROJECT_LIST)',
		),
	environmentId: z
		.string()
		.describe(
			'ID of the environment for the variables (obtain from RAILWAY_SERVICE_LIST). Usually production environment.',
		),
	variables: z
		.record(z.string(), z.any())
		.describe(
			'Object mapping variable names to values (e.g., {"DATABASE_URL": "postgres://...", "API_KEY": "abc123", "PORT": "3000"}). Keys should be UPPERCASE with underscores.',
		),
	serviceId: z
		.string()
		.optional()
		.describe(
			'Optional: ID of the service for the variables (obtain from RAILWAY_SERVICE_LIST). If omitted, updates shared variables available to all services.',
		),
});

const variableBulkSetToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, environmentId, variables, serviceId } =
			variableBulkSetToolSchema.parse(args);
		const variableService = new VariableService(railway);
		return variableService.bulkUpsertVariables(
			projectId,
			environmentId,
			variables,
			serviceId,
		);
	} catch (error) {
		logger.error({
			message: 'Error while bulk setting variables',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while bulk setting variables', {
			error,
		});
	}
};

const variableCopyToolSchema = z.object({
	projectId: z
		.string()
		.describe('ID of the project (obtain from RAILWAY_PROJECT_LIST)'),
	sourceEnvironmentId: z
		.string()
		.describe(
			'ID of the source environment to copy variables from (obtain from RAILWAY_PROJECT_ENVIRONMENTS).',
		),
	targetEnvironmentId: z
		.string()
		.describe(
			'ID of the target environment to copy variables to (obtain from RAILWAY_PROJECT_ENVIRONMENTS). Must be different from source.',
		),
	serviceId: z
		.string()
		.optional()
		.describe(
			'Optional: ID of the service (obtain from RAILWAY_SERVICE_LIST). If omitted, copies shared variables between environments.',
		),
	overwrite: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			'Whether to overwrite existing variables in the target environment. Default: false (skip existing variables).',
		),
});

const variableCopyToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const {
			projectId,
			sourceEnvironmentId,
			targetEnvironmentId,
			serviceId,
			overwrite = false,
		} = variableCopyToolSchema.parse(args);
		const variableService = new VariableService(railway);
		return variableService.copyVariables(
			projectId,
			sourceEnvironmentId,
			targetEnvironmentId,
			serviceId,
			overwrite,
		);
	} catch (error) {
		logger.error({
			message: 'Error while copying variables',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while copying variables', {
			error,
		});
	}
};

const allTools = [
	{
		name: 'RAILWAY_VARIABLE_LIST',
		description: formatToolDescription({
			type: 'API',
			description:
				'List all environment variables for a service or shared variables in an environment. Shows variable names, values, and whether they are service-specific or shared.',
			bestFor: [
				'Viewing current service configuration and environment variables',
				'Auditing environment variables and sensitive data',
				'Checking database connection strings and API keys',
				'Understanding service configuration before making changes',
			],
			notFor: [
				'Setting new variables (use RAILWAY_VARIABLE_SET)',
				'Getting service runtime information (use RAILWAY_SERVICE_INFO)',
				'Managing multiple variables at once (use RAILWAY_VARIABLE_BULK_SET)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_VARIABLE_SET', 'RAILWAY_VARIABLE_DELETE'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_VARIABLE_BULK_SET'],
			},
		}),
		schema: variableListToolSchema,
		handler: variableListToolHandler,
	},
	{
		name: 'RAILWAY_VARIABLE_SET',
		description: formatToolDescription({
			type: 'API',
			description:
				'Create or update a single environment variable. Changes take effect after service restart or redeployment. Use for configuration values, API keys, and connection strings.',
			bestFor: [
				'Setting individual configuration values (DATABASE_URL, API_KEY, etc.)',
				'Updating database connection strings and service URLs',
				'Managing service secrets and authentication tokens',
				'Configuring application-specific environment settings',
			],
			notFor: [
				'Setting multiple variables at once (use RAILWAY_VARIABLE_BULK_SET)',
				'Temporary configuration changes (variables persist)',
				'Service configuration like ports or commands (use RAILWAY_SERVICE_UPDATE)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_SERVICE_RESTART', 'RAILWAY_DEPLOYMENT_TRIGGER'],
				alternatives: ['RAILWAY_VARIABLE_BULK_SET'],
				related: ['RAILWAY_VARIABLE_LIST', 'RAILWAY_VARIABLE_DELETE'],
			},
		}),
		schema: variableSetToolSchema,
		handler: variableSetToolHandler,
	},
	{
		name: 'RAILWAY_VARIABLE_DELETE',
		description: formatToolDescription({
			type: 'API',
			description: 'Delete a variable for a service in a specific environment',
			bestFor: [
				'Removing unused configuration',
				'Security cleanup',
				'Configuration management',
			],
			notFor: ['Temporary variable disabling', 'Bulk variable removal'],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_TRIGGER', 'RAILWAY_SERVICE_RESTART'],
				related: ['RAILWAY_VARIABLE_LIST', 'RAILWAY_VARIABLE_SET'],
			},
		}),
		schema: variableDeleteToolSchema,
		handler: variableDeleteToolHandler,
	},
	{
		name: 'RAILWAY_VARIABLE_BULK_SET',
		description: formatToolDescription({
			type: 'WORKFLOW',
			description:
				'Create or update multiple environment variables at once. Efficient for setting up service configurations, migrating settings, or bulk updates.',
			bestFor: [
				'Initial service setup with multiple configuration values',
				'Migrating configuration between services or environments',
				'Bulk configuration updates for application settings',
				'Setting up database connections with multiple related variables',
			],
			notFor: [
				'Single variable updates (use RAILWAY_VARIABLE_SET for efficiency)',
				'Temporary configuration changes (variables persist)',
				'Service-level configuration (use RAILWAY_SERVICE_UPDATE)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_SERVICE_RESTART', 'RAILWAY_DEPLOYMENT_TRIGGER'],
				alternatives: ['RAILWAY_VARIABLE_SET'],
				related: ['RAILWAY_VARIABLE_COPY', 'RAILWAY_VARIABLE_LIST'],
			},
		}),
		schema: variableBulkSetToolSchema,
		handler: variableBulkSetToolHandler,
	},
	{
		name: 'RAILWAY_VARIABLE_COPY',
		description: formatToolDescription({
			type: 'WORKFLOW',
			description:
				'Copy variables from one environment to another within the same project. Useful for promoting configurations or setting up new environments.',
			bestFor: [
				'Promoting configuration from staging to production',
				'Setting up new environments with existing configurations',
				'Duplicating environment settings for consistency',
				'Migrating variables between project environments',
			],
			notFor: [
				'Copying between different projects (manual recreation needed)',
				'Single variable updates (use RAILWAY_VARIABLE_SET)',
				'Temporary configuration changes (variables persist)',
			],
			relations: {
				prerequisites: [
					'RAILWAY_PROJECT_ENVIRONMENTS',
					'RAILWAY_VARIABLE_LIST',
				],
				nextSteps: ['RAILWAY_SERVICE_RESTART', 'RAILWAY_DEPLOYMENT_TRIGGER'],
				alternatives: ['RAILWAY_VARIABLE_BULK_SET'],
				related: ['RAILWAY_VARIABLE_LIST', 'RAILWAY_PROJECT_ENVIRONMENTS'],
			},
		}),
		schema: variableCopyToolSchema,
		handler: variableCopyToolHandler,
	},
];

export default allTools;

