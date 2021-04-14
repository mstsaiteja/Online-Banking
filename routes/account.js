const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const sendotp = require('../controllers/sendotp');
const UserModel = require('../models/User');

const {checkAuthenticated} = require('../config/passport-config');

router.use(checkAuthenticated);

//account
router.get('/', (req,res) => {
	res.render('account/account',{
		user: req.user,
		msg :req.flash('logger_msg')
	});                                              
});

//Change Email
router.get('/change_email/', (req,res)=> {
	res.render('account/change_email',{
		email: req.user.email,
		msg: req.flash('change_email_msg')
	});
});

router.post('/otp', (req,res)=> {
	const query = { email : req.body.email };
	UserModel.findOne(query, (err,result) => {
		if(result){
			req.flash('change_email_msg','*Account Already Exists');
			res.redirect(`/account/change_email`);
		}
		else{
			const otp = sendotp(req.body.email);
			req.flash('change_otp',`${otp}`);
			setTimeout(()=>{req.flash('change_otp',null)},10*60*1000)
			res.render('account/otp',{old_email:req.user.email,new_email:req.body.email});
		}
	});
});

router.post('/update_email' , (req,res) => {
	const new_email = req.body.email;
	const old_email = req.user.email;
	const otp = req.flash('change_otp');
	if(otp == req.body.otp){
		const query = { email : old_email };
		const new_values = { $set : {email : new_email} };

		UserModel.updateOne(query,new_values, (err) => {
			if(err) console.log('Unable to update email...!');
			else console.log(`Email Successfully Updated...!`);
			req.flash('logger_msg','Your Email was Successfully Updated..!');
			res.redirect('/account');
		});
	}
	else{
		req.flash('change_email_msg','*Wrong OTP');
		res.redirect(`/account/change_email`);
	}
});

//Change Password
router.get('/change_password', (req,res) => {
	res.render('account/change_password', {
		email : req.user.email, 
		msg: req.flash('change_password_msg')
	});
});

router.post('/update_password', (req,res) => {
	const email = req.user.email;
	const query = {email: email};

	UserModel.findOne(query, (err,result) => {
		bcrypt.compare(req.body.opassword, result.password, (err,hash) => {
			if(hash){
				bcrypt.hash(req.body.password,10,(err,result) => {
					const new_values = { $set : {password : result} };
					UserModel.updateOne(query , new_values, (err) => {
						if(err) console.log('Unable to update password...!');
						else console.log(`Password Successfully Updated...!`);
						req.flash('logger_msg','Your Password was Successfully Updated..!');
						res.redirect(`/account`);
					});
				});
			}
			else{
				req.flash('change_password_msg','*Incorrect Current Password');
				res.redirect(`/account/change_password`);
			}
		});
	});
});

//Change Details
router.get('/change_details', (req,res) => {
	res.render('account/change_details',{user : req.user});
});

router.post('/update_details', (req,res) => {
	const query = {email : req.user.email};
	const new_values = { $set : {
		name : req.body.name,
		mobile : req.body.mobile,
		address : req.body.address
	}};
	UserModel.updateOne(query,new_values, (err) => {
		if(err) console.log('Unable to update details...!');
		else console.log(`Details Successfully Updated...!`);
		res.redirect('/account'); 
	});
});

//transfer money
router.get('/transfer', (req,res) => {
	res.render('account/transfer',{
		email: req.user.email,
		msg : req.flash('transfer_msg')
	});
});

router.post('/transfer_money', (req,res) => {
	UserModel.findOne({email: req.body.receiver}, (err,receiver) => {
		if(receiver){
			UserModel.findOne({email : req.user.email}, (err,sender) => {
				if(req.body.money>sender.amount){
					req.flash('transfer_msg','*Insufficient Balance');
					res.redirect(`/account/transfer`);
				}
				else{
					bcrypt.compare(req.body.password, sender.password, (err,hash) => {
						if(hash){
							const time = new Date();
							//update sender details
							const qs = {email: req.user.email};
							const s_amount = parseInt(sender.amount)-parseInt(req.body.money);
							const s_msg = `${receiver.name}<br>${receiver.email}`;
							const s_trans = {
								time : time,
								details : s_msg,
								amount : -1*req.body.money
							};
							const us = {
								$set : {amount : s_amount},
								$push : {transactions : {$each : [s_trans] , $position: 0}}
							};
							UserModel.updateOne(qs,us, (err) => {
								if(err) console.log('Unable to send Amount...!');
								else console.log(`Amount sent to ${receiver.email}`);
							});
							//update receiver details
							const qr = {email: req.body.receiver};
							const r_amount = parseInt(receiver.amount)+parseInt(req.body.money);
							const r_msg = `${sender.name}<br>${sender.email}`;
							const r_trans = {
								time : time,
								details : r_msg,
								amount : 1*req.body.money
							};
							const ur = {
								$set : {amount : r_amount},
								$push : {transactions : {$each : [r_trans] , $position: 0}}
							};
							UserModel.updateOne(qr,ur, (err) => {
								if(err){ 
									console.log('Unable to send Amount...!');
									req.flash('logger_msg','Transaction was not successful')
								}
								else {
									console.log(`Amount Received from ${sender.email}`);
									req.flash('logger_msg','Transaction was successful')
								}
								res.redirect(`/account`);
							});
						}
						else{
							req.flash('transfer_msg','*Incorrect Password')
							res.redirect(`/account/transfer`);
						}
					});
				}
			});
		}
		else{
			req.flash('transfer_msg','*Invalid Receiver Account')
			res.redirect(`/account/transfer`);
		}
	})
});

//transactions
router.get('/transactions', (req,res) => {
	res.render('account/transactions',{
		email: req.user.email, 
		data : req.user.transactions
	});
});

//logout
router.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/login');
});

module.exports = router;