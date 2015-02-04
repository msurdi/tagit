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
    finder.on('file', function (file, stat) {
        add(file);
    });
    finder.on('end', function () {
        save();
    });
};


exports.tag = function tag(root, f, tags) {
    var data = load(root);
    data = add(data, f, tags)
    save(root, data);
};

exports.tags = function tags(root, f) {
    var data = load(root);
    var tags = data.files[f].tags || [];
    return tags;
}

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
    data.files = data.files || {};
    data.files[f] = data.files[f] || {};
    var previousTags = data.files[f].tags || []
    var allTags = _.uniq(tags.concat(previousTags));
    data.files[f] = {'tags': allTags, 'added': Date.now()};
    return data;
}

