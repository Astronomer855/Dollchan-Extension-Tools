var gulp = require('gulp');
var strip = require('gulp-strip-comments');
var headerfooter = require('gulp-headerfooter');
var replace = require('gulp-replace');
var spawn = require('child_process').spawn;
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var babelify = require('babelify');
var streamify = require('gulp-streamify');

var paths = {
	scripts: [
		'src/es5-polyfills.js',
		'src/Dollchan_Extension_Tools.es6.user.js',
		'Dollchan_Extension_Tools.meta.js'
	],
};

gulp.task('updatecommit', function(cb) {
	var git = spawn('git', ['rev-parse', 'HEAD']);
	var stdout, stderr;
	git.stdout.on('data', function(data) {
		stdout = String(data);
	});
	git.stderr.on('data', function(data) {
		stderr = String(data);
	});
	git.on('close', function(code) {
		if(code !== 0) {
			throw 'Git error:\n' + (stdout ? stdout + '\n' : '') + stderr;
		}
		gulp.src('src/Dollchan_Extension_Tools.es6.user.js')
			.pipe(replace(/^const commit = '[^']*';$/m, 'const commit = \'' + stdout.trim().substr(0, 7) + '\';'))
			.pipe(gulp.dest('./src/'))
			.on('end', cb);
	});
});

gulp.task('make', ['updatecommit'], function() {
	return browserify(['./src/es5-polyfills.js', './src/Dollchan_Extension_Tools.es6.user.js'])
		.transform(babelify)
		.bundle()
		.pipe(source('Dollchan_Extension_Tools.user.js'))
		.pipe(streamify(strip()))
		.pipe(streamify(headerfooter('(function de_main_func_outer(localData) {\n', '})(null);')))
		.pipe(streamify(headerfooter.header('Dollchan_Extension_Tools.meta.js')))
		.pipe(gulp.dest('./'));
});

gulp.task('makeall', ['make'], function() {
	return gulp.src('./Dollchan_Extension_Tools.user.js')
		.pipe(replace('global.regenerator', 'window.regenerator'))
		.pipe(gulp.dest('./dollchan-extension/data'));
});

gulp.task('watch', function() {
	gulp.watch(paths.scripts, ['make']);
});

gulp.task('default', ['make', 'watch']);
