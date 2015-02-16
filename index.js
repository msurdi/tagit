#!/usr/bin/env node

"use strict";

var program = require('commander');
var _ = require('underscore');
var tagit = require('./tagit');


process.on('uncaughtException', function (err) {
    if (err instanceof tagit.NoDataError) {
        console.log(err.message);
    } else {
        console.log('Unhandled error: %s', err);
        console.log(err.stack);
    }
    process.exit(1);
});


program
    .version('0.0.1')
    .option('-d --directory <directory>', 'Taggit work directory');

program
    .command('init [dir]')
    .description('Initialize directory for file tagging')
    .action(function (dir) {
        dir = dir || '.';
        tagit.init(dir, function (err, initialized) {
            if (!err) {
                if (initialized) {
                    console.log("Initialized %s", dir);
                } else {
                    console.log("%s is already initialized", dir);
                }
            } else {
                console.error(err.message);
            }
        });
    });


program
    .command('update')
    .description('Update the index by adding new files and removing missing ones')
    .action(function (options) {
        tagit.update(getDir(options));
    });

program
    .command('autotag')
    .description('Automatically tag all files extracting tags from their filenames')
    .action(function (options) {
        tagit.autotag(getDir(options));
    });

program
    .command('tag <file> <tag> [tags...]')
    .description("Tag a file with the given tags")
    .action(function (f, tag, otherTags, options) {
        var allTags = otherTags || [];
        allTags.push(tag);
        console.log('Tagging file %s with tags %s', f, allTags.toString());
        tagit.tag(getDir(options), f, allTags);
    });

program
    .command('tags [file]')
    .description('List tags for file. If no file is given list all available tags')
    .action(function (f, options) {
        if (f) {
            console.log(tagit.tags(getDir(options), f));
        }
        else {
            _.each(tagit.allTags(getDir(options)), function (tag) {
                console.log(tag);
            });
        }
    }
);


program
    .command('tagged <tag> [tags...]')
    .description('List files matching all given tags')
    .action(function (tag, tags, options) {
        tags = tags || [];
        tags.push(tag);
        var files = tagit.tagged(getDir(options.parent), tags);
        if (files) {
            _.each(files, function (f) {
                console.log(f.name)
            })
        } else {
            console.log("There are no files matching tags %s", tags);
        }
    });

program
    .command('untag <file> <tag> [tags...]')
    .description('Remove all given tags from file')
    .action(function (f, tag, tags, options) {
        var allTags = tags || [];
        allTags.push(tag);
        tagit.untag(getDir(options.parent), f, allTags);
    });

program
    .command('remove <file>')
    .description('remove file from index')
    .action(function (f, options) {
        tagit.remove(getDir(options.parent), f);
    });

program
    .command('random [tags...]')
    .description('Choose a random file matching the specified tags.')
    .action(function (tags, options) {
        var f = tagit.random(getDir(options.parent), tags);
        if (f) {
            console.log(f.name);
        } else {
            console.log("No file found matching tags %s", tags)
        }
    });

program
    .command('*')
    .description('')
    .action(function (args) {
        console.log('Unknown action %s', args);
        program.help();
    });

program.parse(process.argv);

if (program.args.length === 0) {
    program.help();
}

// utility functions
function getDir(options) {
    return options.directory || ".";
}