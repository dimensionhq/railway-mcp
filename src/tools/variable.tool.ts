import { RailwayApiClient } from '@/api/api-client';
import { VariableService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const variableListToolSchema = z.object({
	projectId: z.string().describe('ID of the project containing the service'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to list variables from (usually obtained from service_list)',
		),
	serviceId: z
		.string()
		.optional()
		.describe(
			'Optional: ID of the service to list variables for, if not provided, shared variables across all services will be listed',
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
	projectId: z.string().describe('ID of the project containing the service'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment for the variable (usually obtained from service_list)',
		),
	name: z.string().describe('Name of the environment variable'),
	value: z.string().describe('Value to set for the variable'),
	serviceId: z
		.string()
		.optional()
		.describe(
			'Optional: ID of the service for the variable, if omitted creates/updates a shared variable',
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
	projectId: z.string().describe('ID of the project'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment to delete the variable from (usually obtained from service_list)',
		),
	name: z.string().describe('Name of the variable to delete'),
	serviceId: z
		.string()
		.optional()
		.describe(
			'ID of the service (optional, if omitted deletes a shared variable)',
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
	projectId: z.string().describe('ID of the project containing the service'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment for the variables (usually obtained from service_list)',
		),
	variables: z
		.record(z.string(), z.any())
		.describe('Object mapping variable names to values'),
	serviceId: z
		.string()
		.optional()
		.describe(
			'Optional: ID of the service for the variables, if omitted updates shared variables)',
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
	projectId: z.string().describe('ID of the project'),
	sourceEnvironmentId: z
		.string()
		.describe(
			'ID of the source environment (usually obtained from project_info)',
		),
	targetEnvironmentId: z
		.string()
		.describe(
			'ID of the target environment (usually obtained from project_info)',
		),
	serviceId: z
		.string()
		.optional()
		.describe(
			'ID of the service (optional, if omitted copies shared variables)',
		),
	overwrite: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			'Whether to overwrite existing variables in the target environment',
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
			description: 'List all environment variables for a service',
			bestFor: [
				'Viewing service configuration',
				'Auditing environment variables',
				'Checking connection strings',
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
			description: 'Create or update an environment variable',
			bestFor: [
				'Setting configuration values',
				'Updating connection strings',
				'Managing service secrets',
			],
			notFor: [
				'Bulk variable updates (use RAILWAY_VARIABLE_BULK_SET)',
				'Temporary configuration changes',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_TRIGGER', 'RAILWAY_SERVICE_RESTART'],
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
			description: 'Create or update multiple environment variables at once',
			bestFor: [
				'Migrating configuration between services',
				'Initial service setup',
				'Bulk configuration updates',
			],
			notFor: [
				'Single variable updates (use RAILWAY_VARIABLE_SET)',
				'Temporary configuration changes',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_TRIGGER', 'RAILWAY_SERVICE_RESTART'],
				alternatives: ['RAILWAY_VARIABLE_SET'],
				related: ['RAILWAY_VARIABLE_LIST', 'RAILWAY_SERVICE_UPDATE'],
			},
		}),
		schema: variableBulkSetToolSchema,
		handler: variableBulkSetToolHandler,
	},
	{
		name: 'RAILWAY_VARIABLE_COPY',
		description: formatToolDescription({
			type: 'WORKFLOW',
			description: 'Copy variables from one environment to another',
			bestFor: [
				'Environment migration',
				'Configuration sharing',
				'Environment duplication',
			],
			notFor: [
				'Single variable updates (use RAILWAY_VARIABLE_SET)',
				'Temporary configuration changes',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_DEPLOYMENT_TRIGGER', 'RAILWAY_SERVICE_RESTART'],
				alternatives: ['RAILWAY_VARIABLE_SET'],
				related: ['RAILWAY_VARIABLE_LIST', 'RAILWAY_SERVICE_UPDATE'],
			},
		}),
		schema: variableCopyToolSchema,
		handler: variableCopyToolHandler,
	},
];

export default allTools;

