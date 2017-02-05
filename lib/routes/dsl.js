"use strict";

const assert = require('assert');
const methods = require('methods');
const Node = require('./node');
const Router = require('express').Router;
const debug = require('debug')('node-registry-express:routes-dsl');

/**
 * Router DSL used to create Route mappings for
 * Express Router.
 *
 * @class RouterDSL
 * @constructor
 * @param {Node}      node
 * @param {RouterDSL} parent
 */
class RouterDSL {

	constructor(node, parent) {
		assert(node instanceof Node, 'First argument must be an instance of Node');

		this.node = node;
		this.parent = parent;
		this.children = new Map();
		this.router = new Router();

		methods.concat('all', 'use').forEach((method) => {
			const name = method.toLowerCase();

			Object.defineProperty(this, name, {
				value: giveRouterMehtod(name),
				enumerable: false,
				configurable: false
			});
		});
	}

	/**
	 * Creates a child instance of RouterDSL
	 *
	 * @method route
	 * @param  {String}   name
	 * @param  {Function} callback
	 * @return {RouterDSL}
	 */
	route(name, callback) {
		if (arguments.length === 1) {
			callback = name;
		}

		// If name is a function, the mount path is `/`
		if (typeof name === 'function') {
			name = '/';
		}

		assert(typeof name === 'string', 'First argument must be either function or a Node name');

		let node;
		let handler;

		// If callback is a string, require the handler from the Node tree
		if (typeof callback === 'string') {
			handler = this.node.require(callback);

			node = resolveNode(this, name);

			// If there is no matching node for name, try for the callback
			if (!node) {
				node = resolveNode(this, callback);
			}
		} else {
			handler = callback;
			node = resolveNode(this, name);
		}

		assert(typeof handler === 'function', 'Second argument must be either function or a Node file name');
		assert(node instanceof Node, `Can not find child router node for path: ${name}`);

		const child = new RouterDSL(node, this);

		debug(`Creating Child RouterDSL '${name}'`);

		this.children.set(name, child);

		handler.call(child);

		mount(this, name, child);

		return child;
	}

	/**
	 * Destroys the RouterDSL instace by cleaning all the
	 * child Routers
	 *
	 * @method destroy
	 */
	destroy() {
		this.children.forEach((child) => child.destroy());

		this.children.clear();

		this.parent = null;
		this.router = null;
		this.children = null;

		this.node.destroy();
	}

}

/**
 * Tries to resolve the Node from the folder name, when node
 * can not be resolved, `null` is returned.
 * 
 * @param  {RouterDSL} dsl
 * @param  {String}    name
 * @return {Node}
 */
function resolveNode(dsl, name) {
	if (name === '/' || name === 'index') {
		return dsl.node;
	} else if (dsl.node.has(name)) {
		return dsl.node.get(name);
	} else {
		return null;
	}
}

/**
 * Mounts the child express Router to parent Router.
 * 
 * @param  {RouterDSL} parent
 * @param  {String}    name
 * @param  {RouterDSL} child
 */
function mount(parent, name, child) {
	const path = name.startsWith('/') ? name : '/' + name;

	debug(`Mounting child router with '${path}'`);

	parent.router.use(path, child.router);
}

/**
 * Generates a Function that assigns the routes to Express Router.
 * 
 * @param  {String} method
 * @return {Function}
 */
function giveRouterMehtod(method) {
	return function() {
		const args = Array.prototype.slice.call(arguments);
		const router = this.router;

		let path = args.shift();

		if (arguments.length === 1 && typeof path === 'string') {
			path = this.node.require(path);
		}

		const parameters = args.reduce((params, argument) => {
			if (typeof argument === 'string') {
				argument = this.node.require(argument);
			}

			params.push(argument);

			return params;
		}, [path]);

		debug(`Assigning Router with arguments '${parameters}'`);

		router[method].apply(router, parameters);
	};
}

module.exports = RouterDSL;