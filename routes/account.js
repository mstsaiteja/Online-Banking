const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const database = require('./database');
const logger = require('./logger');
const sendotp = require('./sendotp');

const client = database.client;
const saltRounds = 10;

//account
router.post('/', (req,res) => {
	logger.set_logger(req.body.email);
	const url = `/account/${req.body.email}`;
	res.redirect(url);
});

router.get('/:email' , (req,res) => {
    const user = logger.get_logger();
	if((user)&&(req.params.email==user)){
		const db = client.db('bank');
		const collection = db.collection('customers');
		const query = {email : req.params.email};
		collection.findOne(query, (err,result) => {
			res.render('account/account',{user: result,msg :logger.get_msg()});                     
			logger.set_msg(null);                          
		});
	}
	else res.redirect('/login');
});

//Change Email
let change_email_msg = null;
let otp = null;
router.get('/change_email/:email', (req,res)=> {
	const user = logger.get_logger();
	if((user)&&(req.params.email==user)){
		res.render('account/change_email',{
			email: req.params.email,
			msg: change_email_msg
		});
		change_email_msg = null;
	}
	else res.redirect('/login');
});

router.post('/otp/:email', (req,res)=> {
	const db = client.db('bank');
	const collection = db.collection('customers');
	const query = { email : req.body.email };
	collection.findOne(query, (err,result) => {
		if(result){
			change_email_msg = '*Account Already Exists';
			res.redirect(`/account/change_email/${req.params.email}`);
		}
		else{
			otp = sendotp(req.body.email);
			setTimeout( () => {otp = null;} , 10*60000);
			res.render('account/otp',{old_email:req.params.email,new_email:req.body.email});
		}
	});
});

router.post('/update_email/:email' , (req,res) => {
	const new_email = req.body.email;
	const old_email = req.params.email;
	if(otp == req.body.otp){
		const db = client.db('bank');
		const collection = db.collection('customers');
		const query = { email : old_email };
		const new_values = { $set : {email : new_email} };

		collection.updateOne(query,new_values, (err) => {
			if(err) console.log('Unable to update email...!');
			else console.log(`Email Successfully Updated...!`);
			logger.set_msg('Your Email was Successfully Updated..!');
			res.redirect(307,'/account');                                        
		});
	}
	else{
		change_email_msg = '*Wrong OTP';
		res.redirect(`/account/change_email/${old_email}`);
	}
});

//Change Password
let change_password_msg = null;
router.get('/change_password/:email', (req,res) => {
	const user = logger.get_logger();
	if((user)&&(req.params.email==user)){
		res.render('account/change_password', {email : req.params.email, msg: change_password_msg});
		change_password_msg = null;
	}
	else res.redirect('/login');
});

router.post('/update_password/:email', (req,res) => {
	const db = client.db('bank');
	const collection = db.collection('customers');
	const email = req.params.email;
	const query = {email: email};

	collection.findOne(query, (err,result) => {
		bcrypt.compare(req.body.opassword, result.password, (err,hash) => {
			if(hash){
				bcrypt.hash(req.body.password,saltRounds,(err,result) => {
					const new_values = { $set : {password : result} };
					collection.updateOne(query , new_values, (err) => {
						if(err) console.log('Unable to update password...!');
						else console.log(`Password Successfully Updated...!`);
						logger.set_msg('Your Password was Successfully Updated..!');
						res.redirect(`/account/${email}`)
					});
				});
			}
			else{
				change_password_msg = '*Incorrect Current Password';
				res.redirect(`/account/change_password/${email}`);
			}
		});
	});
});

//Change Details
router.get('/change_details/:email', (req,res) => {
	const user = logger.get_logger();
	if((user)&&(req.params.email==user)){
		const db = client.db('bank');
		const collection = db.collection('customers');
		const query = {email: req.params.email};
		collection.findOne( query , (err,result) => {
			res.render('account/change_details',{user : result});
		});
	}
	else res.redirect('/login');
});

router.post('/update_details/:email', (req,res) => {
	const db = client.db('bank');
	const collection = db.collection('customers');
	const query = { email : req.params.email };
	const new_values = { $set : {
		name : req.body.name,
		mobile : req.body.mobile,
		address : req.body.address
	}};
	collection.updateOne(query,new_values, (err) => {
		if(err) console.log('Unable to update details...!');
		else console.log(`Details Successfully Updated...!`);
		res.redirect(`/account/${req.params.email}`);
	});
});

//transfer money
let transfer_msg = null;
router.get('/transfer/:email', (req,res) => {
	const user = logger.get_logger();
	if((user)&&(req.params.email==user)){
		res.render('account/transfer',{email: req.params.email, msg : transfer_msg});
		transfer_msg = null;	
	}
	else res.redirect('/login');
});

router.post('/transfer_money/:email', (req,res) => {
	const db = client.db('bank');
	const collection = db.collection('customers');
	collection.findOne({email: req.body.receiver}, (err,receiver) => {
		if(receiver){
			collection.findOne({email : req.params.email}, (err,sender) => {
				if(req.body.money>sender.amount){
					transfer_msg = "*Insufficient Balance";
					res.redirect(`/account/transfer/${req.params.email}`);
				}
				else{
					bcrypt.compare(req.body.password, sender.password, (err,hash) => {
						if(hash){
							const d = new Date();
							const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
							let date = d.getDate();
							let month = months[d.getMonth()];
							let year = d.getFullYear();
							if(date<10)	date = '0' + date;
							const time = date +'-'+ month +'-'+ year;
							//update sender details
							const qs = {email: req.params.email};
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
							collection.updateOne(qs,us, (err) => {
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
							collection.updateOne(qr,ur, (err) => {
								if(err){ 
									console.log('Unable to send Amount...!');
									logger.set_msg('Transaction was not successful');
								}
								else {
									console.log(`Amount Received from ${sender.email}`);
									logger.set_msg('Transaction was successful');
								}
								res.redirect(`/account/${req.params.email}`);
							});
						}
						else{
							transfer_msg = "*Incorrect Password";
							res.redirect(`/account/transfer/${req.params.email}`);
						}
					});
				}
			});
		}
		else{
			transfer_msg = "*Invalid Receiver Account";
			res.redirect(`/account/transfer/${req.params.email}`);
		}
	})
});

//transactions
router.get('/transactions/:email', (req,res) => {
	const user = logger.get_logger();
	if((user)&&(req.params.email==user)){
		const db = client.db('bank');
		const collection = db.collection('customers');
		collection.findOne({email : req.params.email},(err,result) => {
			res.render('account/transactions',{email: result.email, data : result.transactions});
		});
	}
	else res.redirect('/login');
});

module.exports = router;