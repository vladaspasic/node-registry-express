"use strict";

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const debug = require('debug')('node-registry-express:routes-node');

/**
 * Class that represents a folder Node that contains
 * subnodes(subfolders) and files.
 *
 * @class Node
 * @constructor
 * @param {String} location
 * @param {Node}   parent
 */
class Node {

	constructor(location, parent) {
		this.location = location;
		this.children = new Map();
		this.files = new Map();
		this.parent = parent;
	}

	/**
	 * Returns a child Node instance with given folder
	 * name.
	 *
	 * If the child Node does not exists, an Error is raised.
	 *
	 * @method get
	 * @param  {String} key
	 * @return {Node}
	 */
	get(key) {
		assert(typeof key === 'string', 'Key must be a string');

		if (this.children.has(key)) {
			return this.children.get(key);
		}

		throw new Error(`No node with key '${key}' can be found in ${this.location}`);
	}

	/**
	 * Requres a Node.js module for a given file name.
	 *
	 * If no arguments are present, `index.js` file is required.
	 *
	 * If the file does not exists, an Error is raised.
	 *
	 * @method require
	 * @param  {String} name
	 * @return {*}
	 */
	require(name) {
		if(arguments.length === 0) {
			return this.require('index');
		}

		assert(typeof name === 'string', 'File name must be a string');

		if (this.files.has(name)) {
			const location = this.files.get(name);
			return require(location);
		}

		if(this.children.has(name)) {
			const child = this.get(name);
			return child.require();
		}

		throw new Error(`No file or child Node with name '${name}' can be found in ${this.location}`);
	}

	/**
	 * Creates a new child Node for given folder location
	 * and name.
	 *
	 * @method child
	 * @param  {String} location
	 * @param  {String} name
	 * @return {Node}
	 */
	child(location, name) {
		assert(!this._isDestroyed, 'Can not create a child Node on a destroyed Node');

		const child = new Node(location, this);

		debug(`Created Child with name ${name} in ${this.location}`);

		this.children.set(name, child);
		child.traverse();

		return child;
	}

	/**
	 * Traverses through the file system in search for file
	 * and subfolders.
	 *
	 * @method traverse
	 */
	traverse() {
		assert(!this._isDestroyed, 'Can not traverse through a destroyed Node');

		const location = path.resolve(this.location);
		const stats = getStats(location);

		if(stats) {
			assert(`Location ${location} must be a directory.`, stats.isDirectory());

			handleDirectory(this, location);
		}
	}

	/**
	 * Destroys the Node instace by cleaning all the
	 * child Nodes and Files
	 *
	 * @method destroy
	 */
	destroy() {
		if(this._isDestroyed) {
			return;
		}

		this.children.forEach( (child) => child.destroy() );
		
		this.children.clear();
		this.files.clear();

		this.location = null;
		this.parent = null;
		this.children = null;
		this.files = null;

		this._isDestroyed = true;
	}

}

/**
 * Try to get the File Stats for this location or null.
 */
function getStats(location) {
	try {
		return fs.statSync(location);
	} catch (e) {
		debug('Could not resolve file stats for `%s`', location, e);
		return null;
	}
}

/**
 * Scans the directory in search for files and folders.
 * 
 * @param  {Node}   node
 * @param  {String} directory
 */
function handleDirectory(node, directory) {

	debug(`Reading through directory ${node.location}`);

	fs.readdirSync(directory).forEach((file) => {
		const location = path.join(directory, file);
		const stats = getStats(location);

		if(stats) {
			if (stats.isDirectory()) {
				node.child(location, file);
			}

			if (stats.isFile()) {
				handleFile(node, location);
			}
		}
	});
}

/**
 * Checks if the file is not a hidden one and can be
 * resolved by nodejs.
 * 
 * If the file is valid, it is added to the containing Node.
 * 
 * @param  {Node}   node
 * @param  {String} file
 */
function handleFile(node, file) {
	const ext = path.extname(file);
	const name = path.basename(file, ext);

	// Omit hidden files
	if (name[0] === '.') {
		return false;
	}

	// Check if it can be resolved
	try {
		file = ext ? file.slice(0, -ext.length) : file;
		require.resolve(file);
	} catch (err) {
		return;
	}

	debug(`Found file ${name} in ${node.location}`);

	node.files.set(name, file);
}

module.exports = Node;