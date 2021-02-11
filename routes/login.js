const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const database = require('./database');
const sendotp = require('./sendotp');
const logger = require('./logger');

const saltRounds = 10;
const client = database.client;

let msg = null;
let forgot_msg = null;
let otp = null;

//login
router.get('/',(req,res) => {
	res.render('login/login', {msg: msg});
	msg = null;
	logger.set_logger(null);
});

//check account
router.post('/check_account', (req,res) => {
	const db = client.db('bank');
	const collection = db.collection('customers');
	collection.findOne({email : req.body.email}, (err,user) => {
		if(!user){
			msg = "*Account doesn't Exist";
			res.redirect('/login');
		}
		else{
			bcrypt.compare(req.body.password,user.password,(err,hashed) => {
				if(hashed) res.redirect(307,'/account');                             
				else {
					msg = "*Incorrect Password";
					res.redirect('/login');
				}
			});
		}
	});
});

//forgot password
router.get('/forgot_password', (req,res) => {
    res.render('login/forgot_password',{msg : forgot_msg});
    forgot_msg = null;
	logger.set_logger(null);
});

//otp
router.post('/forgot_password/otp', (req,res) => {
	const db = client.db('bank');
	const collection = db.collection('customers');
	collection.findOne({ email : req.body.email }, (err,user) => {
		if(user) {
			otp = sendotp(req.body.email);
			setTimeout( () => {otp = null;} , 10*60000);
			res.render('login/otp',{email : req.body.email});
		}
		else {
			forgot_msg = "*Account doesn't Exist";
			res.redirect('/login/forgot_password');
		}
	});
});

//details
router.post('/forgot_password/new', (req,res) => {
	if(otp == req.body.otp) res.render('login/password',{ email : req.body.email });
	else{
        forgot_msg = '*Wrong OTP';
		res.redirect('/login/forgot_password');
	}
});

router.post('/forgot_password/update', (req,res) => {
	const db = client.db('bank');
	const collection = db.collection('customers');
	const query = {email: req.body.email};

	collection.findOne(query, (err,result) => {
		bcrypt.hash(req.body.password,saltRounds,(err,result) => {
			const new_values = { $set : {password : result} };
			collection.updateOne(query , new_values, (err) => {
				if(err) console.log('Unable to update password...!');
				else console.log(`Password Successfully Updated...!`);
				logger.set_msg('Your Password was Successfully Updated...!');
				res.redirect(307,'/account');                                  
			});
		});
	});
});

module.exports = router;