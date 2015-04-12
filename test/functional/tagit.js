var chai = require('chai');
var spawn = require('child_process').spawn;
var tmp = require('tmp');
var path = require('path');

var NODE = 'node';
var INDEX = 'index.js';

chai.use(require('chai-fs'));

var assert = chai.assert;

function run(args, cb) {
    args = !!args ? args : [];
    var process = spawn(NODE, [INDEX].concat(args));
    var stdout = '', stderr = '';
    process.stdout.on('data', function (data) {
        stdout += data.toString();
    });
    process.stderr.on('data', function (data) {
        stderr += data.toString();
    });

    process.on('close', function (code) {
        return cb(null, code, stdout, stderr);
    });
}


describe("Tagit", function () {
    var workDir;
    var cleanupWorkDir;

    before(function () {
        tmp.dir({unsafeCleanup: true}, function (err, path, cleanupCallback) {
            if (err) throw err;
            workDir = path;
            cleanupWorkDir = cleanupCallback;
        });
    });

    after(function () {
        cleanupWorkDir();
    });

    it('should print help when no args', function (done) {
        run([], function (err, code, stdout) {
            assert.include(stdout, "Usage");
            //expect(stdout).to.have.string("Commands");
            //expect(stdout).to.have.string("Options");
            done();
        });
    });

    it('should create file structore on init', function (done) {
        run(['init', workDir], function (err, code, stdout) {
            assert.isDirectory(path.join(workDir, '.tagit'));
            assert.isFile(path.join(workDir, '.tagit/data.json'));
            done();
        })
    });




});