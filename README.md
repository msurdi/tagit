[![Build Status](https://travis-ci.org/msurdi/tagit.svg?branch=master)](https://travis-ci.org/msurdi/tagit)

Tagit
=====

Tagit is a command line tool for tagging files. It could be used as a quick'n dirty way of organising a media
library.



Installation
------------

    npm install -g tagit
    

Usage
-----

    cd ~/Music                      // Or anywhere where you have your files
    tagit init                      // Initialize internal database
    tagit update                    // Recursively scan current directory and add all files to the index
    tagit autotag                   // Tag all files in the index extracting tags from filenames
    tagit tagged rock               // List all files tagged with 'rock'
    tagit tagged rock heavy         // List all files tagged with 'rock' and 'heavy'
    tagit random                    // Pick a random file
    tagit random pop                // Pick a random file tagged with 'pop'
    tagit tag my_song.mp3 favourite // Tag my_song.mp3 with tag 'favourite'
    
