const LocalStrategy = require('passport-local').Strategy;
const UserModel = require('../models/User');
const bcrypt = require('bcrypt');

function initializePassport(passport){

    const authenticateUser = (email, password, done) => {
        UserModel.findOne({email:email},(err,user)=> {
            if(user==null){
                return done(null,false,{message:"*Account doesn't Exist"});
            }
            bcrypt.compare(password,user.password,(err,hash)=>{
                if(hash) return done(null,user);
                return done(null,false,{message:"*Incorrect Password"});
            });
        })        
    }

    passport.use(new LocalStrategy({usernameField: 'email'},authenticateUser))

    passport.serializeUser((user,done) => done(null,user._id));

    passport.deserializeUser((id,done) => {
        UserModel.findById(id,(err,user)=>{
            return done(err, user)
        })
    });
}

function checkAuthenticated(req,res,next){
    if(req.isAuthenticated()) return next();
    return res.redirect('/login');
}

function checkNotAuthenticated(req,res,next){
    if(req.isAuthenticated()) return res.redirect('/account');
    return next();
}

module.exports = {initializePassport, checkAuthenticated, checkNotAuthenticated};