"use strict";

var program = require('commander');
var tagit = require('./tagit');

program
    .version('0.0.1')
    .option('-d --directory <directory>', 'Taggit work directory')

program
    .command('init [dir]')
    .description('Initialize directory for file tagging')
    .action(function (dir, options) {
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
    .description('Update the index by adding new files and removing non existing ones')
    .action(function () {
        tagit.update();
    });

program
    .command('tag <file> <tag> [tags...]')
    .description("Tag a file with the given tags")
    .action(function (f, tag, otherTags, options) {
        var allTags = otherTags || [];
        var dir = options.parent.directory || ".";
        allTags.push(tag);
        console.log('Tagging file %s with tags %s', f, allTags.toString());
        tagit.tag(dir, f, allTags);
    });

program
    .command('tags <file>')
    .description('List current tags for the given file')
    .action(function (f, options) {
        var dir = options.parent.directory || ".";
        console.log(tagit.tags(dir, f));
    }
);


program
    .command('tagged <tag> [tags...]')
    .description('List files matching all given tags')
    .action(function (f, tag, tags, options) {

    });

program
    .command('untag <file> <tag> [tags...]')
    .description('Remove all given tags from file')
    .action(function (f, tag, tags, options) {

    });

program
    .command('remove <file>')
    .description('remove file from index')
    .action(function (f, options) {

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