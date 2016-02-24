error-globals [![NPM version](https://img.shields.io/npm/v/error-globals.svg)](https://img.shields.io/npm/v/error-globals.svg) [![Build Status](https://travis-ci.org/vladaspasic/error-globals.svg?branch=master)](https://travis-ci.org/vladaspasic/error-globals) [![Coverage Status](https://img.shields.io/coveralls/vladaspasic/error-globals.svg)](https://coveralls.io/r/vladaspasic/error-globals?branch=master)
=============

This module comes with a whole list of various HTTP Errors that can be exposed to the global scope if needed. Each can be thrown with a cause Error, so you can easily stack errors as you catch them.

## Usage

```javascirpt
var errors = require('error-globals');

var typeError = new TypeError('Bad type');

throw new errors.InternalServerError(typeError, 'An error occured.');

Internal Server Error: An error occured.: Bad type
    at Module._compile (module.js:456:26)
    at Object.Module._extensions..js (module.js:474:10)
    at Module.load (module.js:356:32)
    at Function.Module._load (module.js:312:12)
    at Function.Module.runMain (module.js:497:10)
    at startup (node.js:119:16)
    at node.js:906:3

```

If you want to send a JSON response to the server you can call `toJSON` method on the Error.

For `typeError` we would get something like this:

```javascirpt
{ name: 'TypeError',
  message: 'Bad type',
  statusCode: 500,
  logLevel: 'error',
  stack: 
   [{ name: 'Module._compile',
       filename: 'module.js',
       line: 456,
       column: 26 },
     { name: 'Object.Module._extensions..js',
       filename: 'module.js',
       line: 474,
       column: 10 },
     { name: 'Module.load',
       filename: 'module.js',
       line: 356,
       column: 32 },
     { name: 'Function.Module._load',
       filename: 'module.js',
       line: 312,
       column: 12 },
     { name: 'Function.Module.runMain',
       filename: 'module.js',
       line: 497,
       column: 10 },
     { name: 'startup', filename: 'node.js', line: 119, column: 16 },
     { name: undefined, filename: 'node.js', line: 906, column: 3 } ],
  cause: undefined
}
```

And for `internalServerError` we would get something like this:

```javascirpt
name: 'Internal Server Error',
  message: 'An error occured.: Bad type',
  statusCode: 500,
  logLevel: 'error',
  stack: 
   [{ name: 'Module._compile',
       filename: 'module.js',
       line: 456,
       column: 26 },
     { name: 'Object.Module._extensions..js',
       filename: 'module.js',
       line: 474,
       column: 10 },
     { name: 'Module.load',
       filename: 'module.js',
       line: 356,
       column: 32 },
     { name: 'Function.Module._load',
       filename: 'module.js',
       line: 312,
       column: 12 },
     { name: 'Function.Module.runMain',
       filename: 'module.js',
       line: 497,
       column: 10 },
     { name: 'startup', filename: 'node.js', line: 119, column: 16 },
     { name: undefined, filename: 'node.js', line: 906, column: 3 } ],
  cause: 
   { name: 'TypeError',
     message: 'Bad type',
     statusCode: 500,
     logLevel: 'error',
     stack: ...
     cause: undefined
  }
}

```

You can also format your Error messages, like so:

```javascirpt
var dbUrl = 'some/db/url';
var typeError = new errors.DatabaseError('Could not connect to `%s`.', dbUrl);

typeError.message; // ->'Could not connect to `some/db/url`.'
```

For more information what these custom Errors contain, please read the documentation below.

## API

#### expose()

Type: ```Function```

A method that exposes all Errors to the Global scope.

```javascirpt
var errors = require('error-globals');

// This will throw an exception, as there is no NotFoundError variable
var error = new NotFoundError('I was not found');

errors.expose();

// Now it is exposed, and can be used
var error = new NotFoundError('I was not found');
```

#### create(name, *prototype)

Type: ```Function```

name: `String`

prototype: `Object`

A method that creates a new Error with a defined name and prototypes, such as `statusCode`, `logLevel`,  `init` or any other custom property you want it to have.

```javascirpt
var errors = require('error-globals');

var MyCustomError = errors.create('MyCustomError', {
  statusCode: 412,
  logLevel: 'debug',
  foo: 'bar',
  init: function(message) {
    console.log('Initialized: ' + message);
  },
  myCustomFunction: function() {
    return this.name;
  }
});

var error = new MyCustomError('Ooops'); // -> 'Initialized: MyCustomError'

error.statusCode; // -> 412
error.logLevel; // -> 'debug'
error.foo; // -> 'bar'
error.myCustomFunction(); // -> 'MyCustomError'
error instanceof Error; // -> true

```

### Error API documentation

#### cause()

Type: ```Function```

Returns: ```Error```

A method that returns a cause of the Error.

```javascirpt

var myError = new Error(new TypeError("An error occurred"));

myError.cause() --> 'TypeError: An error occured'

```

#### stackTrace()

Type: ```Function```

Returns: ```String```

Creates a stack trace for the Error. It uses the Error.stack to build it. If the Error had a cause, the same method will be invoked on it. This way you would get the whole stack trace what happend in your application.

```javascirpt

var myError = new Error();

myError.stackTrace();

Error: An error occurred
    at methodName (/your.file.js:13:9);
    at methodName (/your.file.js:23:16);
    at Context.<anonymous> (/your.other.file.js:50:19);

```

```javascirpt

var myError = new Error(new TypeError("An error occurred"), "Error cought");

myError.stackTrace();

Error: Error cought
    at methodName (/your.file.js:13:9);
    at methodName (/your.file.js:23:16);
    at Context.<anonymous> (/your.other.file.js:50:19);
Caused by: TypeError: An error occurred
    at methodName (/your.file.js:42:12);
    at methodName (/your.file.js:24:22);

```

#### printStackTrace()

Type: ```Function```

Prints the stack trace to sdterr.

#### init()

Type: ```Function```

Invoked by the constructor, usefull to do custom argument handling for the Error. This is a private function and it should not be invoked manually.

#### toJSON()

Type: ```Function```

Returns: ```Object```

A method that returns a json representation of the Error.

```javascirpt

var myError = new Error("An error occurred");

myError.toJSON();

{ name: 'Error',
  message: 'An error occurred',
  statusCode: 500,
  logLevel: 'error',
  stack:  [ 
   { name: 'someFunctionName',
     filename: 'location/of/the/file',
     line: 91,
     column: 9
   },
   { 
    name: 'Context.<anonymous>',
    filename: 'location/of/the/file',
    line: 28,
    column: 10
   }
}
```

The output above is produced only when you not are running the application in `production` mode. When running in `production` mode, `logLevel` and `stack` properties are ommited from the output.

#### toString()

Type: ```Function```

Returns: ```String```

Returns a to String representation of the Error in the format of Error.name: Error.message

```javascirpt

var myError = new Error("An error occurred");

myError.toString() -> 'Error: An error occurred'

```

#### loggerLevel

Type: ```Property```

Returns: ```String```

A logger level for the Error

#### Error.statusCode

Type: ```Property```

Returns: ```Number```

HTTP status code for the Error

### Predefined Errors

This module comes with a predefined set of custom errors. All Errors have a `statusCode` and `loggerLevel` properties,
so we could easily set the status code of the response, and log the Error apropriatelly.

Here is a list of all defined Errors in the module:

- TypeError
  - statusCode: 500
  - loggerLevel: error
- EvalError
  - statusCode: 500
  - loggerLevel: error
- InternalError
  - statusCode: 500
  - loggerLevel: error
- RangeError
  - statusCode: 500
  - loggerLevel: error
- ReferenceError
  - statusCode: 500
  - loggerLevel: error
- SyntaxError
  - statusCode: 500
  - loggerLevel: error
- UriError
  - statusCode: 500
  - loggerLevel: error
- RuntimeError
  - statusCode: 500
  - loggerLevel: error
- IllegalState
  - statusCode: 500
  - loggerLevel: error
- DatabaseError
  - statusCode: 500
  - loggerLevel: error
- WorkerError
  - statusCode: 500
  - loggerLevel: error
- ValidationError
  - statusCode: 500
  - loggerLevel: warn

And a list off all HTTP Status errors, for instance if you wish to throw `Bad Request` error status response, the coresponding error class will be `BadRequestError` that will have a `400` status code and `warn` as a logger level. Maybe you wish to send `Not Implemented` error, then the class will be `NotImplementedError` with a `501` status and `error` as a logger level.

## Licence

[MIT](https://github.com/vladaspasic/error-globals/blob/master/LICENSE)
