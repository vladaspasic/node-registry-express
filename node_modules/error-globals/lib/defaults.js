"use strict";

var factory = require('./error'),
	codes = require('http').STATUS_CODES;

// Default custom Errors
var errors = {
	EvalError: factory.extend('EvalError'),
	RangeError: factory.extend('RangeError'),
	ReferenceError: factory.extend('ReferenceError'),
	SyntaxError: factory.extend('SyntaxError'),
	TypeError: factory.extend('TypeError'),
	UriError: factory.extend('UriError'),
	RuntimeError: factory.extend('RuntimeError'),
	IllegalState: factory.extend('IllegalState'),
	DatabaseError: factory.extend('DatabaseError'),
	WorkerError: factory.extend('WorkerError'),
	ValidationError: factory.extend('ValidationError', {
		logLevel: 'warn'
	})
};

// For each defined error code in the built-in list of statuses, create a
// corresponding error shortcut and export it
Object.keys(codes).forEach(function(code, index, list) {
	if (code >= 400) {
		var name = codes[code];
		var key = name.replace(/( [a-z])/g, function($1) {
			return $1.toUpperCase();
		}).replace(/Error$/, '').replace(/[^a-z]/gi, '') + 'Error';

		this[key] = factory.extend(name, {
			statusCode: code,
			logLevel: code < 500 ? 'warn' : 'error'
		});
	}
}.bind(errors));

module.exports = errors;