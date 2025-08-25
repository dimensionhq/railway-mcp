import { BaseService } from '@/services/base.service.js';
import { buildOutput } from '@/utils/output.js';
import { RailwayApiClient } from '@/api/api-client.js';
import { UserError } from 'fastmcp';

export class VariableService extends BaseService {
	public constructor(client: RailwayApiClient) {
		super(client);
	}

	async listVariables(
		projectId: string,
		environmentId: string,
		serviceId?: string,
	) {
		try {
			const variables = await this.client.variables.getVariables(
				projectId,
				environmentId,
				serviceId,
			);

			return buildOutput(variables);
		} catch (error) {
			throw new UserError('Error listing variables', {
				error,
			});
		}
	}

	async upsertVariable(
		projectId: string,
		environmentId: string,
		name: string,
		value: string,
		serviceId?: string,
	) {
		try {
			await this.client.variables.upsertVariable({
				projectId,
				environmentId,
				name,
				value,
				serviceId,
			});

			return buildOutput({ success: true });
		} catch (error) {
			throw new UserError('Error setting variable', {
				error,
			});
		}
	}

	async deleteVariable(
		projectId: string,
		environmentId: string,
		name: string,
		serviceId?: string,
	) {
		try {
			await this.client.variables.deleteVariable({
				projectId,
				environmentId,
				name,
				serviceId,
			});

			return buildOutput({ success: true });
		} catch (error) {
			throw new UserError('Error deleting variable', {
				error,
			});
		}
	}

	async bulkUpsertVariables(
		projectId: string,
		environmentId: string,
		variables: Record<string, string>,
		serviceId?: string,
	) {
		try {
			const inputs = Object.entries(variables).map(([name, value]) => ({
				projectId,
				environmentId,
				name,
				value,
				serviceId,
			}));

			await this.client.variables.upsertVariables(inputs);

			return buildOutput({ updated: inputs.length });
		} catch (error) {
			throw new UserError('Error updating variables', {
				error,
			});
		}
	}

	async copyVariables(
		projectId: string,
		sourceEnvironmentId: string,
		targetEnvironmentId: string,
		serviceId?: string,
		overwrite: boolean = false,
	) {
		try {
			// Get variables from source environment
			const sourceVars = await this.client.variables.getVariables(
				projectId,
				sourceEnvironmentId,
				serviceId,
			);

			if (Object.keys(sourceVars).length === 0) {
				return buildOutput({ copied: 0 });
			}

			// Get variables from target environment
			const targetVars = await this.client.variables.getVariables(
				projectId,
				targetEnvironmentId,
				serviceId,
			);

			// If not overwriting, filter out variables that already exist in target
			const varsToSet = overwrite
				? sourceVars
				: Object.fromEntries(
						Object.entries(sourceVars).filter(([key]) => !(key in targetVars)),
				  );

			if (Object.keys(varsToSet).length === 0) {
				return buildOutput({ copied: 0 });
			}

			// Bulk update the variables
			await this.bulkUpsertVariables(
				projectId,
				targetEnvironmentId,
				varsToSet,
				serviceId,
			);

			return buildOutput({ copied: Object.keys(varsToSet).length });
		} catch (error) {
			throw new UserError('Error copying variables', {
				error,
			});
		}
	}
}

