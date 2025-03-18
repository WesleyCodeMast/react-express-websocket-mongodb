const createError = require('http-errors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
var bcrypt = require("bcrypt");
const path = require('path')
const ejs = require('ejs');
var fs = require('fs');

const Validator = require('validatorjs');

const Auth = require('../../Models/Advisor/Auth.model');
const Notification = require('../../Models/Advisor/Chatnotification.model');
const Clients = require('../../Models/Client/Auth.model');
const AdvisorMessage = require('../../Models/Message.model');
const Category = require('../../Models/Admin/Category.model');
const GlobalSetting = require('../../Models/GlobalSetting.model');
const ChatNotification = require('../../Models/Advisor/Chatnotification.model');
const Nodemailer = require('../../Utils/Nodemailer')

var MailChimp = require('mailchimp').MailChimpAPI;

var apiKey = process.env.MAILCHIMPAPIKEY;

global.MailChimpAPI = new MailChimp(apiKey, {
    version: '2.0'
});


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
    totalPosts = await Clients.countDocuments({ email: email });
    if (totalPosts > 0) {
      return true;
    }else{
      return false;
    }
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
      });
      await req.user.save()

      const id = req.user._id;

      const options = { new: true };

      const result = await Auth.findByIdAndUpdate(id, { chat_status: 0 }, options);

      res.send('user Logout')
    } catch (error) {
      res.status(500).send(error)
    }
  },

  verifyEmail: async (req, res, next) => {
    try {

      var checkCountEmail = await checkEmailIsUnique(req.body.email);

      if (checkCountEmail) {
        return res.status(201)
        .send({
          success: false,
          message: 'Email Already registered!',
          data: 'duplicate email'
        });
      }

       return res.status(200)
        .send({
          success : true,
          message: "email validated successfully!",
        });

    } catch (error) {
      console.log(error);
      if (error.name === 'ValidationError') {
        next(createError(201, error.message));
        return;
      }
      next(error);
    }
  },


  emailValidate: async (req, res, next) => {
    try {

      // var checkCountEmail = await checkEmailIsUnique(req.body.email);

      // if (checkCountEmail) {
      //   return res.status(201)
      //   .send({
      //     success: false,
      //     message: 'Email Already registered!',
      //     data: 'duplicate email'
      //   });
      // }

      const logoData = await GlobalSetting.findOne({});

      const token = jwt.sign({email: req.body.email}, process.env.JWT_SEC_TOKEN);

      var absoluteBasePath = path.resolve('');
      const link = process.env.BASE_URL+'/confirm/'+token;
      const logo = process.env.BASE_URL+'/api/'+logoData.logo;

      const html = await ejs.renderFile(absoluteBasePath+"/views/confirmation_link.ejs", { logo:logo  ,client: '', client_email: req.body.email, token, link});

      await Nodemailer.sendConfirmationEmail(
            '',
            req.body.email,
            token,
            html
          );

       res.status(200)
        .send({
          success : true,
          message: "Confirmation email sended successfully, please check email and confirm!",
        });

    } catch (error) {
      console.log(error);
      if (error.name === 'ValidationError') {
        next(createError(201, error.message));
        return;
      }
      next(error);
    }
  },

  userValidate: async (req, res, next) => {
    try {

      // var checkCountEmail = await checkEmailIsUnique(req.body.email);

      // if (checkCountEmail) {
      //   return res.status(201)
      //   .send({
      //     success: false,
      //     message: 'Validation failed',
      //     data: 'duplicate email'
      //   });
      // }

      var checkCountName = await checkNameIsUnique(req.body.username);

      if (checkCountName) {
        return res.status(201)
        .send({
          success: false,
          message: 'Validation failed',
          data: 'duplicate username'
        });
      }

       res.status(200)
        .send({
          success : true,
          message: "Advisor validated successfully!",
        });

    } catch (error) {
      console.log(error);
      if (error.name === 'ValidationError') {
        next(createError(201, error.message));
        return;
      }
      next(error);
    }
  },

  adminRegister: async (req, res, next) => {
    try {

      let rules = {
        name: 'required',
        username: 'required',
        email: 'required',
        password: 'required',
        password_confirmation: 'required',
        dob: 'required',
        country: 'required',
        phone: 'required',
        rate_per_min: 'required',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(203).send({
          success: false,
          message: 'Validation failed',
          data: validation.errors
        });
      }

      if (req.body.password !== req.body.password_confirmation) {
        return res.status(201)
        .send({
          success: false,
          error: true,
          message: 'Password and Confirm Password does not match!',
        });
      }

      var checkCountEmail = await checkEmailIsUnique(req.body.email);

      if (checkCountEmail) {
        return res.status(201)
        .send({
          success: false,
          message: 'Validation failed',
          data: 'duplicate email'
        });
      }

      var checkCountName = await checkNameIsUnique(req.body.username);

      if (checkCountName) {
        return res.status(201)
        .send({
          success: false,
          message: 'Validation failed',
          data: 'duplicate username'
        });
      }

      if (req.file) {
        req.body.avatar = req.file.path;
      }

      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var yyyy = today.getFullYear();
      today = yyyy + '-' + mm + '-' + dd;

      const token = jwt.sign({email: req.body.email}, process.env.JWT_SEC_TOKEN);

      let category = '';

      if (req.body.category && req.body.category != '') {
        const cate = await Category.findOne({}).sort({$natural: -1});
        if (cate) {
          category = cate._id;
        }else{
          category = '';
        }
      }else{
        category = '';
      }

      const user = new Auth({
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        address2: req.body.address2,
        zipcode: req.body.zipcode,
        country: req.body.country,
        username: req.body.username,
        displayname: req.body.displayname,
        rate_per_min: req.body.rate_per_min,
        dob: req.body.dob,
        avatar: (req.file) ? req.file.path : '' ,
        mobile: req.body.phone,
        addedAt: today,
        status: 1,
        category: category,
        password: bcrypt.hashSync(req.body.password, 8),
        confirmationCode: token
      });

      // var absoluteBasePath = path.resolve('');
      // const link = process.env.BASE_URL+'/confirm/'+token;
      // const html = await ejs.renderFile(absoluteBasePath+"/views/confirmation_link.ejs", { client: user.username, client_email: user.email, token, link});

      user.save((err, user) => {
        if (err) {
          res.status(500)
          .send({
            message: err
          });
          return;
        } else {

          /*Nodemailer.sendConfirmationEmail(
            user.username,
            user.email,
            user.confirmationCode,
            html
          );*/

          /*mail chimp code*/

          var fullName = req.body.username.split(' '),
          firstName = fullName[0],
          lastName = fullName[fullName.length - 1];

          var userData = {
            "id": process.env.LISTUNIQUEIDADVISOR,   
            "email": {
              "email": req.body.email,   
            },
            "merge_vars": {
              FNAME: firstName,
              LNAME: lastName  
            }

          }

          MailChimpAPI.call('lists', 'subscribe', userData, function(error, data) {
            if (error) {
            } else {
              console.log('2',data);
            }
          });

          /*mail chimp code*/

          res.status(200)
          .send({
            message: "User Registered successfully, please check email!",
            id: user._id,
            status:200
          })
        }
      });

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

  adminLogin: async (req, res, next) => {

    const { email, password } = req.body;

    const user = await Auth.countDocuments({ email: email });

    if (user) {

      const user = await Auth.findOne({ email: email });

      if (!user.status) {
        return res.status(401).send({
          message: "Pending Account. Please Verify Your Email!",
        });
      }


      // if (!user.approved) {
      //   return res.status(401).send({
      //     message: "Pending Account. need to approved by admin!",
      //   });
      // }

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
        id: user.id
      }, process.env.JWT_SEC_ADVISOR, {
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

  createStripeCustomer: async (req, res, next) => {

    const new_account = await stripe.accounts.create({
      type: 'custom',
      email: req.body.email,
      name: 'Anna Stein',
      description: 'test',
      balance: 5000.0,
      country: 'US',
      capabilities: {
        card_payments: {requested: true},
        transfers: {requested: true},
      },
    })

    account_links = await stripe.accountLinks.create({
      account: new_account.id,
      refresh_url: 'http://localhost:3000/reauth',
      return_url: 'http://localhost:3000/return',
      type: 'account_onboarding',
      collect: 'eventually_due',
    });
  },

  googleRegisterLogin: async (req, res, next) => {
    console.log(" ++++++++++++++++++++++ google account +++++++++++++++++++++++++++");
    const { email, name } = req.body;

    const user = await Auth.countDocuments({ email: email });

    if (user) {

      const user = await Auth.findOne({ email: email });

      var token = jwt.sign({
        id: user.id
      }, process.env.JWT_SEC_ADVISOR, {
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
      const user = {
        name: req.body.name,
        email: req.body.email,
        username: req.body.name,
        displayname: req.body.name,
        rate_per_min: req.body.rate_per_min,
        dob: req.body.dob,
        password: bcrypt.hashSync(req.body.password, 8)
      };

      const auth = new Auth(user);
      const UserResult = await auth.save();

      var token = jwt.sign({
        id: UserResult.id
      }, process.env.JWT_SEC_ADVISOR, {
        expiresIn: '10h'
      });

      UserResult.tokens = UserResult.tokens.concat({ token });

      await UserResult.save();

      res.status(200)
      .send({
        UserResult: {
          id: UserResult._id,
          email: UserResult.email,
          userame: UserResult.username,
          name: UserResult.name,
        },
        message: "Login successfull",
        accessToken: token,
      });
    }

  },

  findAuthById: async (req, res, next) => {
    const id = req.params.id;
    try {
      const auth = await Auth.findById(id);
      // const auth = await Auth.findOne({ _id: id });
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
      const auth = await Auth.findOne({ _id: req.user._id }, { __v: 0, tokens: 0 }).populate('reviews').populate('service').populate('tickets').populate('certificate');
      
      var min_chat_minutes = auth.min_chat_minutes;

      const global_setting = await GlobalSetting.findOne({});
      if (auth.min_chat_minutes == 0) {
        min_chat_minutes = global_setting.min_chat_minutes;
      }

      var globalCommRate = 0;
      if(auth && auth.commission_rate == 0) {
        globalCommRate = global_setting.commission_rate;
      }

      let commission_rate = auth.commission_rate;
      let rate_per_min = auth.rate_per_min;
      let my_share = rate_per_min - (rate_per_min *(commission_rate*(1/100)));
      my_share = parseFloat(my_share).toFixed(2)
      const message_count = await AdvisorMessage.countDocuments({advisor:req.user.id});

      const notification_count = await ChatNotification.countDocuments({ advisor_id: req.user.id});

      var totalClients =  await Auth.findById(req.user.id,{clients: 1}).populate({ path: 'clients'});
      var totalReviews =  await Auth.findById(req.user.id,{reviews: 1}).populate({ path: 'reviews'});
      if (!auth) {
        throw createError(201, 'Auth does not exist.');
      }
      return res.send({
        success: true,
        message: 'user fetched!',
        data: auth,
        inbox_count: message_count,
        clients_count: totalClients.clients.length,
        reviews_count: totalReviews.reviews.length,
        notification_count,
        my_share,
        globalCommRate,
        min_chat_minutes : (min_chat_minutes == 0) ?? 5,
        commission_rate: global_setting.commission_rate
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

  updateChatStatus: async (req, res, next) => {
    try {
      const id = req.user._id;

      const updates = req.body;
      const options = { new: true };

      const result = await Auth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Auth does not exist');
      }

      var absoluteBasePath = path.resolve('');

      const advisor = await Auth.findById(id);

        const clients = advisor.clients;

         const logoData = await GlobalSetting.findOne({});

        const logo = process.env.BASE_URL+'/api/'+logoData.logo;
        if(req.body.chat_status == 1) {
            clients.forEach(async function(clientId) {
              const client = await Clients.findById(clientId);
              if((client && client.name && client.username) && (advisor && advisor.name && advisor.username)) {
                const html = await ejs.renderFile(absoluteBasePath+"/views/advisor_online.ejs", {logo:logo,name: ((advisor.username)??(advisor.name)), email: advisor.email, client: ((client.username)??(client.name)), client_email: client.email});
                await Nodemailer.AdvisorOnlineMailNotification(
                  advisor.username,
                  advisor.email,
                  client.username,
                  client.email,
                  html
                );
            }
          });
        }
      
      return res.send({
        success: true,
        message: 'Chat status updated!',
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

  updateChatEngageStatus: async (req, res, next) => {
    try {
      const id = req.user._id;

      const updates = req.body;
      const options = { new: true };
      const result = await Auth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Auth does not exist');
      }
      return res.send({
        success: true,
        message: 'Chat Engage status updated!',
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

  updateChatEngageStatusClient: async (req, res, next) => {
    try {
      const id = req.body.advisor_id;

      const updates = req.body;
      const options = { new: true };

      const result = await Auth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Auth does not exist');
      }
      
      return res.send({
        success: true,
        message: 'Chat Engage status updated!',
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

  updateAAuth: async (req, res, next) => {
    const id = req.params.id;
    const newArray = [];
    try {

      // const result = await Auth.findById(id);

      if (req.files) {

        const files = req.files;

        files.forEach( async (element,index) => {

          if (element.fieldname == 'gov_photo_id_front') {
            // fs.unlinkSync(filePath);      
            req.body.gov_photo_id_front = element.path;
          }

          if (element.fieldname == 'gov_photo_id_backend') {
            req.body.gov_photo_id_backend = element.path;
          }

          if (element.fieldname == 'us_tax_norms') {
            req.body.us_tax_norms = element.path;
          }

          if (element.fieldname == 'avatar') {
            req.body.avatar = element.path;
          }

          if (element.fieldname == 'certificate') {
            newArray.push(element.path);
          }

        });

      }

      if(newArray.length > 0) {
         req.body.certificate = newArray;
      }

      const global_setting = await GlobalSetting.findOne({});
      const min_rate_per_minute = global_setting.min_rate_per_minute||0;
      const max_rate_per_minute = global_setting.max_rate_per_minute||100;

      var  discount_period_from = global_setting.discount_period_from;
      var  discount_period_to = global_setting.discount_period_to;

      const start = Date.parse(discount_period_from);
      const d = Date.now();
      const end = Date.parse(discount_period_to);

      if(d >= start && d <= end){
        //throw createError(201, 'You are not allowed to change rate now due to cause of promotional period till date (promotional end date).');
      }

      if ((req.body.rate_per_min <= min_rate_per_minute) || (req.body.rate_per_min >= max_rate_per_minute)) {
        //throw createError(201, `Per min Rate is not allowed by admin ( set b/w ${min_rate_per_minute} and ${max_rate_per_minute}), please contact admin!`);
      }

      const updates = req.body;
      const options = { new: true };

      const result = await Auth.findByIdAndUpdate(id, updates, options);
      if (!result) {
        throw createError(201, 'Auth does not exist');
      }

        const customer = await Auth.findById(id);

        console.log(customer);

        if (customer.rate_per_min > 0 || customer.mobile > 0 || customer.marketing_intro > 0 || customer.avatar > 0 || customer.description > 0 || customer.rate_per_min > 0 ) {
          const options = { new: true };
          const result = await Auth.findByIdAndUpdate(id, {user_status : 1}, options);
          if (!result) {
            throw createError(201, 'Auth does not exist');
          }
        }

        return res.send({
          success: true,
          message: 'Data updated!',
          data: result
        });
    } catch (error) {
      console.log(error);
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
      return res.send({
        success: true,
        message: 'Data deleted!',
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Auth id'));
        return;
      }
      next(error);
    }
  } , 
  getnotificationById: async (req, res, next) => {
    const id = req.params.id;
    try {
    
      const advisorNotifications = await Notification.find({advisor_id:id});

      if (!advisorNotifications) {
        throw createError(201, 'There is no notifications found.');
      }
      res.send({
        status: 200,
        data: advisorNotifications
      });
    } catch (error) {
      console.log(error.message);
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Advisor id'));
        return;
      }
      next(error);
    }
  },
  getClientslist: async (req, res, next) => {
    try {
    
      const allclients = await Clients.find({}, { _id: 1, name:1 , username:1, email:1 });

      if (!allclients) {
        throw createError(201, 'There is no clients found.');
      }
      res.send({
        status: 200,
        data: allclients
      });
    } catch (error) {
      if (error instanceof mongoose.CastError) {
        next(createError(201, 'Invalid Advisor id'));
        return;
      }
      next(error);
    }
  },
};