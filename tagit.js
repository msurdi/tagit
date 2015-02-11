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


exports.tag = function tag(root, f, tags) {
    var data = load(root);
    data = add(data, f, tags);
    save(root, data);
};

exports.tags = function tags(root, f) {
    var data = load(root);
    return data.files[f].tags || [];
};

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

// Private functions

function load(root) {
    var dataPath = path.join(root, TAGIT_DIR, TAGIT_FILE);
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
    var allTags = _.uniq(tags.concat(previousTags));
    data.files[f] = {'name': f, 'tags': allTags, 'added': Date.now()};
    return data;
}

