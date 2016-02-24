"use strict";

const consolidate = require('consolidate');
const path = require('path');
const debug = require('debug')('node-registry-express');

function lookup(container, name) {
	if (container.isRegistered(name)) {
		return container.lookup(name);
	}

	return false;
}

/**
 * Setup view engine from the User defined Module
 */
function setupUserDefinedEngine(view, env, app) {
	let handler;

	if (typeof view === 'function') {
		handler = view;
	} else if (typeof view.configure === 'function') {
		handler = view.configure;
	}

	if (handler) {
		debug('Invoking custom View module engine handler.');

		handler(app, env, consolidate);
	} else {
		throw new Error('When defining a `view` or `express:view` module, you must ' +
			'define it as function or expose a `configure` method.');
	}
}

/**
 * Setup default view engine using the Environment configuration
 * and Express `consolidate` module.
 */
function setupDefaultViewEngine(project, env, app) {
	const engine = env.get('server.views.engine', 'handlebars');
	const views = env.get('server.views.location', false);

	debug('Setting Express View engine to `%s`', engine);

	app.engine(engine, consolidate[engine]);
	app.set('view engine', engine);

	if (views) {
		const location = path.join(project.root, views);
		debug('Setting Express View location to `%s`', location);

		app.set('views', location);
	}
}

module.exports = function(project, container, env, app) {
	const view = lookup(container, 'view') || lookup(container, 'express:view');

	// Add Request and Response to be accessible from the template
	app.use((req, res, next) => {
		const locals = res.locals || {};

		locals.req = req;
		locals.res = res;

		res.locals = locals;

		next();
	});

	if (view) {
		setupUserDefinedEngine(view, env, app);
	} else {
		setupDefaultViewEngine(project, env, app);
	}

};