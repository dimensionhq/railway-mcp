module.exports = {
	apps: [
		{
			name: 'railway-mcp-server',
			script: './dist/index.js',
			instances: 1, // 1 instance per server (9 servers total)
			exec_mode: 'fork',

			// Auto-restart settings
			autorestart: true,
			watch: false,
			max_memory_restart: '500M',

			// Crash loop protection
			min_uptime: '10s', // Must run 10s to be considered stable
			max_restarts: 10, // Max 10 restarts within 1 min
			restart_delay: 4000, // 4s delay between restarts

			// Graceful shutdown
			kill_timeout: 5000, // 5s to finish requests before force kill
		},
	],
};

