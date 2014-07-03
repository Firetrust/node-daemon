/**
 * Module dependencies.
 */

var path = require('path');
var fs = require('fs');

/**
 * Expose `Daemon` class.
 */

module.exports = Pid;

/**
 * Pid.
 *
 * @param {String} name
 * @constructor
 */

function Pid(name) {
  this.file = path.join('/var/run/', name, name + '.pid');
}

/**
 * Get pid.
 *
 * @returns {Number}
 * @api public
 */

Pid.prototype.get = function get() {
  try {
    return parseInt(fs.readFileSync(this.file), 10);
  } catch (ex) {}

  return 0;
};

/**
 * Save pid.
 *
 * @param {Number} pid
 * @returns {Number}
 * @api public
 */

Pid.prototype.save = function save(pid) {
  try {
    fs.writeFileSync(this.file, pid + '\n');
  } catch (ex) {
    return ex.code;
  }

  return 0;
};

/**
 * Remove pid.
 *
 * @param {String} file
 * @api public
 */

Pid.prototype.remove = function remove() {
  try {
    fs.unlinkSync(this.file);
  } catch (ex) {}
};
