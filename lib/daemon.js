/**
 * Module dependencies.
 */

var path = require('path');
var spawn = require('child_process').spawn;
var Pid = require('./pid');

/**
 * Expose a new instance of `Daemon`.
 */

module.exports = function(opts) {
  return new Daemon(opts);
};

/**
 * Daemon.
 *
 * @param {String} name
 * @constructor
 */

function Daemon(name) {
  if (process.getuid() !== 0) throw new Error('Expected to run as root.');

  var dir = path.dirname(module.parent.parent.filename);

  this.name = name;
  this.main = path.resolve(dir, name);
  this.pidfile = path.join('/var/run/', this.name, this.name + '.pid');

  if (!this.name) throw new Error('Expected `name` option for daemon.');
  if (!this.main) throw new Error('Expected `main` option for daemon.');
  if (!this.pidfile) throw new Error('Expected `pidfile` option for daemon.');

  this.pid = new Pid(this.pidfile);

  this.argv = ['--harmony', __dirname + '/process.js'];
}

/**
 * Starts the daemon.
 *
 * @api public
 */

Daemon.prototype.start = function() {
  // make sure daemon is not already running
  var p = this.signal(this.pid.get());
  if (p) throw new Error('Daemon already running. PID: ' + p);

  console.log('Starting ' + this.name + ' daemon...');

  var c = spawn(process.execPath, this.argv, {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    env: {NODE_ENV: 'production'},
    detached: true
  });

  var ctx = this;
  c.once('disconnect', function() {
    setTimeout(function() {
      if (ctx.signal(c.pid) === 0) throw new Error('Daemon failed to start `' + ctx.name + '`.\nDid you forget to create Linux `' + ctx.name + '` user or group?');
      console.log(ctx.name + ' daemon started');
    }, 100);
  });

  c.send({name: this.name, main: this.main, pidfile: this.pidfile});

  c.unref();
};

/**
 * Stops the daemon, if it is running.
 *
 * @param {Function} [fn]
 * @api public
 */

Daemon.prototype.stop = function(fn) {
  this.end(['SIGTERM'], fn);
};

/**
 * Kills the daemon, if it is running.
 *
 * @param {Function} [fn]
 * @api public
 */

Daemon.prototype.kill = function(fn) {
  this.end(['SIGTERM', 'SIGKILL'], fn);
};

/**
 * Returns the daemon status.
 *
 * @returns {Number}
 * @api public
 */

Daemon.prototype.status = function() {
  return this.signal(this.pid.get());
};

/**
 * Ends the daemon process, if it exists.
 *
 * @param {Array} sigs
 * @param {Function} fn
 * @api private
 */

Daemon.prototype.end = function(sigs, fn) {
  var p = this.signal(this.pid.get());
  if (p === 0) {
    console.log(this.name + ' daemon is not running');
    return fn && fn();
  }

  console.log('Stopping ' + this.name + ' daemon...');

  this.attempt(p, sigs, fn);
};

/**
 * Attempt to kill the daemon, retrying until dead.
 *
 * @param {Number} pid
 * @param {Array} sigs
 * @param {Function} fn
 * @api private
 */

Daemon.prototype.attempt = function(pid, sigs, fn) {
  if (!this.signal(pid, sigs.length > 1 ? sigs.shift() : sigs[0])) {
    console.log(this.name + ' daemon stopped');
    return fn && fn(pid);
  }

  setTimeout(this.attempt.bind(this, pid, sigs, fn), 2000);
};

/**
 * Send a signal to a process.
 *
 * @param {Number} pid
 * @param {String} [sig]
 * @returns {Number}
 * @api private
 */

Daemon.prototype.signal = function(pid, sig) {
  if (!pid) return 0;

  try {
    // signal of `0` can be used to test
    // for the existence of a process
    process.kill(pid, sig || 0);
    return pid;
  } catch (ex) {}

  return 0;
};
