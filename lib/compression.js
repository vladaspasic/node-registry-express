module.exports = function(app, env, compression) {
	app.use(compression({
		level: env.get('server.compression.level'),
		chunkSize: env.get('server.compression.chunkSize')
	}));
};