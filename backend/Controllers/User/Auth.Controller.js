const createError = require('http-errors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
var bcrypt = require("bcrypt");

const Auth = require('../../Models/Admin/Auth.model');
const Nodemailer = require('../../Utils/Nodemailer')
const Validator = require('validatorjs');


async function checkNameIsUnique(name) {

  totalPosts = await Auth.countDocuments({ username: name });
  if (totalPosts > 0) {
    return true;
  } else {
    return false;
  }
};

async function checkEmailIsUnique(email) {

  totalPosts = await Auth.countDocuments({ email: email });
  if (totalPosts > 0) {
    return true;
  } else {
    return false;
  }
};

module.exports = {
  getAllAuths: async (req, res, next) => {
    try {
      const results = await Auth.find({}, { __v: 0 });
      res.send(results);
    } catch (error) {
      console.log(error.message);
    }
  },

  getAllAdmins: async (req, res, next) => {
    try {
      const results = await Auth.find({}, { __v: 0 });
      res.send(results);
    } catch (error) {
      console.log(error.message);
    }
  },

  verifyAToken: async (req, res, next) => {
    try {
      const results = await Auth.find({}, { __v: 0 });
      res.send(results);
    } catch (error) {
      console.log(error.message);
    }
  },

  adminLogout: async (req, res, next) => {
    try {
      req.user.tokens = req.user.tokens.filter((token) => {
        return token.token !== req.token
      })
      await req.user.save()
      res.send('user Logout')
    } catch (error) {
      res.status(500).send(error)
    }
  },

  register: async (req, res, next) => {
    try {

      let rules = {
      name: 'required',
      username: 'required',
      email: 'required',
      password: 'required',
      password_confirmation: 'required',
    };

    const validation = new Validator(req.body, rules);

    if (validation.fails()) {
      return res.status(412).send({
        success: false,
        message: 'Validation failed',
        data: validation.errors
      });
    }

      if (req.body.password !== req.body.password_confirmation) {
       return res.status(412)
        .send({
          success: false,
          error: true,
          message: 'Password and Confirm Password does not match!',
        });
      }


      var checkCountEmail = await checkEmailIsUnique(req.body.email);

      if (checkCountEmail) {
        return res.status(412)
        .send({
          success: false,
          message: 'Validation failed',
          data: 'duplicate email'
        });
      }

      var checkCountName = await checkNameIsUnique(req.body.username);

      if (checkCountName) {
        return res.status(412)
        .send({
          success: false,
          message: 'Validation failed',
          data: 'duplicate username'
        });
      }

      const token = jwt.sign({email: req.body.email}, process.env.JWT_SEC_TOKEN);

      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;


      const user = {
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        user_type: req.body.user_type || 'staff',
        addedAt: today,
        password: bcrypt.hashSync(req.body.password, 8),
        confirmationCode: token
      };

      const customerName = req.body.name;
      const customerEmail = req.body.email;
      const customerMobile = req.body.mobile;

      const user1 = new Auth({
        name: req.body.name,
        email: req.body.email,
        addedAt: today,
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, 8),
        confirmationCode: token
      });

      user1.save((err, user) => {
        if (err) {
          res.status(500)
            .send({
              message: err
            });
          return;
        } else {

          res.status(200)
            .send({
              message: "User was registered successfully!",
            });
        }
      });
      /*const auth = new Auth(user);
      const result = await auth.save();
      res.send(result);*/

    } catch (error) {
      console.log(error);
      if (error.name === 'ValidationError') {
        next(createError(201, error.message));
        return;
      }
      next(error);
    }
  },

  confirmEmail: async (req, res, next) => {
    Auth.findOne({
      confirmationCode: req.params.confirmationCode,
    })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      user.status = 1;
      user.save((err) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }else{
          res.status(200)
          .send({
            message: "User was Verified successfully! Please Login",
          });
          return;
        }
      });
    })
    .catch((e) => console.log("error", e));
  },

  login: async (req, res, next) => {

    const { email, password } = req.body;

    const user = await Auth.countDocuments({ email: email, user_type: 'staff' });

    if (user) {

      const user = await Auth.findOne({ email: email });

      if (!user.status) {
        next(createError(201, 'User is not active!'));
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(201)
          .send({
            accessToken: null,
            message: "Invalid Password!"
          });
      }

      var token = jwt.sign({
        id: user.id,
        name: user.name
      }, process.env.JWT_SEC, {
        expiresIn: '10h'
      });

      user.tokens = user.tokens.concat({ token })
      await user.save();

      res.status(200)
        .send({
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            name: user.name,
          },
          message: "Login successfull",
          accessToken: token,
        });

    } else {
      next(createError(201, 'Username or password incorrect'));
    }

  },

  findAuthById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await Auth.findById(id);
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      res.send(auth);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },


  resetPassword: async (req, res, next) => {

    if (req.body.password !== req.body.password_confirmation) {

      next(createError(201, "Pass and Confirm Password does not match!"));
      return;
    }

    var passwordIsValid = bcrypt.compareSync(
      req.body.current_password,
      req.user.password
    );

    if (!passwordIsValid) {

      next(createError(201, "Invalid or expired current password"));
      return;
    }
    await Auth.updateOne(
      { _id: req.user._id.toString() },
      { $set: { password: bcrypt.hashSync(req.body.password, 8) } },
      { new: true }
    );
    const user = await Auth.findById({ _id: req.user._id.toString() });

    res.send({
      success: true,
      message: 'Password changed successfully!',
    });

  },

  profile: async (req, res, next) => {
    try {
      const auth = await Auth.findOne({ _id: req.user._id }, { __v: 0, tokens: 0 });
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      res.send({
        success: true,
        message: 'user fetched!',
        data: auth
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

  updateAAuth: async (req, res, next) => {
    try {
      const id = req.user._id;

      if (req.file) {
        req.body.avatar = req.file.path;
      }

      const updates = req.body;
      const options = { new: true };

      const result = await Auth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Auth does not exist');
      }
      return res.send({
        success: true,
        message: 'Data updated!',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        return next(createError(201, 'Invalid Auth Id'));
      }
      next(error);
    }
  },

  deleteAAuth: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Auth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Auth does not exist.');
      }
      res.send(result);
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  },

};