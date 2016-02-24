"use strict";

const session = require('express-session');
const debug = require('debug')('node-registry-express');
const utils = require('../utils');

module.exports = function(environment) {
	const MongoStore = utils.loadNpmModule('connect-mongo')(session);
	const options = {
		url: environment.getRequired('server.session.store.url'),
		collection: environment.get('server.session.store.collection'),
		ttl: environment.get('server.session.store.ttl'),
	};

	debug('Creating MongoStore with options', options);

	return new MongoStore(options);

};