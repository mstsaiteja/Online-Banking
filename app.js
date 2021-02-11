const express = require('express');
const logger = require('./routes/logger');
const database = require('./routes/database');

const app = express();
const PORT = process.env.PORT || 3000;

//Serve static files
app.use(express.static('public'));

//Template engine
app.set('view engine', 'ejs');

//middleware
app.use(express.urlencoded({
    extended: false
}));


//Routes

//Home
app.get('/', (req, res) => {
    res.render('home');
    logger.set_logger(null);
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
app.get('/about', (req, res) => {
    res.render('about');
    logger.set_logger(null);
});

app.listen(PORT, async (err) => {
    console.log(`Listening on port ${PORT}...!`);
    database.connect();
});
