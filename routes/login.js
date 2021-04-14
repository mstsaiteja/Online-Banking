const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');

const UserModel = require('../models/User');
const sendotp = require('../controllers/sendotp');

const {checkNotAuthenticated} = require('../config/passport-config');

router.use(checkNotAuthenticated);

//Passport Authentication
const {initializePassport} = require('../config/passport-config');
initializePassport(passport);

//login
router.get('/',(req,res) => {
	res.render('login/login',{msg: req.flash('error')});
});

//check account
router.post('/check_account', passport.authenticate('local',{
	successRedirect: '/account',
	failureRedirect: '/login',
	failureFlash: true
}));

//forgot password
router.get('/forgot_password', (req,res) => {
    res.render('login/forgot_password',{msg : req.flash('forgot_msg')});
});

//otp
router.post('/forgot_password/otp', (req,res) => {
	UserModel.findOne({ email : req.body.email }, (err,user) => {
		if(user) {
			const otp = sendotp(req.body.email);
			req.flash('forgot_otp',`${otp}`);
			setTimeout(()=>{req.flash('forgot_otp',null)},10*60*1000)
			res.render('login/otp',{email : req.body.email});
		}
		else {
			req.flash('forgot_msg',"*Account doesn't Exist");
			res.redirect('/login/forgot_password');
		}
	});
});

//details
router.post('/forgot_password/new', (req,res) => {
	const otp = req.flash('forgot_otp');
	if(otp == req.body.otp) res.render('login/password',{ email : req.body.email });
	else{
        req.flash('forgot_msg','*Wrong OTP');
		res.redirect('/login/forgot_password');
	}
});

router.post('/forgot_password/update', (req,res) => {
	const query = {email: req.body.email};

	UserModel.findOne(query, (err,result) => {
		bcrypt.hash(req.body.password,10,(err,result) => {
			const new_values = { $set : {password : result} };
			UserModel.updateOne(query , new_values, (err) => {
				if(err) console.log('Unable to update password...!');
				else console.log(`Password Successfully Updated...!`);
				req.flash('logger_msg','Your Password was Successfully Updated...!')
				res.redirect(307,'/login/check_account');                                  
			});
		});
	});
});

module.exports = router;