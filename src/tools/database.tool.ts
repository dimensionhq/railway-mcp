import { RailwayApiClient } from '@/api/api-client';
import { DatabaseService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const listDatabaseTypesToolSchema = z.object({});
const listDatabaseTypesToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		listDatabaseTypesToolSchema.parse(args);
		const databaseService = new DatabaseService(railway);
		return databaseService.listDatabaseTypes();
	} catch (error) {
		logger.error({
			message: 'Error while listing database types',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while listing database types', {
			error,
		});
	}
};

const allTools = [
	{
		name: 'RAILWAY_DATABASE_LIST_TYPES',
		description: formatToolDescription({
			type: 'QUERY',
			description:
				"List all available database types that can be deployed using Railway's official templates. Returns database options like PostgreSQL, MySQL, Redis, MongoDB, etc. with their template IDs for deployment.",
			bestFor: [
				'Discovering supported database types before deployment',
				'Planning database deployments and architecture decisions',
				'Checking template availability for specific database versions',
				'Getting template IDs needed for RAILWAY_TEMPLATE_DEPLOY',
			],
			notFor: [
				'Listing existing deployed databases (use RAILWAY_SERVICE_LIST)',
				'Getting database connection details (use RAILWAY_VARIABLE_LIST)',
				'Checking database status (use RAILWAY_SERVICE_INFO)',
			],
			relations: {
				nextSteps: ['RAILWAY_TEMPLATE_DEPLOY', 'RAILWAY_PROJECT_CREATE'],
				alternatives: [
					'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
					'RAILWAY_TEMPLATE_LIST',
				],
				related: ['RAILWAY_TEMPLATE_LIST', 'RAILWAY_SERVICE_CREATE_FROM_IMAGE'],
			},
		}),
		schema: listDatabaseTypesToolSchema,
		handler: listDatabaseTypesToolHandler,
	},
];

export default allTools;

