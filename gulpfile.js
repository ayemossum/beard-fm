var gulp = require('gulp');
var sass = require('gulp-sass');
var nodemon = require('gulp-nodemon');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');
var jade = require('gulp-jade');
var concat = require('gulp-concat');
var foreach = require('gulp-foreach');
var path = require('path');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('start', function () {
  nodemon({
    script: "app.js",
    ext: "js html jade json",
    env: { "NODE_ENV": 'development' }
  });
});

gulp.task('sass', function () {
  gulp.src('scss/*.scss')
    .pipe(sass({includePaths: ["./node_modules/singularitygs/stylesheets/","./node_modules/breakpoint-sass/stylesheets/"]}).on('error',sass.logError))
	.pipe(autoprefixer(['last 2 versions']))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./scss/**/*.scss', ["sass"]);
});

gulp.task('jade', function () {
  gulp.src('views/**/_*.jade')
    .pipe(foreach(function(stream,file){
      var filename=path.basename(file.path);
      filename = filename.split('.')[0].substr(1);
      return stream
       .pipe(jade({
         client: true,
         name: filename
       }));
    }))
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('public/js'));
});

gulp.task('jade:watch', function () {
  gulp.watch('./views/**/_*.jade', ["jade"]);
});
gulp.task('default', function () {
  runSequence( ["sass", "sass:watch", "jade", "jade:watch"], "start" );
});
