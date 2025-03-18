const createError = require('http-errors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
var bcrypt = require("bcrypt");

const Auth = require('../../Models/Admin/Auth.model');

async function checkEmailIsUnique(id, email) {

    totalPosts = await Auth.countDocuments({ email: email, _id: {$ne:id} });
    if (totalPosts > 0) {
      return true;
    } else{
      return false;
    }
  };

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const results = await Auth.find({}, { __v: 0 });
      res.send({
        success: true,
        message: 'Data fetched',
        data: results
      });
    } catch (error) {
      console.log(error.message);
    }
  },

  verifyAToken: async (req, res, next) => {
    try {
      const results = await Auth.find({}, { __v: 0 });
      res.send({
        success: true,
        message: 'Data fetched',
        data: results
      });
    } catch (error) {
      console.log(error.message);
    }
  },

  adminLogout: async (req, res, next) => {
    try {
      req.user.tokens = req.user.tokens.filter((token) => {
        return token.token !== req.token
      })
      await req.user.save();
      res.send({
        success: true,
        message: 'user Logout'
      });
    } catch (error) {
      res.status(500).send(error)
    }
  },

  register: async (req, res, next) => {
    try {

      const user = {
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, 8)
      };

      const user1 = new Auth({
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, 8)
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
              message: "User Registered successfully"
            })
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

  login: async (req, res, next) => {

    const { email, password } = req.body;

    const user = await Auth.countDocuments({ email: email });

    if (user) {

      const user = await Auth.findOne({ email: email });

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(201)
          .send({
            error: true,
            accessToken: null,
            message: "Invalid Password!"
          });
      }

      var token = jwt.sign({
        id: user.id
      }, process.env.JWT_SEC, {
        expiresIn: '10h'
      });

      user.tokens = user.tokens.concat({ token })
      await user.save();

      res.status(200)
        .send({
          success: true,
          data: {
            id: user._id,
            email: user.email,
            username: user.username,
            name: user.name,
          },
          message: "Login successfully",
          accessToken: token,
        });

    } else {
      next(createError(201, 'Username or password incorrect'));
    }

  },

  findById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await Auth.findById(id);
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      res.send({
        success: true,
        message: 'user Logout',
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
      const auth = await Auth.findOne({ _id: req.user._id }, { __v: 0, tokens: 0 }).populate('group');
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

  update: async (req, res, next) => {
    try {

      const id = req.user._id;

      var checkCountEmail = await checkEmailIsUnique(id,req.body.email);

      if (checkCountEmail) {
         return next(createError(201, 'Duplicate Email!'));
      }


      if (req.file) {
        req.body.avatar = req.file.path;
      }

      const updates = req.body;
      const options = { new: true };

      const result = await Auth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Auth does not exist');
      }
      res.send({
        success: true,
        message: 'user updated!',
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

  delete: async (req, res, next) => {
    const id = req.params.id;
    try {
      const result = await Auth.findByIdAndDelete(id);
      if (!result) {
        throw createError(201, 'Auth does not exist.');
      }
      res.send({
        success: true,
        message: 'Data deleted!',
        data: result
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  }
};