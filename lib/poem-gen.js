var rhyme    = require('rhyme'),
	fs       = require('fs'),
	util     = require('util'),
	path     = require('path'),
	_        = require('underscore'),
	progress = require('progress')
	async = require('async');


var schemes = {
	'sonnet': ['a10', 'b10', 'a10', 'b10', 'c10', 'd10', 'c10', 'd10', 'e10', 'f10', 'e10', 'f10', 'g10', 'g10'],
	'haiku': ['a5','b7','c5'],
	'couplet': ['a8','a8'],
	'triplet': ['a8','a8','a8'],
	'alternating': ['a8','b8','a8','b8'],
	'limerick': ['a9','a9','b6','b6','a9']
};

var defaults = {
	repeats: 1,
	scheme: 'couplet',
	verbose: false
};

module.exports = function( file, args, cb ) {
	var poem = {},
		r,
		scheme,
		rhymeGroups = {},
		wordMap = {};

	args = _.defaults( args, defaults );

	var init = function() {
		poem.lines = [];

		// Load scheme
		scheme = schemes[args.scheme];
		if ( ! scheme ) {
			scheme = args.scheme.split(' ');
		}

		loadRhymes();
	};

	var loadRhymes = function() {
		verboseLog('Loading rhymes library...');

		rhyme( function(tr) {
			verboseLog('Finished Loading');

			r = tr;

			ready();
		} );
	};

	var ready = function() {
		poem.readFile( file );

		if ( args.compile ) {
			console.log( "Finished compiliation" );
		}
		verboseLog( "Poem Generator Ready" );

		poem.generateLines( args );

		cb( poem );
	};

	poem.readFile = function( fileName ) {
		if ( path.extname( fileName ) == '.json' ) {
			wordMap = JSON.parse(fs.readFileSync( fileName, 'utf8' ));
		} else {
			data = fs.readFileSync(file, 'utf8');

			if ( data ) {
				parseTextToWordMap( data );

				if ( args.compile ) {
					fs.writeFileSync( path.join( path.dirname(fileName), path.basename(fileName, '.txt') + '.json' ), JSON.stringify( wordMap ) );
				}
			}
		}
	};

	var parseTextToWordMap = function( text ) {
		var textA = text.toLowerCase().match(/[a-z]+[\']*[a-z]*/g).reverse(),
			word, i, prevWord, bar;

		wordMap = {};

		if ( args.compile ) {
			bar = new progress('[:bar] :percent :etas', {
				total: textA.length + ( args.quick ? 1 : text.length * 10 )
			});
		}

		textA.forEach( function( word, index ) {
			if ( word ) {
				if ( ! wordMap[word] ) {
					wordMap[word] = {
						priors: [],
						rhymes: 'unloaded',
						syllables: 0
					};
				}

				if ( prevWord ) {
					wordMap[prevWord].priors.push( word );
				}

				prevWord = word;

				if ( args.compile ) {
					getSyllables( word );
					bar.tick();
				}
			}
		});

		if ( args.compile && ! args.quick ) {
			textA.forEach( function( word, index ) {
				if ( word ) {
					getRhymes( word );
				}
				bar.tick();
			});
		}
	};

	var generateLine = function( rhyme, numSyllables ) {
		var line = [],
			i = 1,
			curSyllables = 0,
			word,
			syl;

		line.push( pickRhyme( rhyme ) );

		curSyllables += wordMap[line[0]].syllables;
		while (curSyllables < numSyllables) {
			word = choosePrevWord( line[i - 1] )
			line.push( word );
			curSyllables += getSyllables( word );
			i += 1;
		}

		verboseLog( line );

		return line;
	};

	poem.generateLines = function( fargs ) {
		var i = 0,
			schemeGroup, rhyme, words, number;

		if ( fargs.words ) {
			words = parseInt( fargs.words, 10 );
		} else {
			number = fargs.repeats;
			number *= scheme.length;
		}

		var	bar = new progress('[:bar] :percent :etas', {
					total: words || number
				});

		rhymeGroups = {};

		if ( words ) {
			while ( poem.poemLength() < words ) {
				nextLine();
			}
		} else {
			while ( poem.lines.length < number ) {
				nextLine();
			}
		}

		function nextLine() {
			var line;

			// Reste the rhyme group each time scheme repeats
			if ( i % scheme.length == 0 ) {
				rhymeGroups = {};
			}

			// Get current rhyme group char
			schemeGroup = scheme[ i % scheme.length ];

			// Get rhyme group rhyme
			rhyme = '';
			if ( rhymeGroups[schemeGroup.substr(0,1)] ) {
				rhyme = rhymeGroups[schemeGroup.substr(0,1)]
			}

			// Generate new line with rhyme and syllables
			line = generateLine( rhyme, parseInt( schemeGroup.substr(1), 10 ) );
			poem.lines.push( line );

			// If no previous rhyme in rhyme group add this one
			if ( ! rhyme ) {
				rhymeGroups[schemeGroup.substr(0,1)] = line[0];
			}

			// Do progress bar
			if ( words ) {
				bar.tick(poem.lines[poem.lines.length - 1].length);
			} else {
				bar.tick();
			}

			i += 1;
		};
	};

	var pickRhyme = function(prevRhyme) {
		var word = '',
			rhyme;

		if ( prevRhyme ) {
			rhyme = getRhyme(prevRhyme);
			if ( rhyme ) {
				return rhyme;
			}
		}

		while ( ! word ) {
			word = pickRandomWord();
			if ( ! getRhyme( word ) ) {
				// Only allow words with rhymes
				word = '';
			}
		}

		return word;
	};

	var getRhyme = function( word ) {
		var rhymes = getRhymes( word );

		if ( rhymes.length == 0 ) {
			return false;
		}

		return getRandomElement( rhymes );
	};

	var getRhymes = function( word ) {
		var rhymes  = wordMap[word].rhymes,
			rrhymes = [];

		if ( rhymes == 'unloaded' ) {
			rhymes = r.rhyme( word );

			for (var i = 0; i < rhymes.length; i += 1) {
				rhymes[i] = rhymes[i].toLowerCase();
				if ( wordMap[rhymes[i]]) {
					rrhymes.push( rhymes[i] );
				}
			}

			wordMap[word].rhymes = rrhymes;
		}
		return rhymes;
	};

	var getSyllables = function( word ) {
		var syllables = wordMap[word].syllables;
		if ( syllables == 0 ) {
			syllables = r.syllables( word );
			if ( isNaN( syllables ) ) {
				syllables = Math.ceil(word.length / 3);
			}
			wordMap[word].syllables = syllables;
		}
		return syllables;
	};

	var pickRandomWord = function() {
		var result;
		var count = 0;
		for (var prop in wordMap)
			if (Math.random() < 1/++count)
				result = prop;

		return result;
	};

	var choosePrevWord = function( curWord ) {
		var prevWord = '',
			possibles;
		if (wordMap[curWord.toLowerCase()].priors && wordMap[curWord.toLowerCase()].priors.length > 0){
			possibles = wordMap[curWord.toLowerCase()].priors;
			prevWord = getRandomElement( possibles );
		} else {
			prevWord = pickRandomWord();
		}

		return prevWord;
	};

	var getRandomElement = function( array ) {
		return array[Math.floor(Math.random() * array.length)];
	}

	poem.poemLength = function() {
		var words = 0, i;

		for (i = 0; i < poem.lines.length; i += 1) {
			words += poem.lines[i].length;
		}

		return words;
	};

	poem.printLine = function( lineNumber ) {
		var line = poem.lines[lineNumber],
			output = line.reverse().join(' ');

		// Capitalize the first line.
		if ( lineNumber == 0 ) {
			output = output[0].toUpperCase() + output.substr( 1 );
		}

		// End the last line with a period.
		if ( lineNumber == poem.lines.length - 1 ) {
			output += '.';
		} else {
			output += ',';
		}

		console.log( output );

		// Re-reverse the line.
		line.reverse();
	};

	poem.toString = function() {
		var i;
		for (i = 0; i < poem.lines.length; i += 1) {
			poem.printLine( i );
		}
	};

	var verboseLog = function( content ) {
		if ( args.verbose ) {
			console.log(content);
		}
	};

	init();

	return poem;
};