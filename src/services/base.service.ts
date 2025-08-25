import { RailwayApiClient } from '@/api/api-client.js';

export class BaseService {
	protected client: RailwayApiClient;

	constructor(client: RailwayApiClient) {
		this.client = client;
	}
}
