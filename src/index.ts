/// <reference path="typings/all.d.ts" />
require('source-map-support').install();
import program = require('commander');
import tagit = require('./lib/tagit');
import fs = require('fs');
import path = require('path');

/**
 *  Global error handler, last step before crashing.
 */

process.on('uncaughtException', (err:any) => {
    if (err instanceof tagit.NoRepositoryError) {
        console.log(err.message);
    } else {
        console.log('Unhandled error: %s', err);
        console.log(err.stack);
    }
    process.exit(1);
});


function loadMetadata():any {
    var appDir = path.dirname(require.main.filename);
    return JSON.parse(fs.readFileSync(path.join(appDir, '../package.json'), 'utf8'));
}

program
    .version(loadMetadata().version)
    .option('-d --directory <directory>', 'Taggit work directory');

program
    .command('init [directory]')
    .description('Initialize directory for file tagging')
    .action((dir)  => {
        var repo = makeRepo(dir);
        repo.init((err, initialized)  => {
            if (!err) {
                if (initialized) {
                    console.log("Initialized %s", repo.getWorkDir());
                } else {
                    console.log("%s is already initialized", repo.getWorkDir());
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
    .action(()  => {
        makeRepo().update();
    });

program
    .command('autotag')
    .description('Automatically tag all files extracting tags from their filenames')
    .action(()  => {
        makeRepo().autotag();
    });

program
    .command('tag <file> <tag> [tags...]')
    .description("Tag a file with the given tags")
    .action((f, tag, otherTags) => {
        var allTags = otherTags || [];
        allTags.push(tag);
        makeRepo().tag(f, allTags, (err)  => {
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
    .action((f)  => {
        if (f) {
            console.log(makeRepo().tags(f));
        }
        else {
            makeRepo().allTags().forEach((tag)  => {
                console.log(tag);
            });
        }
    }
);


program
    .command('tagged <tag> [tags...]')
    .description('List files matching all given tags')
    .action((tag, tags)  => {
        tags = tags || [];
        tags.push(tag);
        var files = makeRepo().tagged(tags);
        if (files) {
            files.forEach((f)  => {
                console.log(f.name);
            });
        } else {
            console.log("There are no files matching tags %s", tags);
        }
    });

program
    .command('untag <file> <tag> [tags...]')
    .description('Remove all given tags from file')
    .action((f, tag, tags)  => {
        var allTags = tags || [];
        allTags.push(tag);
        makeRepo().untag(f, allTags);
    });

program
    .command('remove <file>')
    .description('remove file from index')
    .action((f)  => {
        makeRepo().remove(f);
    });

program
    .command('random [tags...]')
    .description('Choose a random file matching the specified tags.')
    .action((tags)  => {
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
    .action((args)  => {
        console.log('Unknown action %s', args);
        program.help();
    });


export function run() {
    program.parse(process.argv);

    if (program.args.length === 0) {
        program.help();
    }
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