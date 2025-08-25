import { BaseService } from '@/services/base.service.js';
import { buildOutput } from '@/utils/output.js';
import Fuse from 'fuse.js';
import { RailwayApiClient } from '@/api/api-client.js';
import { UserError } from 'fastmcp';

export class TemplatesService extends BaseService {
	public constructor(client: RailwayApiClient) {
		super(client);
	}

	async listTemplates(searchQuery?: string) {
		try {
			let templates = await this.client.templates.listTemplates();

			// If search query is provided, filter templates by name and description
			if (searchQuery) {
				const fuse = new Fuse(templates, {
					keys: [
						{
							name: 'name',
							weight: 3,
						},
						{
							name: 'description',
							weight: 2,
						},
					],
					threshold: 0.3,
				});
				templates = fuse.search(searchQuery).map((result) => result.item);
			}

			// Group templates by category
			const categorizedTemplates = templates.reduce((acc, template) => {
				if (!acc[template.category]) {
					acc[template.category] = [];
				}
				acc[template.category].push(template);
				return acc;
			}, {} as Record<string, typeof templates>);

			return buildOutput(categorizedTemplates);
		} catch (error) {
			throw new UserError('Error listing templates', {
				error,
			});
		}
	}

	async deployTemplate(
		projectId: string,
		templateId: string,
		environmentId: string,
		teamId?: string,
	) {
		try {
			// Get the template
			const templates = await this.client.templates.listTemplates();
			const template = templates.find((t) => t.id === templateId);

			if (!template) {
				throw new UserError(`Template not found: ${templateId}`);
			}

			// Deploy the template
			const response = await this.client.templates.deployTemplate(
				environmentId,
				projectId,
				template.serializedConfig,
				templateId,
				teamId,
			);

			return buildOutput(response);
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error creating service from template', {
				error,
			});
		}
	}

	async getWorkflowStatus(workflowId: string) {
		try {
			const response = await this.client.templates.getWorkflowStatus(
				workflowId,
			);

			if (response.error) {
				throw new UserError(
					`Error with workflow ${workflowId}: ${response.error}`,
				);
			}

			return buildOutput(response);
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error getting workflow status', {
				error,
			});
		}
	}
}

