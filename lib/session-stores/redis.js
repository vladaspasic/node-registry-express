"use strict";

const session = require('express-session');
const debug = require('debug')('node-registry-express');
const utils = require('../utils');

module.exports = function(environment) {
	const RedisStore = utils.loadNpmModule('connect-redis')(session);
	const options = {
		url: environment.getRequired('server.session.store.url'),
		pass: environment.get('server.session.store.password'),
		prefix: environment.get('server.session.store.prefix'),
		ttl: environment.get('server.session.store.ttl'),
	};

	debug('Creating RedisStore with options', options);

	return new RedisStore(options);

};