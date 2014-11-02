var gulp = require('gulp'),
	concat = require('gulp-concat')
	jsoncombine = require('gulp-jsoncombine'),
	del = require('del'),
	fs = require('fs'),
	path = require('path'),
	merge = require('merge-stream'),
	_ = require('underscore');

gulp.task('clean', function(cb) {
	del(['data/*.txt', 'data/*.json'], cb);
});

function getFolders(dir) {
	return fs.readdirSync(dir).filter(function(file) {
		return fs.statSync(path.join(dir, file)).isDirectory();
	});
}

gulp.task('concat-folders', function(){
	var folders = getFolders('data');

	var tasks = folders.map(function(folder) {
		// concat into foldername.js
		// write to output
		// minify
		// rename to folder.min.js
		// write to output again
		return gulp.src(path.join('data', folder, '/*.json'))
			.pipe(jsoncombine(folder + '.json', combineWordMaps))
			.pipe(gulp.dest('data'));
	});

	return merge(tasks);
});

gulp.task('concat', ['clean', 'concat-folders'], function(){
	return gulp.src('data/*.json')
			.pipe(jsoncombine('all.json', combineWordMaps))
			.pipe(gulp.dest('./data/'));
});

var combineWordMaps = function( data ) {
	var combined = {};
	for (var file in data) {
		for ( var word in data[file] ) {
			if ( combined[word] ){
				var wordD = data[file][word];
				if ( wordD.rhymes != 'unloaded' && combined[word].rhymes != 'unloaded' ) {
					combined[word].rhymes = _.union( combined[word].rhymes, wordD.rhymes );
				} else {
					combined[word].rhymes = 'unloaded';
				}
				combined[word].priors = combined[word].priors.concat( wordD.priors );
			} else {
				combined[word] = data[file][word];
			}
		}
	}

	return new Buffer(JSON.stringify(combined));
}
