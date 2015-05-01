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
    var process = spawn.spawn(BIN, args);
    var stdout = '', stderr = '';
    process.stdout.on('data', function (data) {
        stdout += data.toString();
    });
    process.stderr.on('data', function (data) {
        stderr += data.toString();
    });

    process.on('close', (code) => {
        if (typeof cb == 'function') {
            return cb(null, code, stdout, stderr);
        }
    });
}

describe("when not yet initialized", () => {
    var workDir;
    var cleanupWorkDir;

    beforeEach(function (done) {
        tmp.dir({unsafeCleanup: true}, (err, path, cleanupCallback)  => {
            if (err) throw err;
            workDir = path;
            cleanupWorkDir = cleanupCallback;
            process.chdir(workDir);
            done();
        });
    });

    afterEach(()  => {
        cleanupWorkDir();
    });

    it('should print help when no args', (done)  => {
        run([], (err, code, stdout) => {
            assert.include(stdout, 'Usage');
            assert.include(stdout, 'Commands');
            assert.include(stdout, 'Options');
            done();
        });
    });

    it('should create file structore on init', (done)  => {
        run(['init', workDir], function () {
            fs.stat(path.join(workDir, '.tagit'), (err, stat)  => {
                if (err) throw err;
                assert.isTrue(stat.isDirectory());
                fs.stat(path.join(workDir, '.tagit/data.json'), (err, stat)  => {
                    assert.isTrue(stat.isFile());
                    done();
                });
            });
        })
    });

    describe("when initialized", ()  => {
        beforeEach(function (done) {
            ncp.ncp(path.join(__dirname, '../../../src/test/fixtures'), workDir, (err) => {
                if (err) throw err;
                run(['init', workDir], done);
            });
        });

        it('should fail to init already initialized directories', (done)  => {
            run(['init', workDir], (err, code)  => {
                assert.notEqual(code, 0);
                done();
            });
        });

        it('shouldn\'t list any tag', (done) => {
            run(['tags'], (err, code, stdout)  => {
                assert.equal(stdout, '');
                assert.equal(code, 0);
                done();
            });
        });

        it('shouldn\'t list any file for a nonexistent tag', (done)  => {
            run(['tagged', 'nonexistent'], (err, code, stdout)  => {
                assert.equal(stdout, '');
                assert.equal(code, 0);
                done();
            });
        });

        it('should fail to index inexistent file', (done)  => {
            run(['tag', 'inexistent_file.txt', 'othertag'], (err, code)  => {
                assert.notEqual(code, 0);
                done();
            });
        });


        describe('when there are files manually tagged', ()  => {
            beforeEach((done)  => {
                run(['tag', 'test_file_1.txt', 'sometag', 'sometag2'], ()  => {
                    run(['tag', 'test2_file_2.txt', 'sometag2'], done);
                });
            });

            it('should have one file with tag sometag', (done)  => {
                run(['tagged', 'sometag'], (err, code, stdout)  => {
                    assert.equal(code, 0);
                    assert.include(stdout, 'test_file_1.txt');
                    done();
                });
            });

            it('should have two files with tag sometag2', (done)  => {
                run(['tagged', 'sometag2'], (err, code, stdout)  => {
                    assert.equal(code, 0);
                    assert.include(stdout, 'test_file_1.txt');
                    assert.include(stdout, 'test2_file_2.txt');
                    done();
                });
            });

            describe('when file is untagged', ()  => {
                beforeEach((done)  => {
                    run(['untag', 'test_file_1.txt', 'sometag'], done);
                });

                it('shouldn\'t be any file', (done)  => {
                    run(['tagged', 'test_file_1.txt', 'sometag'], (err, code, stdout)  => {
                        assert.equal(code, 0);
                        assert.equal(stdout, '');
                        done();
                    });
                });
            });

            describe('when file is removed', ()  => {
                beforeEach(function (done) {
                    run(['remove', 'test_file_1.txt'], done);
                    it('shouldn\'t be any file', (done)  => {
                        run(['tagged', 'test_file_1.txt', 'sometag'], (err, code, stdout)  => {
                            assert.equal(code, 0);
                            assert.equal(stdout, '');
                            done();
                        });
                    });
                });
            });
        });
        describe('when there are files autotagged', ()  => {
            beforeEach((done)  => {
                run(['update'], (err)  => {
                    if (err) throw err;
                    run(['autotag'], done);
                });
            });

            it('should not start with absolute paths', (done)  => {
                run(['tagged', 'unique'], (err, code, stdout:string)  => {
                    assert.isFalse(stdout.charAt(0) == "/");
                    done();
                });
            });

            it('should have one file with tag unique', (done)  => {
                run(['tagged', 'unique'], (err, code, stdout)  => {
                    assert.equal(code, 0);
                    assert.include(stdout, 'unique.txt');
                    done();
                });
            });

            it('should have two files with tag file', (done)  => {
                run(['tagged', 'file'], function (err, code, stdout) {
                    assert.equal(code, 0);
                    assert.include(stdout, 'test_file_1.txt');
                    assert.include(stdout, 'test2_file_2.txt');
                    done();
                });
            });

            it('should return a random file with all tags', (done)  => {
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

            it('should return a random file with tag test', (done)  => {
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