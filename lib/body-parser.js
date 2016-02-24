module.exports = function(app, env, bodyParser) {
	app.use(bodyParser.json({
		inflate: env.get('server.parser.json.inflate', true),
		limit: env.get('server.parser.json.limit', '100kb'),
		strict: env.get('server.parser.json.strict', true),
		type: env.get('server.parser.json.type', 'application/json')
	}));

	app.use(bodyParser.urlencoded({
		extended: env.get('server.parser.urlencoded.extended', false),
		inflate: env.get('server.parser.urlencoded.inflate', true),
		limit: env.get('server.parser.urlencoded.limit', '100kb'),
		parameterLimit: env.get('server.parser.urlencoded.parameterLimit'),
		type: env.get('server.parser.urlencoded.type', 'application/x-www-form-urlencoded')
	}));
};