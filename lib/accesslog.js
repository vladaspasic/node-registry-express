"use strict";

const FileStreamRotator = require('file-stream-rotator');
const fs = require('fs');
const path = require('path');

/**
 * Create the Access log directory
 */
function getAccessLogDirectory(environment) {
	let directory = environment.get('server.accesslog.directory', 'logs');

	if (!path.isAbsolute(directory)) {
		path.join(process.cwd(), directory);
	}

	try {
		fs.accessSync(directory);
	} catch (err) {
		fs.mkdirSync(directory);
	}

	return directory;
}

module.exports = function(app, env, morgan) {
	const directory = getAccessLogDirectory();
	const pattern = env.get('server.accesslog.pattern', 'common');
	const filename = env.get('server.accesslog.filename', 'access-log-%DATE%.log');

	// create a rotating write stream
	const stream = FileStreamRotator.getStream({
		filename: path.join(directory, filename),
		frequency: env.get('server.accesslog.frequency', 'daily'),
		date_format: env.get('server.accesslog.date_format', 'YYYY-MM-DD'),
		verbose: false
	});

	app.use(morgan(pattern, {
		stream
	}));
};