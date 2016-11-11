var gulp = require('gulp'),
    $ = require('gulp-load-plugins')();

gulp.task('postpublish', function (done) {
  const pkg = require('./package.json');
  const version = `v${ pkg.version }`;
  const message = `Release ${ version }`;
  gulp.src('./package.json')
    .pipe($.git.commit(message))
    .on('end', function () {
      $.git.tag(version, message, function (err) {
        if (err) {
          $.util.log($.util.colors.red(err));
          done();
        } else {
          $.git.push('origin', 'master', { args: " --tags" }, function (err) {
            if (err) {
              $.util.log($.util.colors.red(err));
            }
            done();
          });
        }
      });
    });
});