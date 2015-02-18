"use strict";

var path = require('path');
var fs = require('fs');
var findit = require('findit');
var _ = require('underscore');


var TAGIT_DIR = '.tagit';
var TAGIT_FILE = 'data.json';


var Tagit = exports.Tagit = function Tagit(workDir) {
    this.workDir = workDir || '.';
};

Tagit.prototype.init = function init(cb) {
    var self = this;
    var dir = path.join(self.workDir, TAGIT_DIR);
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir);
            save(self.workDir, {});
            cb(undefined, true);
        }
        catch (ex) {
            cb(ex);
        }
    }
    else {
        cb(undefined, false)
    }
};

Tagit.prototype.update = function update() {
    var self = this;
    var finder = findit(self.workDir);
    var data = load(self.workDir);
    finder.on('file', function (f) {
        if (f.indexOf('.') !== 0) {
            add(data, f);
        }
    });

    finder.on('end', function () {
        save(self.workDir, data);
    });

    finder.on('error', function (err) {
        console.warn("processing %s: %s", err.path, err.code);
    })
};

Tagit.prototype.autotag = function autotag() {
    var self = this;
    var data = load(self.workDir);
    data.files.forEach(function (f) {
        data.files[f.name].tags = mergeTags(data.files[f.name].tags || [], extractTags(f.name));
    });
    save(self.workDir, data);
};

Tagit.prototype.remove = function remove(f) {
    var self = this;
    var data = load(self.workDir);
    if (data.files && data.files[f]) {
        delete data.files[f];
        save(self.workDir, data);
    }
};


Tagit.prototype.tag = function tag(f, tags) {
    var self = this;
    var data = load(self.workDir);
    data = add(data, f, tags);
    save(self, data);
};

Tagit.prototype.untag = function untag(f, tags) {
    var self = this;
    var data = load(self.workDir);
    if (data.files && data.files[f] && data.files[f].tags) {
        var oldTags = data.files[f].taas || [];
        var newTags = oldTags;
        if (oldTags) {
            newTags = _.without(oldTags, tags);
        }
        data.files[f].tags = newTags;
        save(self.workDir, data);
    }
};

Tagit.prototype.tags = function tags(f) {
    var self = this;
    var data = load(self.workDir);
    var tags = [];
    if (data.files && data.files[f] && data.files[f].tags) {
        tags = data.files[f].tags;
    }
    return tags;
};

Tagit.prototype.allTags = function allTags() {
    var self = this;
    var data = load(self.workDir);
    var tags = [];
    _.each(data.files, function (f) {
        tags = tags.concat(f.tags);
    });
    return _.uniq(tags).sort();
};

Tagit.prototype.tagged = function tagged(tags) {
    var self = this;
    var data = load(self.workDir);
    var matchingFiles = [];
    if (!tags) {
        return _.keys(data.files);
    }
    _.each(data.files, function (f) {
        if (f.tags) {
            if (_.intersection(f.tags, tags).length === tags.length) {
                matchingFiles.push(f);
            }
        }
    });
    return matchingFiles;
};

Tagit.prototype.random = function random(tags) {
    var self = this;
    return _.sample(self.tagged(tags));
};

var NoDataError = exports.NoDataError = function NoDataError(message) {
    this.name = "NoDataError";
    this.message = (message || "There is no .tagit directory in this directory or any of its parents."
    + "Did you forget to run `tagit init`?");
};
NoDataError.prototype = new Error();


// Private functions

function findDataDir(workDir) {
    var absworkDir = path.resolve(path.join(workDir, TAGIT_DIR));
    var stat = fs.statSync(absworkDir);
    if (stat.isDirectory(stat)) {
        return workDir;
    } else if (path !== '/') {
        return findDataDir(path.join(workDir, '..'));
    } else {
        throw new NoDataError();
    }
}

function load(workDir) {
    var tagitDir = findDataDir(workDir);
    var dataPath = path.join(tagitDir, TAGIT_DIR, TAGIT_FILE);
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}
function save(workDir, data) {
    var dataPath = path.join(workDir, TAGIT_DIR, TAGIT_FILE);
    fs.writeFileSync(dataPath, JSON.stringify(data), 'utf8');
}

function add(data, f, tags) {
    tags = tags || [];
    data.files = data.files || {};
    data.files[f] = data.files[f] || {};
    var previousTags = data.files[f].tags || [];
    var allTags = mergeTags(previousTags, tags);
    data.files[f] = {'name': f, 'tags': allTags, 'added': Date.now()};
    return data;
}

function mergeTags(oldTags, newTags) {
    oldTags = oldTags || [];
    newTags = newTags || [];
    var tags = oldTags.concat(newTags)
    tags = tags.map(function (tag) {
        return tag.toLowerCase()
    });
    return _.uniq(tags)
}

function extractTags(f) {
    var tags = [];
    if (f) {
        tags = f.split(/[^A-Za-z]/);
        tags = _.filter(tags, function (tag) {
            return tag.length > 2;
        });
    }
    return tags;
}
