#!/usr/bin/env node

import { railwayClient } from '@/api/api-client.js';
import { registerAllTools } from '@/tools/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { captureError, initializeSentry, setupSentryExpressErrorHandler } from '@/utils/sentry.js';
import express, { Request, Response } from 'express';
import 'dotenv/config';

// Initialize Sentry early
initializeSentry();

const main = async () => {
	await railwayClient.initialize();

	const app = express();

	app.use(express.json());

	app.get('/health', (_req: Request, res: Response) => {
		res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
	});

	app.post('/mcp', async (req: Request, res: Response) => {
		// In stateless mode, create a new instance of transport and server for each request
		// to ensure complete isolation. A single instance would cause request ID collisions
		// when multiple clients connect concurrently.

		try {
			// Extract access token from headers
			const accessToken =
				req.headers.authorization?.replace('Bearer ', '') ||
				(req.headers['x-railway-token'] as string) ||
				(req.headers['railway-token'] as string) ||
				process.env.DEFAULT_ACCESS_TOKEN;
			if (!accessToken) {
				return res.status(401).json({
					jsonrpc: '2.0',
					error: {
						code: -32001,
						message:
							'Access token required. Provide via Authorization header, x-railway-token header, or DEFAULT_ACCESS_TOKEN env var.',
					},
					id: null,
				});
			}

			// Set the token for this specific request
			await railwayClient.setToken(accessToken);

			const server = new McpServer({
				name: 'railway-tools',
				version: '1.0.0',
			});

			// Register resources (these are always available)
			registerAllTools(server);

			const transport: StreamableHTTPServerTransport =
				new StreamableHTTPServerTransport({
					sessionIdGenerator: undefined,
				});
			res.on('close', () => {
				if (process.env.NODE_ENV === 'development') {
					console.log('Request closed');
				}
				transport.close();
				server.close();
			});
			await server.connect(transport);
			await transport.handleRequest(req, res, req.body);
		} catch (error) {
			console.error('Error handling MCP request:', error);
			captureError(error as Error, { 
				endpoint: '/mcp',
				method: 'POST',
				headers: req.headers
			});
			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: '2.0',
					error: {
						code: -32603,
						message: 'Internal server error',
					},
					id: null,
				});
			}
		}
	});

	// SSE notifications not supported in stateless mode
	app.get('/mcp', async (req: Request, res: Response) => {
		if (process.env.NODE_ENV === 'development') {
			console.log('Received GET MCP request');
		}
		res.status(405).json({
			jsonrpc: '2.0',
			error: {
				code: -32000,
				message: 'Method not allowed. Use POST for MCP requests.',
			},
			id: null,
		});
	});

	// Session termination not needed in stateless mode
	app.delete('/mcp', async (req: Request, res: Response) => {
		if (process.env.NODE_ENV === 'development') {
			console.log('Received DELETE MCP request');
		}
		res.status(405).json({
			jsonrpc: '2.0',
			error: {
				code: -32000,
				message: 'Method not allowed. Use POST for MCP requests.',
			},
			id: null,
		});
	});

	// Setup Sentry Express error handler (must be after all routes)
	setupSentryExpressErrorHandler(app);

	// Start the server
	const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

	app.listen(PORT, (error) => {
		if (error) {
			console.error('Failed to start server:', error);
			captureError(error, { event: 'server_startup_failed' });
			process.exit(1);
		}
		console.log(
			`MCP Stateless Streamable HTTP Server listening on port ${PORT}`,
		);
	});
};

main().catch((error) => {
	console.error('Fatal error in main():', error);
	captureError(error, { event: 'main_fatal_error' });
	process.exit(1);
});

