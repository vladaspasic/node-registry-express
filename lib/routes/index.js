"use strict";

const path = require('path');
const Node = require('./node');
const RouterDSL = require('./dsl');
const debug = require('debug')('node-registry-express:routes');

/**
 * Resolve the folder location where to scan for files
 * from the environment.
 */
function locationFor(project, environment, type) {
	const location = environment.get(`server.${type}.location`, type);
	return path.join(project.root, location);
}

module.exports = function(project, environment, app) {
	const location = locationFor(project, environment, 'routes');

	debug(`Scanning through ${location} to find Router and Route mappings...`);

	const node = new Node(location);
	const dsl = new RouterDSL(node);
	
	node.traverse();

	let router;

	if(node.files.has('index')) {
		router = node.require();
	} else if(node.files.has('router')) {
		router = node.require('router');
	} else {
		throw new Error(`Can not find a Router in '${location}'. ` +
			`Router must be named either 'index.js' or 'router.js' and should export a function.`);
	}

	dsl.route(router);

	app.use(dsl.router);

	dsl.destroy();
};