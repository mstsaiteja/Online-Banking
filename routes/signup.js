const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const sendotp = require('../controllers/sendotp');

const UserModel = require('../models/User');
const {checkNotAuthenticated} = require('../config/passport-config');

router.use(checkNotAuthenticated);

//signup 
router.get('/',(req,res) => {
	res.render('signup/signup', {msg : req.flash('msg')});
});

//otp
router.post('/otp', (req,res) => {
	UserModel.findOne({email : req.body.email}, (err,user) => {
		if(user) {
			req.flash('msg','*Account Already Exists');
			res.redirect('/signup');
		}
		else {
			const otp = sendotp(req.body.email);
			req.flash('signup_otp',`${otp}`);
			setTimeout(()=>{req.flash('signup_otp',null)},10*60*1000)
			res.render('signup/otp',{email : req.body.email});
		}
	});
});

//details
router.post('/details', (req,res) => {
	const otp = req.flash('signup_otp');
	if(otp == req.body.otp) res.render('signup/details',{ email : req.body.email });
	else {
        req.flash('msg','*Wrong OTP');
		res.redirect('/signup');
	}
});

//newaccount creation
router.post('/newaccount', (req,res) => {
	UserModel.findOne({email:req.body.email}, (err,user) => {
		if(user){
			req.flash('msg','*Account Already Exists');
			res.redirect('/signup');
		}
		else{
			bcrypt.hash(req.body.password,10, (err,hash) => {
				const User = new UserModel({
					name : req.body.name,
					email : req.body.email,
					password : hash,
					mobile : req.body.mobile,
					address : req.body.address,
					amount: 1000,
					transactions: [{
						time: new Date(),
						details: 'Account Creation',
						amount: 1000
					}]
				});
				User.save( (err) => {
					if(err) console.log('Unable to create account...!');
					else console.log('Account Created...!');
					req.flash('logger_msg','Your Account has been Created...!')
					res.redirect(307,'/login/check_account');
				});
			});
		}
	});
});

module.exports = router;