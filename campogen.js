var rhyme = require('rhyme'),
	readline = require('readline'),
	fs = require('fs');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var schemes = {
	'sonnet': ['a10', 'b10', 'a10', 'b10', 'c10', 'd10', 'c10', 'd10', 'e10', 'f10', 'e10', 'f10', 'g10', 'g10'],
	'haiku': ['a5','b7','c5'],
	'simple': ['a8','a8'],
	'alternating': ['a8','b8','a8','b8'],
}

var scheme = schemes['alternating'],
	rhymeGroups = {},
	text = '',
	wordMap = {},
	lines = [],
	curLine = 0,
	r;

console.log('Loading...');
rhyme(function(tr) {
	console.log('Loaded rhymes');
	r = tr;

	fs.readFile(process.argv[2], 'utf8', function(err,data){
		text = data;

		parseTextToWordMap();

		makeLines( 28 );

		printPoem();

		process.exit(0);
	});
});

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
		printLine( lines[i] );
	}
};

var makeLine = function( rhyme, syllables ){
	var line = [],
		i = 1,
		syls = 0,
		word;

	line.push( pickRhyme( rhyme ) );

	syls += r.syllables( line[0] );

	while (syls < syllables) {
		word = choosePrevWord( line[i - 1] )
		line.push( word );
		syls += r.syllables( word );
		i += 1;
	}

	lines.push(line);

	return line;
};

var printPoem = function() {
	var i;

	for (i=0;i<lines.length;i+=1) {
		printLine(lines[i]);
	}
};

var printLine = function( line ) {
	console.log( line.reverse().join(' ') + ',' );
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
		rhymes = r.rhyme(prevRhyme);

	if ( prevRhyme && rhymes.length > 0 ) {
		word = rhymes[Math.floor(Math.random() * rhymes.length)];
	} else {
		word = pickRandomWord();
	}

	return word;
};

var parseTextToWordMap = function() {
	var textA = text.toLowerCase().split(/[^\w\']+/).reverse(),
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