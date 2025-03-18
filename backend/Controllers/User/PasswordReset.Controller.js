const Auth = require('../../Models/Client/Auth.model');
const Token = require("../../Models/Client/token");
const sendEmail = require("../../Utils/sendEmail");
const crypto = require("crypto");
const Joi = require("joi");
const express = require("express");
var bcrypt = require("bcrypt");


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

			const link = `${process.env.BASE_URL}/password-reset/client/${user._id}/${token.token}`;
			await sendEmail(user.email, "Password reset", link);

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