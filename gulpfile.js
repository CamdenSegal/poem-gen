var gulp = require('gulp'),
	concat = require('gulp-concat'),
	del = require('del'),
	fs = require('fs'),
	path = require('path'),
	merge = require('merge-stream');

gulp.task('clean', function(cb) {
	del(['data/*.txt'], cb);
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
		return gulp.src(path.join('data', folder, '/*.txt'))
			.pipe(concat(folder + '.txt'))
			.pipe(gulp.dest('data'));
	});

	return merge(tasks);
});

gulp.task('concat-all', ['clean'], function(){
	return gulp.src('data/**/*.txt')
			.pipe(concat('all.txt'))
			.pipe(gulp.dest('./data/'));
});

gulp.task('concat', ['concat-all', 'concat-folders']);
