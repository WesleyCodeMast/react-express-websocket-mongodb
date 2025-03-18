const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {

	try {
		const transporter = nodemailer.createTransport({
			host: process.env.MAIL_HOST,
			service: process.env.SERVICE,
			mailPort: process.env.MAIL_PORT,
			auth: {
				user: process.env.MAIL_USERNAME,
				pass: process.env.MAIL_PASSWORD,
			},
		});

		await transporter.sendMail({
			from: 'Confideas '+process.env.MAIL_USERNAME,
			to: email,
			subject: subject,
			text: text,
		});

		console.log("email sent sucessfully");
	} catch (error) {
		console.log(error, "email not sent");
	}
};

module.exports = sendEmail;