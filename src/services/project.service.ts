import { BaseService } from '@/services/base.service.js';
import { buildOutput } from '@/utils/output.js';
import { RailwayApiClient } from '@/api/api-client.js';
import { UserError } from 'fastmcp';

export class ProjectService extends BaseService {
	public constructor(client: RailwayApiClient) {
		super(client);
	}

	async listProjects() {
		try {
			const projects = await this.client.projects.listProjects();
			return buildOutput(projects);
		} catch (error) {
			throw new UserError('Error listing projects', {
				error,
			});
		}
	}

	async getProject(projectId: string) {
		try {
			const project = await this.client.projects.getProject(projectId);

			if (!project) {
				throw new UserError('Project not found.');
			}

			const environments =
				project.environments?.edges?.map((edge) => edge.node) || [];
			const services = project.services?.edges?.map((edge) => edge.node) || [];

			return buildOutput({ project, environments, services });
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error getting project details', {
				error,
			});
		}
	}

	async createProject(name: string, teamId?: string) {
		try {
			const project = await this.client.projects.createProject(name, teamId);
			return buildOutput(project);
		} catch (error) {
			throw new UserError('Error creating project', {
				error,
			});
		}
	}

	async deleteProject(projectId: string) {
		try {
			await this.client.projects.deleteProject(projectId);
			return buildOutput({ success: true });
		} catch (error) {
			throw new UserError('Error deleting project', {
				error,
			});
		}
	}

	async listEnvironments(projectId: string) {
		try {
			const environments = await this.client.projects.listEnvironments(
				projectId,
			);
			return buildOutput(environments);
		} catch (error) {
			throw new UserError('Error listing environments', {
				error,
			});
		}
	}
}

