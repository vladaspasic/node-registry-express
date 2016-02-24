# node-registry-express

Plugin for [`node-registry`](http://vladaspasic.github.io/node-registry/) that creates a configurable [`express`](https://github.com/expressjs/express) server module to your project.

### Installation

```bash
npm install node-registy-express --save
```
### Routing

To define routes for your `express` server, you need to place all your route files in your `routes` folder. You can change the folder where your are located by changing the `server.routes.location` environment property.

A simple route file should look like this:

``` javascript
module.exports = function(route, filters) {

	route.get('/', function(req, res) {
		return res.render('index');
	});
	
	route.get('/profile', filters.auth, function(req, res) {
		return res.render('profile', {
		    name: 'John Doe'
		});
	});

	route.get('/error', function(req, res) {
		throw new Error('Ooops');
	});

};
```

This route would handle `http://example.com`, `http://example.com/profile` and `http://example.com/error` URLS.

Your file must export a function that accepts a `Route` instance that later mounted on the express application and a `filters` object which contains all the available filters that you can use as middleware. 

You can also create subfolders in your `routes` folder where the folder name would be your route mount path on the Express router. If you have an `api` subfolder in your `routes` folder, all routes would be accessible with `api/` prefix.

This is applied recursively to all your folders.

### Filters (Middlewares)

To create filters for your `express` server, you need to place all your files in your `filters` folder. You can change the folder where your are located by changing the `server.filters.location` environment property.

All files should export a function which is a middleware function.

This is a `auth.js` file, which creates an `auth` filter used in the Routes example.

``` javascript
module.exports = function (req, res, next) {
    if(req.user) {
	    next();
    } else {
        next(new Error('Unauthorized request.'));
    }
};
```

### Configuration

This plugin comes with standard express midlewares that could be configured in your projects `config` file. Here is the list of middlewares that are configured, represented in the order how they are applied.

#### Compression
Uses Express `compression` middleware to enable compression of the Response Stream.
This middleware is enabled by default.

###### Options
* `server.compression.enabled` - Enable or disable compression middleware, defaults to `true`
* `server.compression.level` - Sets the zlib compression level, defaults to `6`
* `server.compression.chunkSize` - Zlib buffer chunk size, defaults to `zlib.Z_DEFAULT_CHUNK` 

#### Favicon
Configures the `serve-favicon` middleware. To enable favicon, set the `server.favicon` configuration key to the file location where the icon is located on the File System.

#### Views
Configuration of the Express view engine is done using the `consolidate` library by default. If you wish to use `consolidate`, you can configure it by using these properties:

* `server.views.engine` - Engine that should be used for Views, defaults to `handlebars`
* `server.views.location` - Set the folder where your views are located, defaults to `false`

You can also configure the view engine by registering a `view` or `express:view` module to the Node Registry container. Registry would preform a lookup if this module is present in the container and it would invoke the `configure` method passign the Express instance and the Environment object.

Here is an example view module that uses `express-handlebars` view engine.

```javascript
"use strict";

const Registry = require('node-registry');
const exphbs = require('express-handlebars');

Registry.registerModule('express:view', {
	configure(app, env) {
		const hbs = exphbs.create({
			defaultLayout: 'main',
			extname: '.hbs'
		});

		Registry.logger.debug('Setting Handlebars view engine');

		app.engine('hbs', hbs.engine);
		app.set('view engine', 'hbs');
	}
});
```

You can also disable view middleware by setting the configuration property `server.views.enabled` to `false`.

#### CORS
This plugin also offers you a possibilty to configure your Cross-Origin policies by using the [`cors`](https://github.com/expressjs/cors) Express middleware.

By default this middleware is disabled, if you wish to enable it and configure it use the following options:

* `server.cors.enabled` - Enables or disables the CORS middleware, defaults to `false`
* `server.cors.origin` - Configures the `Access-Control-Allow-Origin` CORS header, defaults to `*`
* `server.cors.methods` - Configures the `Access-Control-Allow-Methods` CORS header, defaults to `*` 
* `server.cors.allowedHeaders` - Configures the `Access-Control-Allow-Headers` CORS header, defaults to `*` 
* `server.cors.exposedHeaders` - Configures the `Access-Control-Expose-Headers` CORS header, defaults to `*` 
* `server.cors.credentials` - Enable or disable the `Access-Control-Allow-Credentials` CORS header, defaults to `false` 
* `server.cors.maxAge` - Configures the `Access-Control-Allow-Max-Age` CORS header, defaults to `*` 

To use this middleware you need to install `cors` dependency.

#### Request logger (Morgan)
Configure [`morgan`](https://github.com/expressjs/morgan) express request logger. This middleware is disabled by default but you can enabled it by setting the `server.morgan.enabled` to `true`.
To set the request log pattern use this property `server.morgan.pattern`, defaults to `dev`.

To use this middleware you need to install `morgan` dependency.

#### Access Logs
You can also create an access log file for your application using `morgan` and `file-stream-rotator` plugins. To enable this feature set `server.accesslog.enabled` to `true`.
To configure the `file-stream-rotator` you can use the following options:

* `server.accesslog.filename` - Name of file where to write the logs, defaults to `access-log-%DATE%.log`
* `server.accesslog.directory` - Directory where the files are located, defaults to `logs` folder in your project directory
* `server.accesslog.date_format` - How to format the date for the access log file name, defaults to `YYYY-MM-DD`
* `server.accesslog.pattern` - Morgan pattern for the access logs, default to `common`
* `server.accesslog.frequency` - Define the file log rotation frequency, defaults to `daily`

To use this middleware you need to install both `morgan` and `file-stream-rotator` dependecies.

#### Body parser
Configures the Express `body-parser` middleware. This middleware is enabled by default, and requires you to have `body-parser` dependency installed.

You can configure it using these options:

###### JSON Parser
* `server.parser.json.inflate` - Deflates to compressed bodies, defaults to `true`
* `server.parser.json.limit` - Set the limit of the request body, defaults to `100kb`
* `server.parser.json.strict` - Accept only arrays and objects, defaults to `true`
* `server.parser.json.type` - Determines what media type the middleware will parse, defaults to `application/json`

###### URL Encoded Parser
* `server.parser.urlencoded.extended` - Which library to use when parsing the URL-encoded data, defaults to `false`
* `server.parser.urlencoded.inflate` - Deflates to compressed bodies, defaults to `true`
* `server.parser.urlencoded.limit` - Set the limit of the request body, defaults to `100kb`
* `server.parser.urlencoded.parameterLimit` - Parameter limit, defaults to library default
* `server.parser.urlencoded.type` - Determines what media type the middleware will parse, defaults to `application/x-www-form-urlencoded`

To disable this middleware set `server.parser.enabled` to `false`.

### Cookies
Configure the `cookie-parser` Express middleware for handling Cookies. This middleware is disabled by default, and requires you to have `cookie-parser` dependency installed if enabled.

You can configure your parser using the following options:

* `server.cookies.enabled` - Enable or disable cookie parser, defaults to `false`
* `server.cookies.secret` - Secret phrase used to encrypt Cookies, defaults to a random generated string
* `server.cookies.path` - Path for the Cookie, defaults to `cookie` default
* `server.cookies.domain` - Domain for the Cookie, defaults to `cookie` default
* `server.cookies.expires` - Expiration date for the Cookie, defaults to `cookie` default
* `server.cookies.maxAge` - Max age for the Cookie when it should expire in seconds, defaults to `cookie` default
* `server.cookies.secure` - Secure Cookies, defaults to `cookie` default
* `server.cookies.httpOnly` - Accept only HTTP cookie, defaults to `cookie` default
* `server.cookies.firstPartyOnly` - Enable "First-Party-Only" Cookie, defaults to `cookie` default

### Session
Setup and configure the `express-session` middleware. This middleware is disabled by default, and requires you to have `express-session` dependency installed if enabled.

You can configure your session middleware using the following options:

* `server.session.enabled` - Enable or disable Sessions, defaults to `false`
* `server.session.name` - Name of the Session cookie
* `server.session.proxy` - Should the app trust a Proxy
* `server.session.resave` - Save the Session for each request to the store, defaults to `false`
* `server.session.rolling` - Force a session identifier cookie to be set on every response, defaults to `false`
* `server.session.saveUninitialized` - Should a session that is "uninitialized" be saved to the store, defaults to `false`

##### Store configuration
Currently this library natively supports `connect-mongo` and `connect-redis` Session Stores. You can configure which store you wish to use by setting the `server.session.store.type` property to `mongo` or `redis`. By default in Memory Store is used.

###### Mongo Store

* `server.session.store.url` - Connection URL
* `server.session.store.collection` - Mongo Collection name
* `server.session.store.ttl` - Set the TTL for session documents

###### Redis Store

* `server.session.store.url` - Connection URL
* `server.session.store.password` - Password for the Redis user
* `server.session.store.prefix` - Collection name prefix
* `server.session.store.ttl` - Set the TTL for session documents

##### Custom Stores
You can also create your custom stores, but you would have to configure them by your self. To create a custom you need to register a Module with name `session:my-session-store` or `session-store:my-session-store` which exposes the
store instance.

To use your custom store implementation, set the `server.session.store.type` environment property to `my-session-store`.

### Express static
You can configure static middleware using these properties:

* `server.static.locations` - String or an Array of folders where static files are located, defaults to `public`
* `server.static.etag` - Should the Etag header be sent, defaults to `true`
* `server.static.lastModified` - Should the Last-Modified header be sent, defaults to `true`
* `server.static.maxAge` - Max age when caching expires, defaults to `1d`
* `server.static.extensions` - Which extensions should be served, defaults to `false` (all extensions)

### Licence

[Apache Licence 2.0](https://github.com/vladaspasic/node-registry-express/blob/master/LICENSE)