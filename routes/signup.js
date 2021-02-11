const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const sendotp = require('./sendotp');
const database = require('./database');
const logger = require('./logger');

const saltRounds = 10;
const client = database.client;
const User = database.User;
mongoose.connect(database.uri,{useNewUrlParser:true, useUnifiedTopology: true});

let msg = null;
let otp = null;

//signup 
router.get('/',(req,res) => {
	res.render('signup/signup', {msg : msg});
	msg = null;
	logger.set_logger(null);
});

//otp
router.post('/otp', (req,res) => {
    const db = client.db('bank');
    const collection = db.collection('customers');
	collection.findOne({email : req.body.email}, (err,user) => {
		if(user) {
			msg = '*Account Already Exists';
			res.redirect('/signup');
		}
		else {
			otp = sendotp(req.body.email);
			setTimeout( () => {otp = null;} , 10*60000);
			res.render('signup/otp',{email : req.body.email});
		}
	});
});

//details
router.post('/details', (req,res) => {
	if(otp == req.body.otp) res.render('signup/details',{ email : req.body.email });
	else {
        msg = '*Wrong OTP';
		res.redirect('/signup');
	}
});

//newaccount creation
router.post('/newaccount', (req,res) => {
    const db = client.db('bank');
    const collection = db.collection('customers');
	collection.findOne({email:req.body.email}, (err,user) => {
		if(user){
			msg = '*Account Already Exists';
			res.redirect('/signup');
		}
		else{
			bcrypt.hash( req.body.password, saltRounds , (err,hash) => {
				const account = new User({
					name : req.body.name,
					email : req.body.email,
					password : hash,
					mobile : req.body.mobile,
					address : req.body.address
				});
				account.save( (err) => {
					if(err) console.log('Unable to create account...!');
					else console.log('Account Created...!');
					logger.set_msg('Your Account has been Created...!');
					res.redirect(307,'/account');                                       
				});
			});
		}
	});
});

module.exports = router;