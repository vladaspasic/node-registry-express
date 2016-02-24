module.exports = function(app, env, morgan) {
	app.use(morgan(env.get('server.morgan.pattern', 'dev')));
};