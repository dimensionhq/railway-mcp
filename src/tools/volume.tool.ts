import { RailwayApiClient } from '@/api/api-client';
import { VolumeService } from '@/services';
import { logger } from '@/utils/logger';
import { formatToolDescription } from '@/utils/tools.js';
import { UserError } from 'fastmcp';
import { z } from 'zod';

const volumeListToolSchema = z.object({
	projectId: z
		.string()
		.describe(
			'ID of the project to list volumes for (obtain from RAILWAY_PROJECT_LIST)',
		),
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
	projectId: z
		.string()
		.describe(
			'ID of the project containing the service (obtain from RAILWAY_PROJECT_LIST)',
		),
	environmentId: z
		.string()
		.describe(
			'ID of the environment for the volume (obtain from RAILWAY_SERVICE_LIST). Usually production environment.',
		),
	serviceId: z
		.string()
		.describe(
			'ID of the service to attach volume to (obtain from RAILWAY_SERVICE_LIST)',
		),
	mountPath: z
		.string()
		.describe(
			'Path where the volume should be mounted in the container (e.g., "/data", "/var/lib/postgresql/data", "/app/uploads"). Must be an absolute path.',
		),
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
	volumeId: z
		.string()
		.describe(
			'ID of the volume to update (obtain from RAILWAY_VOLUME_LIST response)',
		),
	name: z
		.string()
		.describe(
			'New descriptive name for the volume (e.g., "Database Storage", "App Data", "User Uploads"). Used for organization and identification.',
		),
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
	volumeId: z
		.string()
		.describe(
			'ID of the volume to delete (obtain from RAILWAY_VOLUME_LIST). WARNING: This permanently destroys all data stored in the volume.',
		),
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
			description:
				'List all persistent volumes in a project. Shows volume names, mount paths, attached services, and storage usage information.',
			bestFor: [
				'Viewing persistent storage configurations and usage',
				'Managing data volumes across services',
				'Auditing storage usage and costs',
				'Getting volume IDs for management operations',
			],
			notFor: [
				'Creating new volumes (use RAILWAY_VOLUME_CREATE)',
				'Viewing service-specific information (use RAILWAY_SERVICE_INFO)',
				'Managing temporary storage (volumes are persistent)',
			],
			relations: {
				prerequisites: ['RAILWAY_PROJECT_LIST'],
				nextSteps: ['RAILWAY_VOLUME_CREATE', 'RAILWAY_VOLUME_UPDATE'],
				related: ['RAILWAY_SERVICE_INFO', 'RAILWAY_SERVICE_LIST'],
			},
		}),
		schema: volumeListToolSchema,
		handler: volumeListToolHandler,
	},
	{
		name: 'RAILWAY_VOLUME_CREATE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Create a new persistent volume for a service. Volumes provide persistent storage that survives service restarts and deployments.',
			bestFor: [
				'Setting up database storage for data persistence',
				'Configuring file uploads and user-generated content storage',
				'Adding persistent data directories for applications',
				'Creating shared storage between service instances',
			],
			notFor: [
				'Temporary storage needs (use container filesystem)',
				'Static file hosting (consider CDN solutions)',
				'Memory caching (use Redis or in-memory solutions)',
				'Configuration files (use environment variables)',
			],
			relations: {
				prerequisites: ['RAILWAY_SERVICE_LIST'],
				nextSteps: ['RAILWAY_VOLUME_LIST', 'RAILWAY_SERVICE_RESTART'],
				related: ['RAILWAY_SERVICE_UPDATE', 'RAILWAY_TEMPLATE_DEPLOY'],
			},
		}),
		schema: volumeCreateToolSchema,
		handler: volumeCreateToolHandler,
	},
	{
		name: 'RAILWAY_VOLUME_UPDATE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Update a volume properties like its display name. Note: Mount path and size cannot be changed after creation.',
			bestFor: [
				'Renaming volumes for better organization and clarity',
				'Updating volume descriptions and metadata',
				'Volume management and documentation',
				'Improving volume identification in large projects',
			],
			notFor: [
				'Changing mount paths (requires recreation)',
				'Resizing volumes (not supported)',
				'Moving volumes between services (requires recreation)',
			],
			relations: {
				prerequisites: ['RAILWAY_VOLUME_LIST'],
				nextSteps: ['RAILWAY_VOLUME_LIST'],
				related: ['RAILWAY_VOLUME_CREATE'],
			},
		}),
		schema: volumeUpdateToolSchema,
		handler: volumeUpdateToolHandler,
	},
	{
		name: 'RAILWAY_VOLUME_DELETE',
		description: formatToolDescription({
			type: 'API',
			description:
				'Permanently delete a volume and ALL its data. WARNING: This action cannot be undone and will destroy all files and data stored in the volume.',
			bestFor: [
				'Removing unused storage to reduce costs',
				'Cleaning up obsolete data volumes',
				'Project cleanup and resource management',
				'Removing volumes from deleted services',
			],
			notFor: [
				'Temporary data removal (data is permanently lost)',
				'Production volumes without proper backup procedures',
				'Volumes with important data (backup externally first)',
				'Resizing volumes (not supported - recreate instead)',
			],
			relations: {
				prerequisites: ['RAILWAY_VOLUME_LIST'],
				related: ['RAILWAY_VOLUME_CREATE'],
			},
		}),
		schema: volumeDeleteToolSchema,
		handler: volumeDeleteToolHandler,
	},
];

export default allTools;

