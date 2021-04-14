const express = require('express');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');

require('dotenv-safe').config();
require('./config/database-config');

const app = express();
const PORT = process.env.PORT;
const {checkAuthenticated, checkNotAuthenticated} = require('./config/passport-config')

//Serve static files
app.use(express.static('public'));

//Template engine
app.set('view engine', 'ejs');

//middleware
app.use(express.urlencoded({
    extended: false
}));

app.use(express.json());

app.use(flash());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

//Routes

//Home
app.get('/',checkNotAuthenticated, (req, res) => {
    res.render('home');
});

//SignUp
const signup = require('./routes/signup');
app.use('/signup', signup);

//Login
const login = require('./routes/login');
app.use('/login', login);

//Account
const account = require('./routes/account');
app.use('/account', account);

//About
app.get('/about',checkNotAuthenticated, (req, res) => {
    res.render('about');
});


app.listen(PORT, async (err) => {
    console.log(`Listening on port ${PORT}...!`);
});
