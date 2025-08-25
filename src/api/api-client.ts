import { BaseApiClient } from './base-client.js';
import { DeploymentRepository } from './repository/deployment.repo.js';
import { DomainRepository } from './repository/domain.repo.js';
import { ProjectRepository } from './repository/project.repo.js';
import { ServiceRepository } from './repository/service.repo.js';
import { TcpProxyRepository } from './repository/tcpProxy.repo.js';
import { TemplateRepository } from './repository/template.repo.js';
import { VariableRepository } from './repository/variable.repo.js';
import { VolumeRepository } from './repository/volume.repo.js';

export class RailwayApiClient extends BaseApiClient {
	public readonly deployments: DeploymentRepository;
	public readonly domains: DomainRepository;
	public readonly projects: ProjectRepository;
	public readonly services: ServiceRepository;
	public readonly tcpProxies: TcpProxyRepository;
	public readonly templates: TemplateRepository;
	public readonly variables: VariableRepository;
	public readonly volumes: VolumeRepository;

	public constructor(token: string) {
		super();
		this.token = token;
		this.deployments = new DeploymentRepository(this);
		this.domains = new DomainRepository(this);
		this.projects = new ProjectRepository(this);
		this.services = new ServiceRepository(this);
		this.tcpProxies = new TcpProxyRepository(this);
		this.templates = new TemplateRepository(this);
		this.variables = new VariableRepository(this);
		this.volumes = new VolumeRepository(this);
	}

	async request<T>(
		query: string,
		variables?: Record<string, unknown>,
	): Promise<T> {
		return super.request(query, variables);
	}

	getToken(): string | null {
		return super.getToken();
	}
}

