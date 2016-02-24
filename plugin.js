const errors = require('error-globals');
const express = require('./lib/express');

module.exports = {

	server(project, container, environment) {
		// Expose HTTP Errors to the global scope
		if (environment.get('application.globalErrors'), false) {
			errors.expose();
		}

		return express(project, container, environment);
	}
};