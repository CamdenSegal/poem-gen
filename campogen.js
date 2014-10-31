var rhyme    = require('rhyme'),
	readline = require('readline'),
	fs       = require('fs'),
	util     = require('util');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var schemes = {
	'sonnet': ['a10', 'b10', 'a10', 'b10', 'c10', 'd10', 'c10', 'd10', 'e10', 'f10', 'e10', 'f10', 'g10', 'g10'],
	'haiku': ['a5','b7','c5'],
	'simple': ['a8','a8'],
	'alternating': ['a8','b8','a8','b8'],
	'limerick': ['a9','a9','b6','b6','a9']
}

var scheme = schemes['haiku'],
	rhymeGroups = {},
	text = '',
	wordMap = {},
	lines = [],
	curLine = 0,
	r;

var makeLines = function( number ) {
	var i, schemeGroup, rhyme;

	for (i = 0;i < number; i += 1) {
		if ( i % scheme.length == 0 ) {
			rhymeGroups = {};
		}
		schemeGroup = scheme[ i % scheme.length ];
		rhyme = '';
		if ( rhymeGroups[schemeGroup.substr(0,1)] ) {
			rhyme = rhymeGroups[schemeGroup.substr(0,1)]
		}
		makeLine( rhyme, parseInt( schemeGroup.substr(1), 10 ) );
		if ( ! rhyme ) {
			rhymeGroups[schemeGroup.substr(0,1)] = lines[i][0];
		}
		//printLine( lines[i] );
		util.print('.');
	}
	util.print('\n');
};

var makeLine = function( rhyme, syllables ){
	var line = [],
		i = 1,
		syls = 0,
		word,
		syl;

	line.push( pickRhyme( rhyme ) );

	syls += getSyllables( line[0] );
	while (syls < syllables) {
		word = choosePrevWord( line[i - 1] )
		line.push( word );
		syls += getSyllables( word );
		i += 1;
	}

	lines.push(line);

	return line;
};

var getSyllables = function( word ) {
	syl = r.syllables( word );
	if ( isNaN( syl ) ) {
		syl = Math.floor(word.length / 3);
	}
	return syl;
}

var printPoem = function() {
	var i;

	for (i=0;i<lines.length;i+=1) {
		printLine(lines[i], (i == 0), (i == lines.length-1));
	}
};

var printLine = function( line, capitalize, end ) {
	var output = line.reverse().join(' ');
	if ( capitalize ) {
		output = output[0].toUpperCase() + output.substr( 1 );
	}
	if ( end ) {
		output += '.';
	} else {
		output += ',';
	}
	console.log( output );
	line.reverse();
};

var pickRandomWord = function() {
    var result;
    var count = 0;
    for (var prop in wordMap)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
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

	// TODO shuffle rhymes

	for (i = 0; i < rhymes.length; i += 1) {
		if ( wordMap[rhymes[i].toLowerCase()] ) {
			return rhymes[i].toLowerCase();
		}
	}

	return false;
}

var parseTextToWordMap = function() {
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

console.log('Loading...');
rhyme(function(tr) {
	console.log('Loaded rhymes');
	r = tr;

	fs.readFile(process.argv[2], 'utf8', function(err,data){
		text = data;

		if ( process.argv[3] ) {
			scheme = schemes[process.argv[3]];
		}

		var repeat = 1;
		if ( process.argv[4] ) {
			repeat = parseInt( process.argv[4], 10 );
		}

		parseTextToWordMap();

		makeLines( scheme.length * repeat );

		printPoem();

		process.exit(0);
	});
});