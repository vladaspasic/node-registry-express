module.exports = function(app, env, cors) {
	app.use(cors({
		origin: env.get('server.cors.origin', '*'),
		methods: env.get('server.cors.methods', '*'),
		allowedHeaders: env.get('server.cors.allowedHeaders', '*'),
		exposedHeaders: env.get('server.cors.exposedHeaders', '*'),
		credentials: env.get('server.cors.credentials', false),
		maxAge: env.get('server.cors.maxAge', '3600')
	}));
};