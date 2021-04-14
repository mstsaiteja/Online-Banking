const sgMail = require('@sendgrid/mail');
require('dotenv-safe').config();

const API_KEY = process.env.API_KEY;

sgMail.setApiKey(API_KEY);

function sendotp(receiver)
{
	const otp = Math.floor(Math.random()*90000+10000);

	const time = new Date(Date.now() + 10*60000);

	const msg = `Your OTP for Online Banking System is ${otp} and is valid till ${time}`;

	const message = {
		to: `${receiver}`,
		from: {
			name: 'Online-Banking',
			email: process.env.EMAIL
		},
		subject: 'One Time Password(OTP)', 
		text: `${msg}`
	};

	sgMail.send(message)
	.then(response => console.log("OTP sent...!"))
	.catch(error=> console.log("Unable to send OTP ...!"))

	return otp;
}

module.exports = sendotp;