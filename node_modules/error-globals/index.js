"use strict";

var factory = require('./lib/error'),
	defaults = require('./lib/defaults');

/**
 * Exposes the default Errors to the global scope.
 */
module.exports.expose = function() {
	Object.keys(defaults).forEach(function(key) {
		define(global, key, defaults[key]);
	});
};

/**
 * Create a new Error
 *
 * @param  {String} name    Name for the Error
 * @param  {Object} options Options for the Error object
 * @return {Error}          A new error class
 */
module.exports.create = function(name, options) {
	return factory.extend(name, options);
};

/**
 * Expose Default Errors to the Module
 */
Object.keys(defaults).forEach(function(key) {
	define(module.exports, key, defaults[key]);
});

/**
 * Defines the Error property to a target Object, making it read-only,
 * not condifurable and non enumerable.
 *
 * @param  {Object} target Target object which will have the property
 * @param  {String} name   Name of the property
 * @param  {Object} value  Value of the property
 */
function define(target, name, value) {
	Object.defineProperty(target, name, {
		value: value,
		enumerable: false,
		configurable: false,
		writable: false
	});
}
