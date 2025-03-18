const Auth = require('../../Models/Advisor/Auth.model');
const Token = require("../../Models/Admin/token");
const sendEmail = require("../../Utils/sendEmail");
const crypto = require("crypto");
const Joi = require("joi");
const ejs = require('ejs');
var bcrypt = require("bcrypt");
const GlobalSetting = require('../../Models/GlobalSetting.model');
const Nodemailer = require('../../Utils/Nodemailer');
const path = require('path');

module.exports = {
	resetPasswordEmail: async (req, res, next) => {
		try {
			const schema = Joi.object({ email: Joi.string().email().required() });
			const { error } = schema.validate(req.body);
			if (error) 

				return res.status(400).send({
					success: false,
					error: true,
					message: error.details[0].message,
				});

			const user = await Auth.findOne({ email: req.body.email });
			if (!user)
				return res.status(400).send({
					success: false,
					error: true,
					message: "user with given email doesn't exist",
				});

			let token = await Token.findOne({ userId: user._id });
			if (!token) {
				token = await new Token({
					userId: user._id,
					token: crypto.randomBytes(32).toString("hex"),
				}).save();
			}

			
			// await sendEmail(user.email, "Password reset", link);

			const logoData = await GlobalSetting.findOne({});
			const logo = process.env.BASE_URL+'/api/'+logoData.logo;

			const link = `${process.env.BASE_URL}/password-reset/advisor/${user._id}/${token.token}`;

			var absoluteBasePath = path.resolve('');
			const htmlAdvisor = await ejs.renderFile(absoluteBasePath+"/views/password_reset.ejs", {logo:logo,link:link,client: user.username});

			await Nodemailer.sendPasswordResetNotification(
				user.name,
				user.username,
				user.email,
				htmlAdvisor
			);

			return res.send({
				success: true,
				error: false,
				message: 'password reset link sent to your email account',
			});

		} catch (error) {

			return res.status(400).send({
				success: false,
				error: true,
				message: 'An error occured',
			});
			console.log(error);
		}
	},

	resetPassword: async (req, res) => {
		try {
			const schema = Joi.object({ password: Joi.string().required() });
			const { error } = schema.validate(req.body);
			if (error) 

			return res.status(400).send({
				success: false,
				error: true,
				message: error.details[0].message,
			});

			const user = await Auth.findById(req.params.userId);

			if (!user) 

			return res.status(400).send({
				success: true,
				error: false,
				message: "Invalid link or expired.",
			});

			const token = await Token.findOne({
				userId: user._id,
				token: req.params.token,
			});
			if (!token) 

			return res.status(400).send({
				success: true,
				error: false,
				message: "Invalid link or expired.",
			});

			user.password = bcrypt.hashSync(req.body.password, 8);
			await user.save();
			await token.delete();

			res.send({
				success: true,
				error: false,
				message: "password reset sucessfully.",
			});

		} catch (error) {

			res.status(500).send({
				success: false,
				error: true,
				message: "An error occured.",
			});
			console.log(error);
		}
	}
}