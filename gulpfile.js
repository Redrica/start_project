var gulp = require('gulp'),
    sass = require('gulp-sass'), //Подключаем Sass пакет
    browserSync = require('browser-sync').create(), // Подключаем Browser Sync
    pug = require('gulp-pug'), // Подключаем Pug
    plumber = require('gulp-plumber'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    minify = require('gulp-csso'),
    rename = require('gulp-rename'),
    imagemin = require('gulp-imagemin'),
    del = require('del'),
    run = require('run-sequence'),
    jsmin = require('gulp-jsmin'),
    spritesmith = require('gulp.spritesmith');



gulp.task('pug', function buildHTML() {
    return gulp.src('app/pug/*.pug')
        .pipe(plumber()) // обработка ошибок без прерывания процесса
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('docs'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('sass', function(){ // Создаем таск Sass
    gulp.src('app/sass/**/*.scss') // Берем все scss файлы из папки sass и дочерних, если таковые будут
        .pipe(plumber()) // обработка ошибок без прерывания процесса, без return, иначе после ошибки процесс обновления не происходит
        .pipe(sass({errLogToConsole: true})) // Преобразуем Sass в CSS посредством gulp-sass
        .pipe(postcss([ autoprefixer() ])) // префиксы, список браузеров в package.json
        .pipe(gulp.dest('docs/css')) // Выгружаем результат в папку app/css
        .pipe(minify()) // минифицируем
        .pipe(rename({
            suffix: '.min'
        })) // добавляем суффикс .min
        .pipe(gulp.dest('docs/css')) // кладем туда же минифицированный файл
        .pipe(browserSync.reload({
            stream: true // Обновляем CSS на странице при изменении
        }))
});

gulp.task('jscript', function () {
    gulp.src('app/js/*.js')
        .pipe(plumber())
        .pipe(gulp.dest('docs/js/'))
        .pipe(jsmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('docs/js/'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('clean', function () {
    return del('docs');
});

gulp.task('copy', function () {
    return gulp.src([
        'app/fonts/**/*.{woff,woff2}',
        'app/libs/**/*.js'
    ], {
        base: 'app'
    })
        .pipe(gulp.dest('docs'))
});

gulp.task('images', function () {
   return gulp.src('app/img/**/*')
       .pipe(imagemin([
           imagemin.optipng({
               optimizationLevel: 3
           }),
           imagemin.jpegtran({
               progressive: true
           }),
           imagemin.svgo()
       ], {
           verbose: true
       }))
       .pipe(gulp.dest('docs/img'))
});

gulp.task('sprite', function() {
    var spriteData =
        gulp.src('./app/img/sprite/*.*') // путь, откуда берем картинки для спрайта
            .pipe(spritesmith({
                imgName: 'sprite.png',
                cssName: '_sprite.scss',
                cssFormat: 'scss',
                padding: 5,
                algorithm: 'binary-tree',
                cssVarMap: function(sprite) {
                    sprite.name = 's-' + sprite.name
                },
                cssTemplate: 'scss.template.handlebars'
            }));

    spriteData.img.pipe(gulp.dest('./docs/img/')); // путь, куда сохраняем картинку
    spriteData.css.pipe(gulp.dest('./app/sass/')); // путь, куда сохраняем стили
    // spriteData.pipe(browserSync.reload({stream: true})); // Обновляем CSS на странице при изменении
});

gulp.task('browser-sync', function() { // Создаем таск browser-sync
    browserSync.init({ // Выполняем browser Sync
        server: { // Определяем параметры сервера
            baseDir: 'docs'
        },
        notify: false // Отключаем уведомления
    });
});

gulp.task('watch', ['browser-sync'], function() {
    gulp.watch('app/sass/**/*.scss', ['sass']); // Наблюдение за sass файлами
    gulp.watch('app/pug/*.pug', ['pug']); // Наблюдение за Pug файлами
    gulp.watch('app/js/*.js', ['jscript']); // Наблюдение за главным JS файлом и за библиотеками
});

gulp.task('develop', function (fn) {
   run(
       'clean',
       'copy',
       'images',
       'pug',
       'sass',
       'jscript',
       fn
   ) ;
});
