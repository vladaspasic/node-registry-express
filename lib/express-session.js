"use strict";

const session = require('express-session');
const debug = require('debug')('node-registry-express');

/**
 * Checks if the dependency is loaded.
 *
 * If a message string is passed, an exception would be thrown.
 */
function loadDependency(name) {
	try {
		return require(name);
	} catch (e) {
		debug('Could not find Session Store for `%s`', name, e);
	}
}

function lookup(container, name) {
	if (container.isRegistered(name)) {
		return container.lookup(name);
	}

	return false;
}

module.exports = function(project, container, env, app) {
	const secret = app.get('secret');
	const type = env.get('server.session.store.type', false);

	let store = null;

	if (typeof type === 'string') {
		debug('Setting up Session middleware with Store `%s`.', type);

		store = lookup(container, `session:${store}`);

		if (!store) {
			store = lookup(container, `session-store:${type}`);
		}

		if (!store) {
			store = loadDependency(`./session-stores/${type}`);
			store = store && store(env);
		}

		if (!store) {
			store = loadDependency(`${type}`);
		}

		if (!store) {
			throw new Error(`Could not load Session Store '${type}'.`);
		}
	}

	const options = {
		secret,
		name: env.get('server.session.name'),
		proxy: env.get('server.session.proxy', undefined),
		resave: env.get('server.session.resave', false),
		rolling: env.get('server.session.rolling', false),
		saveUninitialized: env.get('server.session.saveUninitialized', false)

	};

	if(store) {
		options.store = store;
	}

	debug('Setting up Express Session with options', options);

	app.use(session(options));
};