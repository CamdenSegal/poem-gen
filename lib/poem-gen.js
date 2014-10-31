var rhyme    = require('rhyme'),
	fs       = require('fs'),
	util     = require('util'),
	_        = require('underscore'),
	progress = require('progress'),
	async    = require('async');


var schemes = {
	'sonnet': ['a10', 'b10', 'a10', 'b10', 'c10', 'd10', 'c10', 'd10', 'e10', 'f10', 'e10', 'f10', 'g10', 'g10'],
	'haiku': ['a5','b7','c5'],
	'couplet': ['a8','a8'],
	'triplet': ['a8','a8','a8'],
	'alternating': ['a8','b8','a8','b8'],
	'limerick': ['a9','a9','b6','b6','a9']
};




/*var prev;
var repeat = 1;
var words;
process.argv.forEach(function(val, index, array) {
	if ( index == 2 ) {
		file = val;
	}
	if ( prev == '-s' || prev == '--scheme' ) {
		scheme = schemes[val];
		if ( ! scheme ) {
			scheme = val.split(' ');
		}
	}
	if ( prev == '-r' || prev == '--repeat' ) {
		repeat = parseInt( val, 10 );
	}
	if ( prev == '-w' || prev == '--words' ) {
		words = parseInt( val, 10 );
	}
	prev = val;
});*/

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

		verboseLog( "Poem Generator Ready" );

		poem.generateLines( args );

		cb( poem );
	};

	poem.readFile = function( fileName ) {
		data = fs.readFileSync(file, 'utf8');

		if ( data ) {
			parseTextToWordMap( data );
		}
	};

	var parseTextToWordMap = function( text ) {
		var textA = text.toLowerCase().match(/[a-z]+[\']*[a-z]*/g).reverse(),
			word, i;

		wordMap = {};

		for(i = 0; i < textA.length - 1; i += 1) {
			word = textA[i];
			if ( word ) {
				if ( ! wordMap[word] ) {
					wordMap[word] = [];
				}
				wordMap[word].push( textA[i + 1] );
			}
		}
	};

	var generateLine = function( rhyme, numSyllables ) {
		var line = [],
			i = 1,
			curSyllables = 0,
			word,
			syl;

		line.push( pickRhyme( rhyme ) );

		curSyllables += getSyllables( line[0] );

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
			words = fargs.words;
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
			if ( i % scheme.length == 0 ) {
				rhymeGroups = {};
			}
			schemeGroup = scheme[ i % scheme.length ];
			rhyme = '';
			if ( rhymeGroups[schemeGroup.substr(0,1)] ) {
				rhyme = rhymeGroups[schemeGroup.substr(0,1)]
			}
			poem.lines.push( generateLine( rhyme, parseInt( schemeGroup.substr(1), 10 ) ) );
			if ( ! rhyme ) {
				rhymeGroups[schemeGroup.substr(0,1)] = poem.lines[poem.lines.length - 1][0];
			}

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
		var rhymes = r.rhyme( word );

		if ( rhymes.length == 0 ) {
			return false;
		}

		rhymes = _.shuffle( rhymes );

		for (i = 0; i < rhymes.length; i += 1) {
			if ( wordMap[rhymes[i].toLowerCase()] ) {
				return rhymes[i].toLowerCase();
			}
		}

		return false;
	};

	var getSyllables = function( word ) {
		syl = r.syllables( word );
		if ( isNaN( syl ) ) {
			syl = Math.floor(word.length / 3);
		}
		return syl;
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
		if (wordMap[curWord.toLowerCase()] && wordMap[curWord.toLowerCase()].length > 0){
			possibles = wordMap[curWord.toLowerCase()];
			prevWord = possibles[Math.floor(Math.random() * possibles.length)];
		} else {
			prevWord = pickRandomWord();
		}

		return prevWord;
	};

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
/*
console.log('Loading...');
rhyme(function(tr) {
	console.log('Loaded rhymes');
	r = tr;

	fs.readFile(file, 'utf8', function(err,data){
		text = data;

		parseTextToWordMap();

		if ( words ) {
			while ( poemLength() < words ) {
				makeLines( scheme.length );
			}
		} else {
			makeLines( scheme.length * repeat );
		}

		printPoem();

		console.log( 'LENGTH: ' + poemLength() );

		process.exit(0);
	});
});*/