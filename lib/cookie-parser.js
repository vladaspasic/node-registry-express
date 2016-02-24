"use strict";

module.exports = function(app, env, cookie) {
	const secret = app.get('secret');

	app.use(cookie(secret, {
		path: env.get('server.cookies.path'),
		domain: env.get('server.cookies.domain'),
		expires: env.get('server.cookies.expires'),
		maxAge: env.get('server.cookies.maxAge'),
		secure: env.get('server.cookies.secure'),
		httpOnly: env.get('server.cookies.httpOnly'),
		firstPartyOnly: env.get('server.cookies.firstPartyOnly')
	}));
};