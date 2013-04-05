'use strict';

/**
 * The locking algorithm used in this is described here: http://redis.io/commands/setnx
 */
var redis = require('haredis')
  , moment = require('moment')
  ;

function HALocksmith(options) {
  var nodes, prefix, timeout, retries, retryTimeout;

  options = options || {};
  nodes = options.nodes || ['127.0.0.1:6379'];
  prefix = options.prefix || '__halocksmith:';
  timeout = 'timeout' in options ? options.timeout : 10;
  retries = 'retries' in options ? options.retries : 100;
  retryTimeout = 'retryTimeout' in options ? options.retryTimeout : 1000;

  delete options.nodes;
  delete options.prefix;
  delete options.timeout;
  delete options.retries;
  delete options.retryTimeout;

  if (options.redisClient) {
    this._redisClient = options.redisClient;
  } else {
    this._redisClient = redis.createClient(nodes, options);
  }

  this._prefix = prefix;
  this._timeout = timeout;
  this._retries = retries;
  this._retryTimeout = retryTimeout;
}

HALocksmith.prototype.lock = function(key, cb) {
  var retries = 0
    , _this = this
    , fullKey
    ;

  if (typeof(key) === 'function') {
    cb = key;
    key = '';
  }
  fullKey = this._prefix + key;

  (function aquire() {
    var expires = moment().add('seconds', _this._timeout).unix();
    _this._redisClient.setnx(fullKey, expires, function handleSetnx(err, response) {
      if (err) return cb(err);

      // if we aquired the lock
      if (response === 1) {
        return cb(null, _this._release.bind(_this, key, expires));
      }

      // otherwise let's check if the lockholder is expired
      _this._redisClient.slaveOk(false).get(fullKey, function handleGet(err, keyExpires) {
        if (err) return cb(err);

        // no retrying allowed and the key doesn't exist, so there is no deadlock to try to fix
        if (!_this._retries && !keyExpires) {
          return cb(new Error('failed to acquire lock for: ' + key));
        }

        function retry() {
          if (++retries > _this._retries) {
            return cb(new Error('maximum retries hit while aquiring lock for: ' + key));
          }
          setTimeout(aquire, _this._retryTimeout);
        }

        // if the key still exists and has not expired
        if (moment().unix() < keyExpires) {
          return retry();
        } else { // try and aquire expired lock
          expires = moment().add('seconds', _this._timeout).unix();
          _this._redisClient.getset(fullKey, expires, function handleGetSet(err, keyExpires) {
            if (err) return cb(err);

            // if the key is no longer expired, somebody else grabbed it, get back in line
            if (moment().unix() < keyExpires) {
              return retry();
            }

            // we got the lock!
            return cb(null, _this._release.bind(_this, key, expires));
          });
        }
      });
    });
  })();
};

HALocksmith.prototype._release = function(key, expires, callback) {
  var fullKey = this._prefix + key;

  // callback is optional
  if ('function' !== typeof callback) {
    callback = function () {};
  }

  // nice! we finished before somebody tries to expires us
  if (moment().unix() < expires) {
    this._redisClient.del(fullKey, function handleDel(err) {
      if (err) return callback(err);
      callback();
    });
  } else {
    // it's too late, the lock is already being fought for
    callback(new Error('you released your lock after expiration on key: ' + key));
  }
};

/**
 * options = {
 *   nodes {Array} (optional): host/port array; defaults to ['127.0.0.1:6379']; See [haredis](https://github.com/carlos8f/haredis#createclient) for more information
 *   prefix {String} (optional): defaults to '__halocksmith:'
 *   timeout {Number} (optional): given in seconds; defaults to 120 (two minutes)
 *   retries {Number} (optional): number of times to retry acquiring the lock; defaults to 100
 *   retryTimeout {Number} (optional): given in milliseconds; defaults to 1000 (one second)
 *   redisClient {redisClient} (optional): already instantiated Redis client (other Redis options won't be used)
 *   **any additional options are passed to redis.createClient as options**
 * }
 */
module.exports = function(options) {
  var halock = new HALocksmith(options);
  return halock.lock.bind(halock);
};
module.exports.HALocksmith = HALocksmith;
