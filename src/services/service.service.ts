import { BaseService } from '@/services/base.service.js';
import { Service, ServiceInstance } from '@/utils/types.js';
import { buildOutput } from '@/utils/output.js';
import { RailwayApiClient } from '@/api/api-client.js';
import { UserError } from 'fastmcp';

export class ServiceService extends BaseService {
	public constructor(client: RailwayApiClient) {
		super(client);
	}

	async listServices(projectId: string) {
		try {
			const services = await this.client.services.listServices(projectId);
			return buildOutput(services);
		} catch (error) {
			throw new UserError('Error listing services', {
				error,
			});
		}
	}

	async getServiceInfo(
		projectId: string,
		serviceId: string,
		environmentId: string,
	) {
		try {
			const [serviceInstance, deployments] = await Promise.all([
				this.client.services.getServiceInstance(serviceId, environmentId),
				this.client.deployments.listDeployments({
					projectId,
					serviceId,
					environmentId,
					limit: 5,
				}),
			]);

			if (!serviceInstance) {
				throw new UserError('Service instance not found.');
			}

			return buildOutput({ serviceInstance, deployments });
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error getting service details', {
				error,
			});
		}
	}

	async createServiceFromRepo(projectId: string, repo: string, name?: string) {
		try {
			const service = await this.client.services.createService({
				projectId,
				name,
				source: {
					repo,
				},
			});

			return buildOutput(service);
		} catch (error) {
			throw new UserError('Error creating service', {
				error,
			});
		}
	}

	async createServiceFromImage(
		projectId: string,
		image: string,
		name?: string,
	) {
		try {
			const service = await this.client.services.createService({
				projectId,
				name,
				source: {
					image,
				},
			});

			return buildOutput(service);
		} catch (error) {
			throw new UserError('Error creating service', {
				error,
			});
		}
	}

	async updateService(
		projectId: string,
		serviceId: string,
		environmentId: string,
		config: Partial<ServiceInstance>,
	) {
		try {
			const updated = await this.client.services.updateServiceInstance(
				serviceId,
				environmentId,
				config,
			);
			if (!updated) {
				throw new UserError(
					`Failed to update service instance of ${serviceId} in environment ${environmentId}`,
				);
			}

			return buildOutput({ success: true });
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error updating service', {
				error,
			});
		}
	}

	async deleteService(projectId: string, serviceId: string) {
		try {
			await this.client.services.deleteService(serviceId);
			return buildOutput({ success: true });
		} catch (error) {
			throw new UserError('Error deleting service', {
				error,
			});
		}
	}

	async restartService(serviceId: string, environmentId: string) {
		try {
			await this.client.services.restartService(serviceId, environmentId);
			await new Promise((resolve) => setTimeout(resolve, 5000)); // TEMPORARY UNTIL WEBHOOKS ARE IMPLEMENTED: Wait for 5 seconds to ensure the service is restarted
			return buildOutput({ success: true });
		} catch (error) {
			throw new UserError('Error restarting service', {
				error,
			});
		}
	}
}

