var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var minifyCSS = require('gulp-minify-css');
var rename = require('gulp-rename');
var image = require('gulp-image');

gulp.task('scripts', function() {
    gulp.src('res/scripts/*.js')
        .pipe(concat('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/scripts'))
});


gulp.task('styles', function() {
    gulp.src('res/styles/*.css')
        .pipe(minifyCSS())
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('dist/styles'))
});

gulp.task('images', function() {
    gulp.src('res/images/*')
        .pipe(image())
        .pipe(gulp.dest('dist/images'));
});

gulp.task('prepare', ['scripts', 'styles', 'images'], function() {

});