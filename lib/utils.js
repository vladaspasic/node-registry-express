/**
 * Check if required NPM module is present. 
 * If not throw a nice error with the instructions.
 */
function loadNpmModule(name, moduleName) {
	if (!moduleName) {
		moduleName = name;
	}

	try {
		return require(moduleName);
	} catch (e) {
		throw new Error(`You have enabed '${name}', but you have not` +
			` included the '${moduleName}' in your dependencies. Please run ` +
			`'npm install' or 'npm install ${moduleName} -S'`);
	}
}

exports.loadNpmModule = loadNpmModule;