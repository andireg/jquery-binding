// Module definieren
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var ts = require('gulp-typescript');

// Script task
gulp.task('default', function() {
    gulp.src('src/*.ts')
        .pipe(ts({
            noImplicitAny: false,
            target: 'ES5'
        }))
        .pipe(gulp.dest('dist/full/'));

    gulp.src('dist/full/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist/min/'));
});