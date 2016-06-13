"use strict";

const express = require('express');
const domain = require('domain');
const debug = require('debug')('node-registry-express');
const favicon = require('serve-favicon');
const crypto = require('crypto');
const utils = require('./utils');

const defaultSecret = crypto.randomBytes(20).toString('hex');

/**
 * Ensure that the Session secret key is generated and
 * assigned to the Express application instance.
 */
function ensureSecretKey(app, environment) {
	const secret = environment.get('server.cookies.secret', defaultSecret);

	if (typeof secret !== 'string') {
		throw new TypeError('Session secret must be a String, you passed ' + typeof secret);
	}

	debug('Setting Application Session Secret key `%s`', secret);
	
	app.set('secret', secret);
}

/**
 * Check if the Feature is enabled by checking the Environment.
 */
function isFeatureEnabled(env, key, isEnabledByDefault) {
	return env.get(`server.${key}.enabled`, isEnabledByDefault);
}

/**
 * Check and load the Express middleware if it is enabled
 */
function loadMiddleware(app, env, name, moduleName) {
	const middleware = utils.loadNpmModule(name, moduleName);

	debug('Loading Express middleware `%s`', moduleName || name);

	require(`./${name}`)(app, env, middleware);
}

function createExpressServer(project, container, environment) {
	const app = express();
	const port = environment.get('server.port', 8000);
	const title = environment.get('application.title', false);
	const faviconLocation = environment.get('server.favicon', false);

	app.set('trust proxy', environment.get('server.options.proxy', false));
	app.set('etag', environment.get('server.options.etag', 'weak'));
	app.set('jsonp callback name', environment.get('server.options.jsonp-callback', 'callback'));
	app.set('query parser', environment.get('server.options.query-parser', 'extended'));
	app.set('strict routing', environment.get('server.options.strict-routing', 'false'));

	if (typeof title === 'string') {
		app.set('title', title);
	}

	if (typeof faviconLocation === 'string') {
		app.use(favicon(faviconLocation));
	}

	// Assign error listeners
	app.use(function(req, res, next) {
		var reqDomain = domain.create();

		reqDomain.add(req);
		reqDomain.add(res);

		res.on('close', function() {
			reqDomain.dispose();
		});

		// Delegate the Error to the express error handler
		reqDomain.on('error', function(err) {
			next(err);
		});

		reqDomain.run(next);
	});

	ensureSecretKey(app, environment);

	// Setup the Server compression middleware
	if(isFeatureEnabled(environment, 'compression', true)) {
		loadMiddleware(app, environment, 'compression');
	}

	// Remove the Powered by Header
	if (!environment.get('server.poweredBy', false)) {
		app.disable('x-powered-by');
	}

	// Setup the View middleware
	if(isFeatureEnabled(environment, 'views', true)) {
		require('./views')(project, container, environment, app);
	}

	// Setup the CORS middleware
	if(isFeatureEnabled(environment, 'cors', false)) {
		loadMiddleware(app, environment, 'cors');
	}

	// Setup the Morgan request logger
	if(isFeatureEnabled(environment, 'morgan', false)) {
		loadMiddleware(app, environment, 'morgan');
	}

	// Setup the Morgan based Access Logs
	if(isFeatureEnabled(environment, 'accesslog', false)) {
		utils.loadNpmModule('accesslog', 'file-stream-rotator');
		loadMiddleware(app, environment, 'accesslog', 'morgan');
	}

	// Setup the express Body Parser middleware
	if (isFeatureEnabled(environment, 'parser'), true) {
		loadMiddleware(app, environment, 'body-parser');
	}

	// Setup the Express Cookie Parser middleware
	if (isFeatureEnabled(environment, 'cookies', false)) {
		loadMiddleware(app, environment, 'cookie-parser');
	}

	// Setup the Express Session middleware
	if (isFeatureEnabled(environment, 'session', false)) {
		utils.loadNpmModule('session', 'express-session');
		require('./express-session')(project, container, environment, app);
	}

	// Setup the Express to serve static resources
	if (isFeatureEnabled(environment, 'static', true)) {
		loadMiddleware(app, environment, 'static', 'express');
	}

	// Scan the application structure to find Routes and Filters
	require('./routes')(project, environment, app);

	let ssl = null;

	// Configure SSL if enabled
	if (isFeatureEnabled(environment, 'ssl', false)) {
		const key = environment.get('server.ss.key');
		const cert = environment.get('server.ss.cert');

		debug('Express HTTPS Server enabled');
		debug('SSL `key` => `%s`', key);
		debug('SSL `cert` => `%s`', cert);

		ssl = {
			key, cert
		};
	}

	return {
		listener: app,
		port,
		ssl
	};
}

module.exports = createExpressServer;