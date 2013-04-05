halocksmith
===========

Distributed locking mechanism using [haredis](https://github.com/carlos8f/haredis)

This module is a fork of Ian Hansen's [locksmith](https://github.com/supershabam/locksmith).
It implements the locking algorithm described in the Redis documentation: http://redis.io/commands/setnx


## Purpose

Enables locking (mutex/semaphore) across a clustered node application.

## API
```javascript
/**
 * Options:
 *
 * nodes {Array} (optional): host/port array; defaults to ['127.0.0.1:6379']; See [haredis](https://github.com/carlos8f/haredis#createclient) for more information
 * prefix {String} (optional): defaults to '__halocksmith:'
 * timeout {Number} (optional): given in seconds; defaults to 120 (two minutes)
 * retries {Number} (optional): number of times to retry acquiring the lock; defaults to 100
 * retryTimeout {Number} (optional): given in milliseconds; defaults to 1000 (one second)
 * redisClient {redisClient} (optional): already instantiated Redis client (other Redis options won't be used)
 * **any additional options are passed to redis.createClient as options**
 */
var lock = require('halocksmith')(options);

/**
 * lock is a function
 *
 * key {String} (optional): the cluster-wide keyname to lock on; defaults to ''
 * callback {Function}: function to execute when you have the lock; takes two parameters:
 *     - error {Error}
 *     - release {Function}: function to call when you are done with the lock (required in most circumstances);
 */
lock([key], callback)
```

Example
-------

```javascript
var lock = require('halocksmith')({
  timeout: 120
});

// `key` may be omitted if you only need one lock
lock(function(err, release) {
  // Return without releasing the lock if there's an error
  if (err) return console.error(err);

  // This is the only process in the cluster that acquired the lock
  doSomething();

  // Delete the lock; other processes will be able to acquire a new lock
  release();
});
```
- - -

### Developed by [Terra Eclipse](http://www.terraeclipse.com)
Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

- - -

### License: MIT
Copyright (c) 2013 Dan MacTough ([http://yabfog.com](http://yabfog.com))

Copyright (c) 2013 Terra Eclipse, Inc. ([http://www.terraeclipse.com](http://www.terraeclipse.com))

Portions Copyright (c) 2012, Ian Hansen (//github.com/supershabam)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
