import { RailwayApiClient } from '@/api/api-client';
import { VolumeService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const volumeListToolSchema = z.object({
	projectId: z.string().describe('ID of the project to list volumes for'),
});

const volumeListToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId } = volumeListToolSchema.parse(args);
		const volumeService = new VolumeService(railway);
		return volumeService.listVolumes(projectId);
	} catch (error) {
		logger.error({
			message: 'Error while listing volumes',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while listing volumes', {
			error,
		});
	}
};

const volumeCreateToolSchema = z.object({
	projectId: z.string().describe('ID of the project containing the service'),
	environmentId: z
		.string()
		.describe(
			'ID of the environment for the volume (usually obtained from service_info)',
		),
	serviceId: z.string().describe('ID of the service to attach volume to'),
	mountPath: z
		.string()
		.describe('Path where the volume should be mounted in the container'),
});

const volumeCreateToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { projectId, environmentId, serviceId, mountPath } =
			volumeCreateToolSchema.parse(args);
		const volumeService = new VolumeService(railway);
		return volumeService.createVolume(
			projectId,
			serviceId,
			environmentId,
			mountPath,
		);
	} catch (error) {
		logger.error({
			message: 'Error while creating volume',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while creating volume', {
			error,
		});
	}
};

const volumeUpdateToolSchema = z.object({
	volumeId: z.string().describe('ID of the volume to update'),
	name: z.string().describe('New name for the volume'),
});

const volumeUpdateToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { volumeId, name } = volumeUpdateToolSchema.parse(args);
		const volumeService = new VolumeService(railway);
		return volumeService.updateVolume(volumeId, name);
	} catch (error) {
		logger.error({
			message: 'Error while updating volume',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while updating volume', {
			error,
		});
	}
};

const volumeDeleteToolSchema = z.object({
	volumeId: z.string().describe('ID of the volume to delete'),
});

const volumeDeleteToolHandler = async (
	args: unknown,
	railway: RailwayApiClient,
) => {
	try {
		const { volumeId } = volumeDeleteToolSchema.parse(args);
		const volumeService = new VolumeService(railway);
		return volumeService.deleteVolume(volumeId);
	} catch (error) {
		logger.error({
			message: 'Error while deleting volume',
			error,
		});
		if (error instanceof UserError) throw error;
		throw new UserError('Error while deleting volume', {
			error,
		});
	}
};

const allTools = [
	{
		name: 'RAILWAY_VOLUME_LIST',
		description: formatToolDescription({
			type: 'API',
			description: 'List all volumes in a project',
			bestFor: [
				'Viewing persistent storage configurations',
				'Managing data volumes',
				'Auditing storage usage',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST'],
				nextSteps: ['RAILWAY_VOLUME_CREATE'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_DATABASE_DEPLOY'],
			},
		}),
		schema: volumeListToolSchema,
		handler: volumeListToolHandler,
	},
	{
		name: 'RAILWAY_VOLUME_CREATE',
		description: formatToolDescription({
			type: 'API',
			description: 'Create a new persistent volume for a service',
			bestFor: [
				'Setting up database storage',
				'Configuring persistent data',
				'Adding file storage',
			],
			notFor: [
				'Temporary storage needs',
				'Static file hosting',
				'Memory caching',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_VOLUME_LIST'],
				related: ['RAILWAY_SERVICE_UPDATE', 'RAILWAY_DATABASE_DEPLOY'],
			},
		}),
		schema: volumeCreateToolSchema,
		handler: volumeCreateToolHandler,
	},
	{
		name: 'RAILWAY_VOLUME_UPDATE',
		description: formatToolDescription({
			type: 'API',
			description: "Update a volume's properties",
			bestFor: [
				'Renaming volumes',
				'Volume management',
				'Organization updates',
			],
			relations: {
				prerequisites: ['RAILWAY_VOLUME_LIST'],
				nextSteps: ['RAILWAY_VOLUME_LIST'],
				related: ['RAILWAY_SERVICE_UPDATE'],
			},
		}),
		schema: volumeUpdateToolSchema,
		handler: volumeUpdateToolHandler,
	},
	{
		name: 'RAILWAY_VOLUME_DELETE',
		description: formatToolDescription({
			type: 'API',
			description: 'Delete a volume from a service',
			bestFor: [
				'Removing unused storage',
				'Storage cleanup',
				'Resource management',
			],
			notFor: [
				'Temporary data removal',
				'Data backup (use volume_backup first)',
			],
			relations: {
				prerequisites: ['RAILWAY_VOLUME_LIST'],
				related: ['RAILWAY_SERVICE_UPDATE'],
			},
		}),
		schema: volumeDeleteToolSchema,
		handler: volumeDeleteToolHandler,
	},
];

export default allTools;

