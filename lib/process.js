/**
 * Module dependencies.
 */

var Pid = require('./pid');

// wait for options via ipc
process.on('message', function(opts) {
  process.title = 'node ' + opts.name;

  process.once('SIGTERM', sigHandler);
  process.once('SIGINT', sigHandler);

  require(opts.main);

  process.setgid(opts.name);
  process.setuid(opts.name);

  var pid = new Pid(opts.pidfile);
  pid.save(process.pid);

  // close IPC channel with parent process
  process.disconnect();

  function sigHandler() {
    pid.remove();
    process.exit();
  }
});
