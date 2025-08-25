import { RailwayApiClient } from '@/api/api-client.js';
import { buildOutput } from '@/utils/output.js';
import { BaseService } from './base.service.js';
import { UserError } from 'fastmcp';

export class VolumeService extends BaseService {
	constructor(client: RailwayApiClient) {
		super(client);
	}

	/**
	 * List all volumes in a project
	 *
	 * @param projectId ID of the project
	 */
	async listVolumes(projectId: string) {
		try {
			const volumes = await this.client.volumes.listVolumes(projectId);
			return buildOutput(volumes);
		} catch (error) {
			throw new UserError('Error listing volumes', {
				error,
			});
		}
	}

	/**
	 * Create a new volume in a project
	 *
	 * @param projectId ID of the project where the volume will be created
	 * @param serviceId ID of the service to attach the volume to
	 * @param environmentId ID of the environment to create the volume in
	 * @param mountPath Path to mount the volume on
	 */
	async createVolume(
		projectId: string,
		serviceId: string,
		environmentId: string,
		mountPath: string,
	) {
		try {
			const input = { projectId, serviceId, environmentId, mountPath };

			const volume = await this.client.volumes.createVolume(input);
			if (!volume) {
				throw new UserError(
					`Failed to create volume for ${serviceId} in environment ${environmentId}`,
				);
			}

			return buildOutput(volume);
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error creating volume', {
				error,
			});
		}
	}

	/**
	 * Update a volume
	 *
	 * @param volumeId ID of the volume to update
	 * @param name New name for the volume
	 */
	async updateVolume(volumeId: string, name: string) {
		try {
			const input = { name };
			const volume = await this.client.volumes.updateVolume(volumeId, input);

			return buildOutput(volume);
		} catch (error) {
			throw new UserError('Error updating volume', {
				error,
			});
		}
	}

	/**
	 * Delete a volume
	 *
	 * @param volumeId ID of the volume to delete
	 */
	async deleteVolume(volumeId: string) {
		try {
			const success = await this.client.volumes.deleteVolume(volumeId);

			if (!success) {
				throw new UserError('Failed to delete volume');
			}

			return buildOutput({ success });
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error deleting volume', {
				error,
			});
		}
	}
}

