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
		assert('First argument must be an instance of Node', node instanceof Node);

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
		if(arguments.length === 1) {
			callback = name;
			name = '/';
		}

		assert('First argument must be either function or a Node name', typeof name === 'string');
		assert('Second argument must be function', typeof callback === 'function');

		let node;

		if(name === '/' || name === 'index') {
			node = this.node;
		} else {
			node = this.node.get(name);
		}

		const child = new RouterDSL(node, this);

		debug(`Creating Child RouterDSL '${name}'`);

		this.children.set(name, child);

		callback.call(child);

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
		this.children.forEach( (child) => child.destroy() );

		this.children.clear();

		this.parent = null;
		this.router = null;
		this.children = null;

		this.node.destroy();
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

		if(arguments.length === 1 && typeof path === 'string') {
			path = this.node.require(path);
		}

		const parameters = args.reduce((params, argument) => {
			if(typeof argument === 'string') {
				argument = this.node.require(path);
			}

			params.push(argument);

			return params;
		}, [ path ]);

		debug(`Assigning Router with arguments '${parameters}'`);

		router[method].apply(router, parameters);
	};
}

module.exports = RouterDSL;