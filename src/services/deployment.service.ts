import { RailwayApiClient } from '@/api/api-client.js';
import { BaseService } from '@/services/base.service.js';
import { DeploymentLog } from '@/utils/types.js';
import { buildOutput } from '@/utils/output.js';
import { UserError } from 'fastmcp';

export class DeploymentService extends BaseService {
	public constructor(client: RailwayApiClient) {
		super(client);
	}

	async listDeployments(
		projectId: string,
		serviceId: string,
		environmentId: string,
		limit: number = 5,
	) {
		try {
			const deployments = await this.client.deployments.listDeployments({
				projectId,
				serviceId,
				environmentId,
				limit,
			});

			return buildOutput(deployments);
		} catch (error) {
			throw new UserError('Error listing deployments', {
				error,
			});
		}
	}

	async triggerDeployment(
		projectId: string,
		serviceId: string,
		environmentId: string,
		commitSha?: string,
	) {
		try {
			// Wait for 5 seconds before triggering deployment
			// Seems like the LLMs like to call this function multiple times in combination
			// with the health check function and the list deployments function
			// so we need to wait a bit to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 5000));
			const deploymentId = await this.client.deployments.triggerDeployment({
				serviceId,
				environmentId,
				commitSha,
			});

			return buildOutput({ deploymentId });
		} catch (error) {
			throw new UserError('Error triggering deployment', {
				error,
			});
		}
	}

	async getDeploymentLogs(deploymentId: string, limit: number = 100) {
		try {
			// Wait for 5 seconds before fetching logs
			// Seems like the LLMs like to call this function multiple times in combination
			// with the health check function, so we need to wait a bit to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 5000));
			const buildLogs = await this.client.deployments.getBuildLogs(
				deploymentId,
				limit,
			);
			const deploymentLogs = await this.client.deployments.getDeploymentLogs(
				deploymentId,
				limit,
			);

			const logs: DeploymentLog[] = [
				...buildLogs.map((log) => ({ ...log, type: 'build' as const })),
				...deploymentLogs.map((log) => ({
					...log,
					type: 'deployment' as const,
				})),
			];

			return buildOutput(logs);
		} catch (error) {
			throw new UserError('Error fetching logs', {
				error,
			});
		}
	}

	async healthCheckDeployment(deploymentId: string) {
		try {
			// Wait for 5 seconds before checking status
			// Seems like the LLMs like to call this function multiple times in combination
			// with the health check function, so we need to wait a bit
			await new Promise((resolve) => setTimeout(resolve, 5000));
			const status = await this.client.deployments.healthCheckDeployment(
				deploymentId,
			);

			return buildOutput({ status });
		} catch (error) {
			throw new UserError('Error checking deployment health', {
				error,
			});
		}
	}
}

