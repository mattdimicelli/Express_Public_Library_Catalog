import createError from 'http-errors';
import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import catalogRouter from './routes/catalog.js';

const app = express();
const __dirname = fileURLToPath(dirname(import.meta.url));

// set up mongoose connection
import mongoose from 'mongoose';
const dev_db_url = 'mongodb+srv://mrd2689a:ode7SLb43TLDwFGG@cluster0.umci8.mongodb.net/local_library?retryWrites=true&w=majority';
const mongoDB = process.env.MONGODB_URI;
//  || dev_db_url;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });  
/* The useNewUrlParser option exists simply as a fallback in case the new parser
has a bug.  useUnifiedTopology should gnrly be set to true, since it opts into using
MongoDB's driver's new connection management engine */
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json()); /* parses incoming requests with JSON payloads.  only will
look at requests where the Content-Type header matches the type option.  A new body
object containing the parsed data is populated on the req object after the middleware (eg.
  req.body), or an empty object {} if there was no body to parse, the Content-Type was
  not matched, or an error occurred */
app.use(express.urlencoded({ extended: false }));  /*parses incoming requests with urlencoded
payloads.  {extended: false} means that nested objects will not be parsed*/
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));  //argument in next goes to error-handler
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
