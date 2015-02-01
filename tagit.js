var path = require('path');
var fs = require('fs');
var findit = require('findit')

exports = module.exports = new Tagit()

var TAGIT_DIR = '.tagit';
var TAGIT_FILE = 'data.json';

function Tagit() {
    this._root = '.';
    this._data = {}
}

/**
 * Set the program working directory to `root`
 *
 * @param root
 * @returns {Tagit}
 */
Tagit.prototype.root = function (root) {
    this._root = root;
    return this;
};


/**
 * Initializes the working directory
 *
 * @param  {Function} cb
 */
Tagit.prototype.init = function (cb) {
    var dir = path.join(this._root, TAGIT_DIR);
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir);
            this._save();
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

Tagit.prototype._load = function () {
    var dataPath = path.join(TAGIT_DIR, TAGIT_FILE);
    this._data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
};

Tagit.prototype._save = function () {
    var dataPath = path.join(TAGIT_DIR, TAGIT_FILE);
    fs.writeFileSync(dataPath, JSON.stringify(this._data), 'utf8');
};

Tagit.prototype._add = function (file) {
    this._data.files = this._data.files || {};
    this._data.files[file] = {'tags': [], 'added': Date.now()};
};

Tagit.prototype.update = function () {
    var finder = findit(this._root);
    var self = this;
    finder.on('file', function (file, stat) {
        self._add(file);
    });
    finder.on('end', function () {
        self._save();
    });
};


Tagit.prototype.tag = function (file, tags) {

};
