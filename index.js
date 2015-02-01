var program = require('commander');
var _ = require('underscore');
var tagit = require('./tagit');

program.version('0.0.1');

program
    .command('init [dir]')
    .description('Initialize directory for file tagging')
    .action(function (dir, options) {
        dir = dir || '.';
        tagit.root(dir).init(function (err, initialized) {
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
    .option('-d --directory', 'Taggit work directory')
    .action(function () {
        tagit.update();
    });

program
    .command('tag <file> <tag> [tags...]')
    .description("Tag a file with the given tags")
    .action(function (f, tag, otherTags) {
        var allTags = otherTags || [];
        allTags.push(tag);
        allTags = _.uniq(allTags);
        console.log('Tagging file %s with tags %s', f, allTags.toString());
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