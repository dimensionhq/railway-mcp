import { FastMCP, UserError } from 'fastmcp';
import { RailwayApiClient } from './api/api-client';
import { env } from './env';
import { logger } from './utils/logger';
import { allTools } from './tools';

interface RailwaySession extends Record<string, unknown> {
	railway: RailwayApiClient | null;
}
const server = new FastMCP<RailwaySession>({
	name: 'Railway MCP server',
	version: '1.0.0',
	authenticate: async (req) => {
		let railway: RailwayApiClient | null = null;
		try {
			const raw = req.headers['authorization'];
			const railwayToken = raw?.startsWith('Bearer ') ? raw.slice(7) : null;

			if (!railwayToken) {
				throw new UserError(
					'Provide a valid railway token to use this resource',
					{ accTokenSent: railwayToken },
				);
			}

			railway = new RailwayApiClient(railwayToken);
		} catch (error) {
			logger.error({
				message: 'Error while authenticating inside railway mcp server',
				error,
			});
		} finally {
			return {
				railway,
			};
		}
	},
	health: {
		enabled: true,
		message: 'ok',
		path: '/health',
		status: 200,
	},
});

// Register all tools
for (const tool of allTools) {
	server.addTool({
		name: tool.name,
		description: tool.description,
		parameters: tool.schema,
		execute: async (args, context) => {
			if (!context.session?.railway) {
				throw new Error('Railway session not available');
			}
			return tool.handler(args, context.session.railway);
		},
	});
}

server.start({
	transportType: 'httpStream',
	httpStream: {
		port: env.PORT,
		stateless: true,
	},
});

