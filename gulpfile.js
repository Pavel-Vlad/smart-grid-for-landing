// require packages
const gulp = require('gulp'),
    stylus = require('gulp-stylus'),
    maps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    cleancss = require('gulp-clean-css'),
    del = require('del'),
    uglify = require('gulp-uglify'),
    babel = require('gulp-babel'),
    imagemin = require('gulp-imagemin'),
    cache = require('gulp-cache'),
    imageminPngquant = require('imagemin-pngquant'),
    imageminZopfli = require('imagemin-zopfli'),
    imageminMozjpeg = require('imagemin-mozjpeg'), //need to run 'brew install libpng'
    imageminGiflossy = require('imagemin-giflossy'),
    gcmq = require('gulp-group-css-media-queries'),
    browserSync = require('browser-sync').create(),
    strip = require('gulp-strip-comments');

// define paths
const paths = {
    root: {
        src: 'src',
        dest: 'app'
    },
    html: {
        src: 'src/*.html',
        dest: 'app'
    },
    styles: {
        styl: 'src/styles/styl/*.styl',
        dev: 'src/styles/',
        srcProd: 'src/styles/*.css',
        prod: 'app/styles/'
    },
    scripts: {
        srcDev: 'src/js/dev/*.js',
        destDev: 'src/js/',
        srcProd: 'src/js/*.js',
        destProd: 'app/js/'
    },
    images: {
        src: 'src/images/*.{jpg,jpeg,png}',
        dest: 'app/images/'
    }
};

// define tasks
function clean() {
    return del(['app']);
}

function html() {
    return gulp.src(paths.html.src)
        .pipe(strip())
        .pipe(gulp.dest(paths.html.dest))
}

function stylesDev() {
    return gulp.src(paths.styles.styl)
        .pipe(maps.init())
        .pipe(stylus())
        .pipe(maps.write('.'))
        .pipe(gulp.dest(paths.styles.dev))
        .pipe(browserSync.reload({
            stream: true
        }));
}

function stylesProd() {
    return gulp.src(paths.styles.srcProd)
        .pipe(gcmq())
        .pipe(autoprefixer({
            browsers: ['> 0.1%'],
            cascade: false,
            grid: "autoplace"
        }))
        .pipe(cleancss())
        .pipe(gulp.dest(paths.styles.prod))
}

function scriptsDev() {
    return gulp.src(paths.scripts.srcDev)
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest(paths.scripts.destDev))
        .pipe(browserSync.reload({
            stream: true
        }));
}

function scriptsProd() {
    return gulp.src(paths.scripts.srcProd)
        .pipe(strip())
        .pipe(uglify())
        .pipe(gulp.dest(paths.scripts.destProd))
}

function images() {
    return gulp.src(paths.images.src, {since: gulp.lastRun(images)})
        .pipe(cache(imagemin([
            //png
            imageminPngquant({
                speed: 1
            }),
            imageminZopfli({
                more: true
                // iterations: 50 // very slow but more effective
            }),
            //gif
            imageminGiflossy({
                optimizationLevel: 3,
                optimize: 3, //keep-empty: Preserve empty transparent frames
                lossy: 2
            }),
            //svg
            imagemin.svgo({
                plugins: [{
                    removeViewBox: false
                }]
            }),
            //jpg lossless
            imagemin.jpegtran({
                progressive: true
            }),
            //jpg very light lossy, use vs jpegtran
            imageminMozjpeg({
                quality: 90
            })
        ])))
        .pipe(gulp.dest(paths.images.dest))
}

function serve() {
    browserSync.init({
        server: {
            baseDir: paths.root.src
        }
    });
    gulp.watch(paths.html.src).on('change', browserSync.reload);
    gulp.watch(paths.styles.styl).on('change', stylesDev);
    gulp.watch(paths.scripts.srcDev).on('change', scriptsDev);
}

gulp.task('dev', gulp.series(stylesDev, scriptsDev, serve));

gulp.task('prod', gulp.series(clean, html, stylesProd, scriptsProd, images));

