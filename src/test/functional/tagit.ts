/// <reference path="../../typings/all.d.ts" />
require('source-map-support').install();

import chai = require('chai');
import spawn = require('child_process');
import tmp = require('tmp');
import path = require('path');
import ncp = require('ncp');
import fs = require('fs');

const BIN = path.join(__dirname, '../../../bin/tagit');
const assert = chai.assert;

function run(args = [], cb:Function = null) {
    var process = spawn.spawn(BIN, [].concat(args));
    var stdout = '', stderr = '';
    process.stdout.on('data', function (data) {
        stdout += data.toString();
    });
    process.stderr.on('data', function (data) {
        stderr += data.toString();
    });

    process.on('close', function (code) {
        if (typeof cb == 'function') {
            return cb(null, code, stdout, stderr);
        }
    });
}

describe("when not yet initialized", function () {
    var workDir;
    var cleanupWorkDir;

    beforeEach(function (done) {
        tmp.dir({unsafeCleanup: true}, function (err, path, cleanupCallback) {
            if (err) throw err;
            workDir = path;
            cleanupWorkDir = cleanupCallback;
            process.chdir(workDir);
            done();
        });
    });

    afterEach(function () {
        cleanupWorkDir();
    });

    it('should print help when no args', function (done) {
        run([], function (err, code, stdout) {
            assert.include(stdout, 'Usage');
            assert.include(stdout, 'Commands');
            assert.include(stdout, 'Options');
            done();
        });
    });

    it('should create file structore on init', function (done) {
        run(['init', workDir], function () {
            fs.stat(path.join(workDir, '.tagit'), function (err, stat) {
                if (err) throw err;
                assert.isTrue(stat.isDirectory());
                fs.stat(path.join(workDir, '.tagit/data.json'), function (err, stat) {
                    assert.isTrue(stat.isFile());
                    done();
                });
            });
        })
    });

    describe("when initialized", function () {
        beforeEach(function (done) {
            ncp.ncp(path.join(__dirname, '../../../src/test/fixtures'), workDir, function (err) {
                if (err) throw err;
                run(['init', workDir], done);
            });
        });

        it('should fail to init already initialized directories', function (done) {
            run(['init', workDir], function (err, code) {
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

        it('should fail to index inexistent file', function (done) {
            run(['tag', 'inexistent_file.txt', 'othertag'], function (err, code) {
                assert.notEqual(code, 0);
                done();
            });
        });


        describe('when there are files manually tagged', function () {
            beforeEach(function (done) {
                run(['tag', 'test_file_1.txt', 'sometag', 'sometag2'], function () {
                    run(['tag', 'test2_file_2.txt', 'sometag2'], done);
                });
            });

            it('should have one file with tag sometag', function (done) {
                run(['tagged', 'sometag'], function (err, code, stdout) {
                    assert.equal(code, 0);
                    assert.include(stdout, 'test_file_1.txt');
                    done();
                });
            });

            it('should have two files with tag sometag2', function (done) {
                run(['tagged', 'sometag2'], function (err, code, stdout) {
                    assert.equal(code, 0);
                    assert.include(stdout, 'test_file_1.txt');
                    assert.include(stdout, 'test2_file_2.txt');
                    done();
                });
            });

            describe('when file is untagged', function () {
                beforeEach(function (done) {
                    run(['untag', 'test_file_1.txt', 'sometag'], done);
                });

                it('shouldn\'t be any file', function (done) {
                    run(['tagged', 'test_file_1.txt', 'sometag'], function (err, code, stdout) {
                        assert.equal(code, 0);
                        assert.equal(stdout, '');
                        done();
                    });
                });
            });

            describe('when file is removed', function () {
                beforeEach(function (done) {
                    run(['remove', 'test_file_1.txt'], done);
                    it('shouldn\'t be any file', function (done) {
                        run(['tagged', 'test_file_1.txt', 'sometag'], function (err, code, stdout) {
                            assert.equal(code, 0);
                            assert.equal(stdout, '');
                            done();
                        });
                    });
                });
            });
        });
        describe('when there are files autotagged', function () {
            beforeEach(function (done) {
                run(['update'], function (err) {
                    if (err) throw err;
                    run(['autotag'], done);
                });
            });

            it('should not start with absolute paths', function (done) {
                run(['tagged', 'unique'], function (err, code, stdout:string) {
                    assert.isFalse(stdout.charAt(0) == "/");
                    done();
                });
            });

            it('should have one file with tag unique', function (done) {
                run(['tagged', 'unique'], function (err, code, stdout) {
                    assert.equal(code, 0);
                    assert.include(stdout, 'unique.txt');
                    done();
                });
            });

            it('should have two files with tag file', function (done) {
                run(['tagged', 'file'], function (err, code, stdout) {
                    assert.equal(code, 0);
                    assert.include(stdout, 'test_file_1.txt');
                    assert.include(stdout, 'test2_file_2.txt');
                    done();
                });
            });

            it('should return a random file with all tags', function (done) {
                run(['random'], function (err, code, stdout) {
                    if (stdout.indexOf('test_file_1.txt') > -1) {
                        assert.notInclude(stdout, 'test2_file_2.txt');
                    }
                    if (stdout.indexOf('test2_file_2.txt') > -1) {
                        assert.notInclude(stdout, 'test_file_1.txt');
                    }
                    assert.equal(code, 0);
                    done();
                });
            });

            it('should return a random file with tag test', function (done) {
                run(['random', 'unique'], function (err, code, stdout) {
                    assert.notInclude(stdout, 'test2_file_2.txt');
                    assert.notInclude(stdout, 'test_file_1.txt');
                    assert.include(stdout, 'unique.txt');
                    assert.equal(code, 0);
                    done();
                });
            });

        });
    });
});