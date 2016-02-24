"use strict";

module.exports = function(app, env, express) {
	let locations = env.get('server.static.locations', 'public');

	if (typeof locations === 'string') {
		locations = [locations];
	}

	const options = {
		etag: env.get('server.static.etag', true),
		extensions: env.get('server.static.extensions', false),
		lastModified: env.get('server.static.lastModified', true),
		maxAge: env.get('server.static.maxAge', '1d')
	};

	locations.forEach((location) => {
		app.use(express.static(location, options));
	});
};