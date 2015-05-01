/// <reference path="types/node/node.d.ts" />
/// <reference path="types/commander/commander.d.ts" />
import program = require('commander');
import tagit = require('./lib/tagit');

/**
 *  Global error handler, last step before crashing.
 */

process.on('uncaughtException', function (err:any) {
    if (err instanceof tagit.NoRepositoryError) {
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
    .command('init [directory]')
    .description('Initialize directory for file tagging')
    .action(function (dir) {
        var repo = makeRepo(dir);
        repo.init(function (err, initialized) {
            if (!err) {
                if (initialized) {
                    console.log("Initialized %s", repo.workDir);
                } else {
                    console.log("%s is already initialized", repo.workDir);
                    process.exit(1);
                }
            } else {
                console.error(err.message);
                process.exit(1);
            }
        });
    });


program
    .command('update')
    .description('Update the index by adding new files and removing missing ones')
    .action(function () {
        makeRepo().update();
    });

program
    .command('autotag')
    .description('Automatically tag all files extracting tags from their filenames')
    .action(function () {
        makeRepo().autotag();
    });

program
    .command('tag <file> <tag> [tags...]')
    .description("Tag a file with the given tags")
    .action(function (f, tag, otherTags) {
        var allTags = otherTags || [];
        allTags.push(tag);
        makeRepo().tag(f, allTags, function (err) {
            if (err && err.code === 'ENOENT') {
                console.log('Can\'t tag inexistent file ' + f);
                process.exit(1);
            } else {
                console.log('Tagged file %s with tags %s', f, allTags.toString());
            }
        });
    });

program
    .command('tags [file]')
    .description('List tags for file. If no file is given list all available tags')
    .action(function (f) {
        if (f) {
            console.log(makeRepo().tags(f));
        }
        else {
            makeRepo().allTags().forEach(function (tag) {
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
        var files = makeRepo().tagged(tags);
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
        makeRepo().untag(f, allTags);
    });

program
    .command('remove <file>')
    .description('remove file from index')
    .action(function (f) {
        makeRepo().remove(f);
    });

program
    .command('random [tags...]')
    .description('Choose a random file matching the specified tags.')
    .action(function (tags) {
        var f = makeRepo().random(tags);
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
 * @returns {Tagit}
 */
function makeRepo(dir?:string) {
    if (!dir) {
        dir = !!program.optionFor('directory') ? program.optionFor('directory').toString() : ".";
    }
    return new tagit.Tagit(dir);
}