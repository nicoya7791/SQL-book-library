var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { sequelize } = require('./models');

var indexRouter = require('./routes/index');
var booksRouter = require('./routes/books');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/books', booksRouter);

//global error, catch 404 and forward to error handler
app.use(function (req, res, next) {
  const error = new Error('Your page was not found!');
  error.status = 404;
  next(error);
});

//  Global error handler
app.use(function (error, req, res, next) {
  if (error.status === 404) {
    console.log(error.message);
    res.status(404)
      .render('page-not-found', { error });
  } else {
    error.message = 'Something went really wrong';
    res.status(error.status || 5000);
    res.render('errors', { error });
  }
});

module.exports = app;
