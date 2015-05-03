/// <reference path="../typings/all.d.ts" />
import path = require('path');
import fs = require('fs');
import _ = require('underscore');
import findit = require('findit');


const TAGIT_DIR = '.tagit';
const TAGIT_FILE = 'data.json';

interface Entry {
    name: string
    tags: string[]
    added: Date
}

interface Repository {
    files: { [path: string]: Entry }
}

export class NoRepositoryError implements Error {
    public name = 'NoDataError';

    constructor(public message:string) {

    }

    toString() {
        return `${this.name} : ${this.message}`
    }
}

export class Tagit {
    workDir:string;

    constructor(workDir:string) {
        this.workDir = path.resolve(workDir || '.');
    }

    init(cb?:Function) {
        var dir = path.join(this.workDir, TAGIT_DIR);
        fs.stat(dir, (err)  => {
            if (!err) return callback(cb, null, false);
            if (err.code === 'ENOENT') {
                fs.mkdir(dir, (err) => {
                    if (err) return callback(cb, err);
                    save(this.workDir, {files: {}});
                    return callback(cb, null, true);
                });
            } else {
                return callback(cb, err, false);
            }
        });
    }

    update(cb?:Function) {
        var finder = findit(this.workDir);
        var data = load(this.workDir);

        finder.on('file', (f)  => {
            if (f.indexOf('.') !== 0) {
                this._add(data, f);
            }
        });

        finder.on('end', () => {
            save(this.workDir, data);
            return callback(cb);
        });

        finder.on('error', (err) => {
            console.warn("processing %s: %s", err.path, err.code);
        });
    }

    autotag() {
        var data = load(this.workDir);
        _.each(data.files, (f)  => {
            data.files[f.name].tags = mergeTags(data.files[f.name].tags || [], extractTags(f.name));
        });
        save(this.workDir, data);
    }

    remove(f:string) {
        var data = load(this.workDir);
        if (data.files && data.files[f]) {
            delete data.files[f];
            save(this.workDir, data);
        }
    }

    tag(f:string, tags:string[], cb:Function) {
        var data = load(this.workDir);
        fs.stat(f, (err)  => {
            if (err && err.code === 'ENOENT') {
                return callback(cb, err, false);
            } else {
                data = this._add(data, f, tags);
                save(this.workDir, data);
                return callback(cb, null, true);
            }
        });
    }

    untag(f:string, tags:string[]) {
        var data = load(this.workDir);
        if (data.files && data.files[f] && data.files[f].tags) {
            var oldTags:string[] = data.files[f].tags || [];
            var newTags:string[] = oldTags;
            if (oldTags) {
                newTags = _.without<string>(oldTags, ...tags);
            }
            data.files[f].tags = newTags;
            save(this.workDir, data);
        }
    }

    tags(f:string) {
        var data = load(this.workDir);
        var tags = [];
        if (data.files && data.files[f] && data.files[f].tags) {
            tags = data.files[f].tags;
        }
        return tags;
    }

    allTags():string[] {
        var data = load(this.workDir);
        var tags = [];
        _.each(data.files, function (f) {
            tags = tags.concat(f.tags);
        });
        return _.uniq(tags).sort();
    }

    tagged(tags:string[]):Entry[] {
        var data = load(this.workDir);
        var matchingFiles:Entry[] = [];
        _.each(data.files, (f)  => {
            if (f.tags) {
                if (_.intersection(f.tags, tags).length === tags.length) {
                    matchingFiles.push(f);
                }
            }
        });
        return matchingFiles;
    }

    random(tags:string[]):Entry {
        return _.sample<Entry>(this.tagged(tags));
    }

    _add(data:Repository, f:string, tags?:string[]) {
        var relativePath = path.relative(this.workDir, f);
        tags = tags || [];
        data.files = data.files || {};
        data.files[relativePath] = data.files[relativePath] || {name: relativePath, tags: tags, added: new Date()};
        var previousTags = data.files[relativePath].tags || [];
        var allTags = mergeTags(previousTags, tags);
        data.files[relativePath] = {'name': relativePath, 'tags': allTags, 'added': new Date()};
        return data;
    }
}


// Helper functions
function findDataDir(workDir:string) {
    var absworkDir = path.resolve(path.join(workDir, TAGIT_DIR));
    var stat = fs.statSync(absworkDir);
    if (stat.isDirectory()) {
        return workDir;
    } else if (workDir !== '/') {
        return findDataDir(path.join(workDir, '..'));
    } else {
        throw new NoRepositoryError(`Can't load database from ${workDir}`);
    }
}

function load(workDir:string):Repository {
    var tagitDir = findDataDir(workDir);
    var dataPath = path.join(tagitDir, TAGIT_DIR, TAGIT_FILE);
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function save(workDir:string, data:Repository) {
    var dataPath = path.join(workDir, TAGIT_DIR, TAGIT_FILE);
    fs.writeFileSync(dataPath, JSON.stringify(data), 'utf8');
}

function mergeTags(oldTags:string[] = [], newTags:string[] = []) {
    var tags = oldTags.concat(newTags);
    tags = tags.map((tag)  => {
        return tag.toLowerCase()
    });
    return _.uniq(tags)
}

function extractTags(f:string) {
    var tags = [];
    if (f) {
        tags = f.split(/[^A-Za-z]/);
        tags = _.filter(tags, (tag)  => {
            return tag.length > 2;
        });
    }
    return tags;
}

function callback(fn:Function, ...args:any[]) {
    if (typeof fn === 'function') {
        return fn.apply(null, Array.prototype.slice.call(arguments, 1))
    }
}
