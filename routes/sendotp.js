const nodemailer = require('nodemailer');
require('dotenv-safe').config();

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL,
		pass: process.env.PASS
	}
});

function sendotp(receiver)
{
	const otp = Math.floor(Math.random()*90000+10000);

	const time = new Date(Date.now() + 10*60000);

	const msg = `Your OTP for Online Banking System is ${otp} and is valid till ${time}`;

	const mailOptions = {
		from: process.env.EMAIL,
		to: `${receiver}`,
		subject: 'One Time Password(OTP)',
		text: `${msg}`
	};

	transporter.sendMail(mailOptions, function(error, info){
		if (error) console.log(error);
		else console.log("OTP sent...!");
	});
	return otp;
}

module.exports = sendotp;