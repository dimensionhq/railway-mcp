import { BaseService } from './base.service.js';
import {
	ServiceDomainCreateInput,
	ServiceDomainUpdateInput,
} from '@/utils/types.js';
import { buildOutput } from '@/utils/output.js';
import { RailwayApiClient } from '@/api/api-client.js';
import { UserError } from 'fastmcp';

export class DomainService extends BaseService {
	public constructor(client: RailwayApiClient) {
		super(client);
	}

	/**
	 * Create a service domain for a service in a specific environment
	 * @param input Service domain creation parameters
	 */
	async createServiceDomain(input: ServiceDomainCreateInput) {
		try {
			// Check domain availability if a domain is specified
			if (input.domain) {
				const availability = await this.client.domains.serviceDomainAvailable(
					input.domain,
				);
				if (!availability.available) {
					throw new UserError(`Domain unavailable: ${availability.message}`);
				}
			}

			const domain = await this.client.domains.serviceDomainCreate(input);
			return buildOutput(domain);
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error creating domain', {
				error,
			});
		}
	}

	/**
	 * Delete a service domain by ID
	 * @param id Domain ID to delete
	 */
	async deleteServiceDomain(id: string) {
		try {
			const result = await this.client.domains.serviceDomainDelete(id);

			if (!result) {
				throw new UserError(`Failed to delete domain with ID ${id}`);
			}

			return buildOutput({ success: true });
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error deleting domain', {
				error,
			});
		}
	}

	/**
	 * Update a service domain's target port
	 * @param input Update parameters including domain ID and new target port
	 */
	async updateServiceDomain(input: ServiceDomainUpdateInput) {
		try {
			const result = await this.client.domains.serviceDomainUpdate(input);

			if (!result) {
				throw new UserError(`Failed to update domain with ID ${input.id}`);
			}

			return buildOutput({ success: true });
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error updating domain', {
				error,
			});
		}
	}

	/**
	 * List all domains (both service and custom) for a service in a specific environment
	 * @param projectId Railway project ID
	 * @param environmentId Railway environment ID
	 * @param serviceId Railway service ID
	 */
	async listDomains(
		projectId: string,
		environmentId: string,
		serviceId: string,
	) {
		try {
			const domains = await this.client.domains.domains(
				projectId,
				environmentId,
				serviceId,
			);

			return buildOutput(domains);
		} catch (error) {
			throw new UserError('Error listing domains', {
				error,
			});
		}
	}

	/**
	 * Check if a service domain is available
	 * @param domain Domain to check
	 */
	async checkDomainAvailability(domain: string) {
		try {
			const result = await this.client.domains.serviceDomainAvailable(domain);
			return buildOutput(result);
		} catch (error) {
			throw new UserError('Error checking domain availability', {
				error,
			});
		}
	}
}

