const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const validator = require('express-validator');
const fileUpload = require('express-fileupload');
var AWS = require('aws-sdk');
const dotenv = require('dotenv');
const redis = require('redis');
const redisClient = redis.createClient(6379, 'session-cache.774h6u.ng.0001.use2.cache.amazonaws.com');
const redisStore = require('connect-redis')(session);

/*
if(process.env.NODE_ENV === 'aws'){
  dotenv.config( {path: "./environments/aws.env"});
}else{
  dotenv.config( {path: "./environments/local.env"});
}*/

dotenv.config( {path: "../environments/aws.env"});

const database={
  host:process.env.HOST,
  port:process.env.PORT_DB,
  user:process.env.USER_DB,
  password:process.env.PASSWORD_DB,
  database:process.env.DATABASE
};
//inicializar
const app = express();
require('./lib/passport');


redisClient.on('error', (err) => {
  console.log('Redis error: ', err);
});


//settings 
app.set('port', process.env.PORT);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  layoutsDir: path.join(app.get('views'), 'layouts'),
  partialsDir: path.join(app.get('views'), 'partials'),
  extname: '.hbs',
  helpers: require('./lib/handlebars')
}))
app.set('view engine', '.hbs');

//Middlewares

app.use(morgan('dev'));
app.use(express.urlencoded({extended: false})); 
app.use(express.json()); 
app.use(fileUpload());

app.use(session({
   secret: 'alex',
   resave: false,
   saveUninitialized: false,
   store: new redisStore({ host: 'session-cache.774h6u.ng.0001.use2.cache.amazonaws.com', port: 6379, client: redisClient, ttl: 86400 })
//   store: new MySQLStore(database)
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
//app.use(validator());

//Global variables
app.use ((req, res, next) =>{
  app.locals.success = req.flash('success');
  app.locals.message = req.flash('message');
  app.locals.user = req.user;  
  next();
});

//routes
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use('/links',require('./routes/links'));
app.use('/videos',require('./routes/videos'));

//public

app.use(express.static(path.join(__dirname, 'public')));

//start de server


app.listen(app.get('port'), () => {
    console.log('Server en puerto', app.get('port'));
});
