var pogen = require('./lib/poem-gen');

pogen('data/poe.txt', {
	//verbose: true
	repeat: 2,
	scheme: 'limerick'
}, function( poem ) {
	poem.generateLines( );

	poem.toString();
});

