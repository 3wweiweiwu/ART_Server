var gulp = require('gulp');
var mocha = require('gulp-mocha');
var batch = require('gulp-batch');
gulp.task('default',function(){
    return gulp.watch(['controllers/**', 'model/**','routes/**','validation/**'], batch(function (events, cb) {
    return gulp.src(['**/spec*.js'])
        .pipe(mocha({ reporter: 'list' }))
        .on('error', function (err) {
            console.log(err.stack);
        });
}));

});
