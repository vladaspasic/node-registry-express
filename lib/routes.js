"use strict";

const fs = require('fs');
const path = require('path');
const express = require('express');
const debug = require('debug')('node-registry-express');

/**
 * Travers through the directory in search for routes
 * and filter files.
 */
function traverse(baseDir, ancestors, current, callback) {
	const location = path.join(baseDir, ancestors, current);

	let stats;

	try {
		stats = fs.statSync(location);
	} catch(e) {
		debug('Could not Scan Directory %s', location, e);
		return;
	}

	if (stats.isDirectory()) {
		ancestors = ancestors ? path.join(ancestors, current) : current;

		fs.readdirSync(location).forEach((child) => {
			traverse(baseDir, ancestors, child, callback);
		});
	}

	if (stats.isFile()) {
		const fileLocation = path.join(baseDir, ancestors, current);

		if (canHandleFile(fileLocation)) {
			callback(fileLocation, ancestors, current);
		}
	}
}

/**
 * Generate a Route handler.
 */
function routeHandler(filters, app) {
	return function createController(location, ancestors, current) {
		const filename = path.basename(current, path.extname(current));
		const controller = require(location);

		if (typeof controller === 'function' && controller.length < 3) {
			let mountpath = ancestors ? ancestors.split(path.sep) : [];

			if (filename !== 'index') {
				mountpath.push(filename);
			}

			mountpath = '/' + mountpath.join('/');

			const router = new express.Router(mountpath);
			controller(router, filters);

			debug('Mounting Router with path `%s`', mountpath);

			app.use(mountpath, router);
		}
	};
}

/**
 * Generate a Filter handler.
 */
function filterHandler(filters) {
	return function createFilter(location, ancestors, current) {
		const filename = path.basename(current, path.extname(current));
		const filter = require(location);

		if (typeof filter === 'function' && filter.length === 3) {
			debug('Loaded filter with name `%s`', filename);
			filters[filename] = filter;
		}
	};
}

/**
 * Check if the File could be a controller or filter
 * javascript file.
 * 
 */
function canHandleFile(file) {
	const ext = path.extname(file);

	// Omit hidden files
	if (path.basename(file, ext)[0] === '.') {
		return false;
	}

	try {
		file = ext ? file.slice(0, -ext.length) : file;
		require.resolve(file);
		return true;
	} catch (err) {
		return false;
	}
}

/**
 * Resolve the folder location where to scan for files
 * from the environment.
 */
function locationFor(project, environment, type) {
	const location = environment.get(`server.${type}.location`, type);
	return path.join(project.root, location);
}

module.exports = function(project, environment, app) {
	const filters = {};

	debug('Scanning Project to find Filters and Controllers');

	traverse(locationFor(project, environment, 'filters'), '', '', filterHandler(filters));
	traverse(locationFor(project, environment, 'routes'), '', '', routeHandler(filters, app));
};