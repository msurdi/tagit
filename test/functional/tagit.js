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


describe("Before initialization", function () {
    var workDir;
    var cleanupWorkDir;

    beforeEach(function (done) {
        tmp.dir({unsafeCleanup: true}, function (err, path, cleanupCallback) {
            if (err) throw err;
            workDir = path;
            cleanupWorkDir = cleanupCallback;
            done();
        });
    });

    afterEach(function () {
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

    describe("After initialized directory", function () {
        beforeEach(function (done) {
            run(['init', workDir], function (err, code, stdout) {
                done();
            });
        });

        it('should fail to init already initialized directories', function (done) {
            run(['init', workDir], function (err, code, stdout) {
                assert.notEqual(code, 0);
                done();
            });
        });

        it('shouldn\'t list any tag', function (done) {
            run(['tags'], function (err, code, stdout) {
                assert.equal(stdout, '');
                assert.equal(code, 0);
                done();
            });
        });

        it('shouldn\'t list any file for a nonexistent tag', function (done) {
            run(['tagged', 'nonexistent'], function (err, code, stdout) {
                assert.equal(stdout, '');
                assert.equal(code, 0);
                done();
            });
        });

        


    });
});