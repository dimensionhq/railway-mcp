import { BaseService } from './base.service.js';
import { TcpProxyCreateInput } from '@/utils/types.js';
import { buildOutput } from '@/utils/output.js';
import { RailwayApiClient } from '@/api/api-client.js';
import { UserError } from 'fastmcp';

export class TcpProxyService extends BaseService {
	public constructor(client: RailwayApiClient) {
		super(client);
	}

	/**
	 * Create a new TCP proxy for a service in a specific environment
	 * @param input TCP proxy creation parameters
	 */
	async createTcpProxy(input: TcpProxyCreateInput) {
		try {
			const tcpProxy = await this.client.tcpProxies.tcpProxyCreate(input);
			return buildOutput(tcpProxy);
		} catch (error) {
			throw new UserError('Error creating TCP proxy', {
				error,
			});
		}
	}

	/**
	 * Delete a TCP proxy by ID
	 * @param id TCP proxy ID to delete
	 */
	async deleteTcpProxy(id: string) {
		try {
			const result = await this.client.tcpProxies.tcpProxyDelete(id);

			if (!result) {
				throw new UserError(`Failed to delete TCP Proxy with ID ${id}`);
			}

			return buildOutput({ success: true });
		} catch (error) {
			if (error instanceof UserError) throw error;
			throw new UserError('Error deleting TCP proxy', {
				error,
			});
		}
	}

	/**
	 * List all TCP proxies for a service in a specific environment
	 * @param environmentId Railway environment ID
	 * @param serviceId Railway service ID
	 */
	async listTcpProxies(environmentId: string, serviceId: string) {
		try {
			const proxies = await this.client.tcpProxies.listTcpProxies(
				environmentId,
				serviceId,
			);

			return buildOutput(proxies);
		} catch (error) {
			throw new UserError('Error listing TCP proxies', {
				error,
			});
		}
	}
}

