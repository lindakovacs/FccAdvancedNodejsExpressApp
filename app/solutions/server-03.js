// #challenge-3: authenticate as a guest user
//
// Cool, we can see messages now, but before we let people to write messages they need to authenticate first.
// We will use passport and friends for our authentications process, since its well documented and it makes things
// quite easier. By the end of this challenge, you should be able to login to the website as a guest user with
// the credentials:
//                  username: 'guestuser'
//                  password: 'guestuser'
//
// You can check how passport works internally by viewing the best answer from this URL:
//              http://stackoverflow.com/questions/11142882/how-do-cookies-and-sessions-work
//
// Food for thought: Those have to be done all together in order to be easily testable,
//                   if its too much, we must find a way of testing is passport middlewares
//                   that users initialized and validate that they work properly.
//
// ATTENTION: This is the most difficult challenge of these series, be patient and very careful while reading the
//            tips' documentation and have in mind that google is your friend as long as you pay attention at the
//            date on the stackoverflow answers you come accross.
//
// Instructions:
//
// 1) add the 'express-session', passport' and 'passport-local' modules into the package.json file
//
// 2) use express-session middleware #tip1
//
// 3) use passport.session() middleware #tip2
// 4) use passport.session() middleware
// 5) use passport.serialize() middleware
// 6) use passport.deserialize() middleware
//
// 7) use the passport-local.Strategy middleware #tip3
//
// 8) create a login route at POST '/auth/local' #tip2, #tip4
//    the route should redirect to the index page at path '/' on success or fail login
//
// 9) on the res.render('index') arguments add the session user on the 'user' key
//    help: the session user should exist at the request object: 'req.user'
//
// 10) on the index.pug file use an if conditional expression to control what will be rendered  #tip5
//    if the user argument is defined, include chatInput.pug and signout.pug
//    othewise, include authentication.pug
//
// ctrl-f '#challenge' in this file to fill in the missing code to complete this challenge
//
// ATTENTION: Make sure restart the server(do and undo any change in the code for it to auto restart)
//            before u run the unit tests, so that the server's state is cleaned.
//
// Tips:
// express-session readme: https://github.com/expressjs/session
// passport readme: https://github.com/jaredhanson/passport
// passport-local readme: https://github.com/jaredhanson/passport-local
// res.redirect: https://expressjs.com/en/4x/api.html#res.redirect
// pug docs: https://pugjs.org/api/getting-started.html


// Native node.js modules
var http = require('http'); // http protocol
var path = require('path'); // path management
var fs = require('fs'); // file management

// custom modules
var config = require('./config.js');

var fccHelper = require('fcc-advanced-nodejs-express-helper');
var db = fccHelper.db;
var User = db.User;
var Message = db.Message;

db.init(config.db.mongoUrl);

// our core server helper
var express = require('express');

var app = express();
var httpServer = http.Server(app);

// Additional middleware which will set headers that we need on each request.
app.use(function(req, res, next) {
  // Cors setup to make remote client testing possible
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, X-Requested-With');

  next();
});

// the request body parser (json & url params)
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// gzip compression when appropriate
var compression = require('compression');
app.use(compression());

// Static expiry middleware to help serve static resources efficiently
var expiry = require('static-expiry');
var staticDir = path.join(__dirname, 'public');
app.use(expiry(app, {
  dir: staticDir,
  debug: config.environment !== 'production'
}));
// Anything in ./public is served up as static content
app.use('/', express.static(staticDir));


// view engine configuration
var views = require('pug'); // reference pug for custom needs
app.set('view engine', 'pug');
var viewsDir = path.join(__dirname, 'views');
app.set('views', viewsDir);

/*
* #challenge: initialize authentication related middlewares
*             
* express-session
* passport.initialize
* passport.session
* passport.serialize
* passport.deserialize
* passport-local.Strategy
*
* middleware order is important on express
*
* You may use 'User.findOne()' for the passport-local strategy and deserialization middleware
* You may use 'user.verifyPasswordSync(password)' from the user returned for the passport-local strategy
*
* Only change code below this line.
*/

var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


app.use(session({
  secret: config.session.secret,
  resave: true,
  saveUninitialized: true,
}));

// Initialize Passport and restore authentication state,
// if any, from the session
app.use(passport.initialize());

app.use(passport.session());


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
  console.info('serializing user to session: ', user);
  cb(null, user._id);
});

passport.deserializeUser(function(id, cb) {
  User.findOne({_id: id}).exec(cb);
});

passport.use(new LocalStrategy({
    passReqToCallback: true,
    usernameField: 'username',
    passwordField: 'password',
    session: true
  }, function(req, username, password, next) {
    User.findOne({ username: username }).exec(function (err, user) {
      if (err) {
        next(err);
      } else if (!user) {
        next(null, false);
      } else if (!user.verifyPasswordSync(password)) {
        next(null, false);
      } else {
        next(null, user);
      }
    });
  }
));

/*
* Only change code above this line.
*/

app.get('/',
  function (req, res, next) {
    var page = 0;
    var pageCount = 10;

    Message.find({})
    .sort({'createdAt': '-1'})
    .skip(page * pageCount)
    .limit(pageCount)
    .exec(function(err, messages) {
      if (err) {
        next(err);
      } else {

        /*
        * #challenge: add the req.user as the user argument into the render options
        *
        *  
        *
        * Only change code below this line.
        */
        
        res.render('index', {
          user: req.user,
          messages: messages.reverse(),
        });
        
        /*
        * Only change code above this line.
        */        
      }
    });
});


// Authorization related routes

/*
* #challenge: create a login route at POST /auth/local
*
* Only change code below this line.
*/

app.post('/auth/local',
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res, next) { res.redirect('/'); }
);

/*
* Only change code above this line.
*/

httpServer.listen(config.port, '0.0.0.0', function onStart(req, res) {
  console.info('application is listening at uri: ', config.serverUri);
});
