import databaseTools from './database.tool.js';
import deploymentTools from './deployment.tool.js';
import domainTools from './domain.tool.js';
import projectTools from './project.tool.js';
import serviceTools from './service.tool.js';
import tcpProxyTools from './tcpProxy.tool.js';
import templateTools from './template.tool.js';
import variableTools from './variable.tool.js';
import volumeTools from './volume.tool.js';

import { RailwayTool } from '@/utils/tools.js';

export const allTools: RailwayTool[] = [
	...databaseTools,
	...deploymentTools,
	...domainTools,
	...projectTools,
	...serviceTools,
	...tcpProxyTools,
	...variableTools,
	...volumeTools,
	...templateTools,
];

