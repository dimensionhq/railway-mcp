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
				"List all available database types that can be deployed using Railway's official templates",
			bestFor: [
				'Discovering supported database types',
				'Planning database deployments',
				'Checking template availability',
			],
			notFor: [
				'Listing existing databases',
				'Getting database connection details',
			],
			relations: {
				nextSteps: ['RAILWAY_DATABASE_DEPLOY'],
				alternatives: ['service_create_from_image'],
				related: [
					'RAILWAY_DATABASE_DEPLOY',
					'RAILWAY_SERVICE_CREATE_FROM_IMAGE',
				],
			},
		}),
		schema: listDatabaseTypesToolSchema,
		handler: listDatabaseTypesToolHandler,
	},
];

export default allTools;

