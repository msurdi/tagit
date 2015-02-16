"use strict";

var path = require('path');
var fs = require('fs');
var findit = require('findit');
var _ = require('underscore');


var TAGIT_DIR = '.tagit';
var TAGIT_FILE = 'data.json';


/**
 * Initializes the working directory
 *
 * @param root
 * @param  {Function} cb
 */
exports.init = function init(root, cb) {
    var dir = path.join(root, TAGIT_DIR);
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir);
            save(root, {});
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

exports.update = function update(root) {
    var finder = findit(root);
    var data = load(root);
    finder.on('file', function (f) {
        if (f.indexOf('.') !== 0) {
            add(data, f);
        }
    });

    finder.on('end', function () {
        save(root, data);
    });

    finder.on('error', function (err) {
        console.warn("processing %s: %s", err.path, err.code);
    })
};

exports.autotag = function autotag(root) {
    var data = load(root);
    _.each(data.files, function (f) {
        data.files[f.name].tags = mergeTags(data.files[f.name].tags || [], extractTags(f.name));
    });
    save(root, data);
};

exports.remove = function remove(root, f) {
    var data = load(root);
    if (data.files && data.files[f]) {
        delete data.files[f];
        save(root, data);
    }
};


exports.tag = function tag(root, f, tags) {
    var data = load(root);
    data = add(data, f, tags);
    save(root, data);
};

exports.untag = function untag(root, f, tags) {
    var data = load(root);
    if (data.files && data.files[f] && data.files[f].tags) {
        var oldTags = data.files[f].taas || [];
        var newTags = oldTags;
        if (oldTags) {
            newTags = _.without(oldTags, tags);
        }
        data.files[f].tags = newTags;
        save(root, data);
    }
};

exports.tags = function tags(root, f) {
    var data = load(root);
    var tags = [];
    if (data.files && data.files[f] && data.files[f].tags) {
        tags = data.files[f].tags;
    }
    return tags;
};

exports.allTags = function allTags(root) {
    var data = load(root);
    var tags = [];
    _.each(data.files, function (f) {
        tags = tags.concat(f.tags);
    });
    return _.uniq(tags).sort();
}

exports.tagged = function tagged(root, tags) {
    var data = load(root);
    var matchingFiles = [];
    _.each(data.files, function (f) {
        if (f.tags) {
            if (_.intersection(f.tags, tags).length === tags.length) {
                matchingFiles.push(f);
            }
        }
    });
    return matchingFiles;
};

exports.random = function random(root, tags) {
    return _.sample(exports.tagged(root, tags));
};

var NoDataError = exports.NoDataError = function NoDataError(message) {
    this.name = "NoDataError";
    this.message = (message || "There is no .tagit directory in this directory or any of its parents."
    + "Did you forget to run `tagit init`?");
};
NoDataError.prototype = new Error();


// Private functions

function findDataDir(root) {
    var absRoot = path.resolve(path.join(root, TAGIT_DIR));
    var stat = fs.statSync(absRoot);
    if (stat.isDirectory(stat)) {
        return root;
    } else if (path !== '/') {
        return findDataDir(path.join(root, '..'));
    } else {
        throw new NoDataError();
    }
}

function load(root) {
    var tagitDir = findDataDir(root);
    var dataPath = path.join(tagitDir, TAGIT_DIR, TAGIT_FILE);
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}
function save(root, data) {
    var dataPath = path.join(root, TAGIT_DIR, TAGIT_FILE);
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
