#!/usr/bin/env node

"use strict";

var program = require('commander');
var tagit = require('./lib/tagit');
var workDir = '.';


/**
 *  Global error handler, last step before crashing.
 */
process.on('uncaughtException', function (err) {
    if (err instanceof tagit.NoDataError) {
        console.log(err.message);
    } else {
        console.log('Unhandled error: %s', err);
        console.log(err.stack);
    }
    process.exit(1);
});


/**
 *  Main CLI parameters
 */
program
    .version('0.0.1')
    .option('-d --directory <directory>', 'Taggit work directory');

program
    .command('init')
    .description('Initialize directory for file tagging')
    .action(function (dir) {
        repo(dir).init(function (err, initialized) {
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
    .action(function () {
        repo().update();
    });

program
    .command('autotag')
    .description('Automatically tag all files extracting tags from their filenames')
    .action(function (options) {
        repo().autotag();
    });

program
    .command('tag <file> <tag> [tags...]')
    .description("Tag a file with the given tags")
    .action(function (f, tag, otherTags, options) {
        var allTags = otherTags || [];
        allTags.push(tag);
        console.log('Tagging file %s with tags %s', f, allTags.toString());
        repo().tag(f, allTags);
    });

program
    .command('tags [file]')
    .description('List tags for file. If no file is given list all available tags')
    .action(function (f, options) {
        if (f) {
            console.log(repo().tags(f));
        }
        else {
            repo().allTags().forEach(function (tag) {
                console.log(tag);
            });
        }
    }
);


program
    .command('tagged <tag> [tags...]')
    .description('List files matching all given tags')
    .action(function (tag, tags) {
        tags = tags || [];
        tags.push(tag);
        var files = repo().tagged(tags);
        if (files) {
            files.forEach(function (f) {
                console.log(f.name);
            });
        } else {
            console.log("There are no files matching tags %s", tags);
        }
    });

program
    .command('untag <file> <tag> [tags...]')
    .description('Remove all given tags from file')
    .action(function (f, tag, tags) {
        var allTags = tags || [];
        allTags.push(tag);
        repo().untag(f, allTags);
    });

program
    .command('remove <file>')
    .description('remove file from index')
    .action(function (f) {
        repo().remove(f);
    });

program
    .command('random [tags...]')
    .description('Choose a random file matching the specified tags.')
    .action(function (tags, options) {
        var f = repo().random(tags);
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

/**
 * Create a Tagit instance for the current work directory;
 *
 * @returns {exports.Tagit}
 */
function repo(dir) {
    if (!dir) {
        dir = !!program.directory ? program.directory : ".";
    }
    return new tagit.Tagit(dir);
}