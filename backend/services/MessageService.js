const ChatMessage = require('../Models/Chat.model');
const MessagesHistory = require("../Models/MessageHistory.model");
const Auth = require('../Models/Advisor/Auth.model');
const GlobalSetting = require('../Models/GlobalSetting.model');
const Clients = require('../Models/Client/Auth.model');
const Nodemailer = require('../Utils/Nodemailer')
const path = require('path')
const ejs = require('ejs');

var MailChimp = require('mailchimp').MailChimpAPI;

var apiKey = process.env.MAILCHIMPAPIKEY;

global.MailChimpAPI = new MailChimp(apiKey, {
    version: '2.0'
});
exports.saveMessage = async (msg) => {
    try {
        const { from, to, message , doc , rate, pictimes ,pic } = msg;
        const data = await ChatMessage.create({
            message: { text: message },
            users: [from, to],
            sender: from,
            rate: rate,
            pictimes: pictimes,
            pic: pic,
            doc: { name: doc.name, type: doc.type },
        });
        const dataHistory = await MessagesHistory.create({
            message: { text: message },
            users: [from, to],
            sender: from,
            rate: rate,
            pictimes:pictimes,
            pic: pic,
            doc: { name: doc.name , type: doc.type }
        });
        console.log(data._id.toString());
        if (data && dataHistory) return true;
        else {
            console.log("Failed to add message to the database.")
            return true;
        }
    } 
    catch (ex) {
        console.log(ex);
        return false;
    }
}

exports.updateChatStatus = async (msg) => {
    try {

        const id = msg.from;
        
        const {client_id, chat_status} = msg;
        const options = { new: true };
  
        const result = await Auth.findByIdAndUpdate(id, {client_id, chat_status}, options);
        if (!result) {
            throw createError(201, 'Auth does not exist');
        }
  
        var absoluteBasePath = path.resolve('');
  
        const advisor = await Auth.findById(id);
  
        const clients = advisor.clients;

        const logoData = await GlobalSetting.findOne({});

        const logo = process.env.BASE_URL+'/api/'+logoData.logo;
        if(chat_status == 1) {
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
}