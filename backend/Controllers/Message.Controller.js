const Messages = require("../Models/Message.model");
const MessagesHistory = require("../Models/MessageHistory.model");
const Notes = require("../Models/Advisor/AdvisorNotes.model");
var ObjectId = require('mongodb').ObjectId;
const Earning = require('../Models/Earning.model');

const ChatMessage = require('../Models/Chat.model');
const AdvisorAuth = require("../Models/Advisor/Auth.model");
const ClientAuth = require("../Models/Client/Auth.model");
const KeyNotes = require("../Models/Advisor/KeyNotes.model");
//const Timer = require('../Models/Timer.model');

// module.exports.getTimers = async (req,res,next) => {
//   try {
//     const { from, to } = req.body;

//     const timers = await Timer.find({
//       users: {
//         $all: [from, to],
//       },
//     }).sort({ updatedAt: 1 });

//     if(timers.length > 0) {
//       res.json(timers[0].timer);
//     } else {
//       res.json(0);
//     }

//   } catch (ex) {
//     next(ex);
//   }
// }

// module.exports.postTimers = async (req, res, next) => {
//   try {
//     const { from, to, timer} = req.body;
//     const data = await Timer.create({
//       users: [from, to],
//       timer: timer
//     });

//     if (data) return res.json({ msg: "Timer added successfully." , timer: timer });
//     else return res.json({ msg: "Failed to add message to the database." });
//   } catch (ex) {
//     next(ex);
//   }
// };

// module.exports.updateTimers = async (req, res, next) => {
//   try {
//     const id = req.user._id;

//     const updates = req.body;
//     const options = { new: true };

//     const result = await Timer.findByIdAndUpdate(id, updates, options);
//     if (!result) {
//       throw createError(201, 'Auth does not exist');
//     }
    
//     return res.send({
//       success: true,
//       message: 'Chat Engage status updated!',
//       data: result
//     });
//   } catch (error) {
//     console.log(error.message);
//     if (error instanceof mongoose.CastError) {
//       return next(createError(201, 'Invalid Auth Id'));
//     }
//     next(error);
//   }
// },

module.exports.getAdvisorNotes = async (req, res, next) => {
  try {
          const { id1, id2 } = req.body;
          const resultData = await Notes.aggregate([
            {
              $match: {
                advisor: new ObjectId(id2),
                client: new ObjectId(id1)
              }
            },
            {
              $sort: { "createdAt": 1 }
            },
            {
              "$group": {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d", date: "$createdAt"
                  }
                },
                messages: {
                  $push: {
                    notes: "$notes",
                    advisor: "$advisor",
                    client: "$client",
                    createdAt: "$createdAt"
                  }
                }
              }
            }]);

            advisorData1 = [];
            
          for (let result of resultData) {
            advisorData1.push({
              id: result._id,
              messages: result.messages,
            })
          }


    res.json(advisorData1);
  } catch (ex) {
    next(ex);
  }
};

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await ChatMessage.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });
    await KeyNotes
    const projectedMessages = messages.map((msg) => {
      return {
        from: msg.users[0],
        to: msg.users[1],
        msg: msg.message.text,
        doc: msg.doc,
        pictimes:msg.pictimes,
        pic: msg.pic,
        sender: msg.sender,
        createdAt: msg.createdAt,
        recievedAt: msg.recievedAt,
        clientTimezone: msg.clientTimezone,
        advisorTimezone: msg.advisorTimezone
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.updateReceivedAt = async (req, res, next) => {
  try {
    console.log("this is recieved...++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
    const data = req.body;
    const id = data.id;
    const result = await ChatMessage.findByIdAndUpdate(id, {advisorTimezone: data.advisorTz,clientTimezone: data.clientTz}, {new: false});
    console.log(result);
    res.json({updated: true});

  } catch (ex) {
    next(ex);
  }
};

module.exports.getNote = async (req, res, next) => {
  try {
    console.log("this is recieved...++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
    const {title, note} = req.body;
    const reuslt = await Earning.find({title: title});
    
    console.log(result);
    res.json({updated: true});

  } catch (ex) {
    next(ex);
  }
};

module.exports.updateNote = async (req, res, next) => {
  try {
    console.log("this is recieved...++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
    const {title, note} = req.body;
    const reuslt = await Earning.updateOne({title: title}, {note: note}, {new: false});
    
    console.log(result);
    res.json({updated: true});

  } catch (ex) {
    next(ex);
  }
};

module.exports.getMessagesHistoryPaging = async (req, res, next) => {
  try {
    const { id1, id2, isClient } = req.body;

     var page = parseInt(req.query.page)||1;
    var size = parseInt(req.query.size)||15;
    
    var query = {}
    
    var skip = size * (page - 1);
    var limit = size;

    const results = await MessagesHistory.aggregate([
    {
      $match: {
        users: {$all:[id1, id2]}
      }
    },
    {
      "$group": {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d", date: "$createdAt"
          }
        } ,
        count:{
          $sum:1
        },
        messages: {
          $push: {
            message: "$message.text",
            sender: "$sender",
            users: "$users",
            rate: "$rate",
            createdAt: "$createdAt"
          }
        }
      }
    },
    { $sort: { _id: -1 } },
    { $skip: skip  },
    { $limit: limit  }
    ]);


    const resultsCount = await MessagesHistory.aggregate([
    {
      $match: {
        users: {$all:[id1, id2]}
      }
    },
    {
      "$group": {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d", date: "$createdAt"
          }
        }
      }
    }
    ]);

    // const results = resultData.sort((a, b) => a._id > b._id ? -1 : 1);

    let advisorData = [];
    let totalchatTime = 0;
    for (let result of results) {

      var lastData = result.messages[0];
      var firstData = result.messages[result.messages.length-1];

      var valuestop = firstData.createdAt.toLocaleTimeString();
      var valuestart = lastData.createdAt.toLocaleTimeString();

      var timeStart = new Date("01/01/2007 " + valuestart).getMinutes();
      var timeEnd = new Date("01/01/2007 " + valuestop).getMinutes();

      var timeStartH = new Date("01/01/2007 " + valuestart).getHours();
      var timeEndH = new Date("01/01/2007 " + valuestop).getHours();

      var timeStartS = new Date("01/01/2007 " + valuestart).getSeconds();
      var timeEndS = new Date("01/01/2007 " + valuestop).getSeconds();

      var minDiff = await (timeEnd - timeStart);  
      var hourDiff = await (timeEndH - timeStartH);  
      var secDiff = await (timeEndS - timeStartS);  

      if (minDiff < 0) {
        minDiff = 60+parseInt(minDiff)
      }
      if (secDiff < 0) {
        secDiff = 60+parseInt(secDiff)
      }

      const chatTime = await (hourDiff+':'+minDiff+':'+secDiff);

      totalchatTime = totalchatTime+chatTime;

      const chatRate = await result.messages[0].rate;

      advisorData.push({
        _id: result._id,
        count: result.count,
        messages: result.messages,
        chat_time: chatTime,
        rate: chatRate,
        totalchat: totalchatTime,
        TotalRecords: resultsCount.length,
        page,
        size
      });
    }

    const advisorDataNew = await advisorData.sort((a,b) => b.rating_avg - a.rating_avg);

    res.json(advisorDataNew);
  } catch (ex) {
    next(ex);
  }
};

module.exports.getMessagesHistory = async (req, res, next) => {
  try {
    const { id1, id2 } = req.body;
    let advisorAvatar ;
    let clientAvatar ; 

    await AdvisorAuth.findById(id2).then(res => {
      console.log("this is advisor");
      console.log(res);
    }).catch(error => {
      advisorAvatar = null;
    });

    await ClientAuth.findById(id1).then(res => {
      console.log("this is client");
      console.log(res);
    }).catch(error => {
      clientAvatar = null;
    })

    let title = new Date().toISOString();

    // set title on messageHistory with the current time...
    await MessagesHistory.updateMany({title : null}, {title: title}, function(err, result) {
      console.log(err)
      console.log(result)
    });

    let resultData = await MessagesHistory.aggregate([
    {
      $match: {
        users: {$all:[id1, id2]}
      }
    },
    {
      $sort: { "createdAt": 1 }
    },
    {
      "$group": {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d", date: "$createdAt"
          }
        } ,
        count:{
          $sum:1
        },
        messages: {
          $push: {
            message: "$message.text",
            sender: "$sender",
            users: "$users",
            rate: "$rate",
            createdAt: "$createdAt",
            doc: "$doc"
          }
        }
      }
    }]);

    let resultDataGanesh = await Earning.aggregate([
      {
        $match: {
          client: new ObjectId(id1),
          advisor: new ObjectId(id2)
        }
      },
      {
        $sort: { "createdAt": 1 }
      },
      {
        "$group": {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d", date: "$createdAt"
            }
          } ,
          count:{
            $sum:1
          },
          cht:  { $sum: "$chat_time" },
          messages: {
            $push: {
              chat_time: ("$chat_time" ? "$chat_time" : ''),
              amount: "$amount",
              rate: "$advisor_rate",
              createdAt: "$createdAt"
            }
          }
        }
      }]);
      let lengthResult  = Math.min(resultData.length, resultDataGanesh.length);

      const results1 = resultDataGanesh.sort((a, b) => a._id > b._id ? -1 : 1);
      let advisorData = [];
      let totalchatTime = 0;


      results1.map((itm,index) => {

        const chatTime = itm.messages[index]?.chat_time ? itm.messages[index].chat_time : 0;
  
        totalchatTime = totalchatTime + chatTime;
  
        const chatRate = itm.messages[index]?.rate; 
  
        advisorData.push({
          _id: itm._id,
          messages: itm.message,
          chat_time: chatTime,
          rate: chatRate,
          cht:itm.cht,
          totalchat: totalchatTime
        });
      });

    const results = resultData.sort((a, b) => a._id > b._id ? -1 : 1);

    let advisorData1 = [];
    for (let result of results) {

      var lastData = result.messages[0];
      var firstData = result.messages[result.messages.length-1];

      var valuestop = firstData.createdAt.toLocaleTimeString();
      var valuestart = lastData.createdAt.toLocaleTimeString();

      var timeStart = new Date("01/01/2007 " + valuestart).getMinutes();
      var timeEnd = new Date("01/01/2007 " + valuestop).getMinutes();

      var timeStartH = new Date("01/01/2007 " + valuestart).getHours();
      var timeEndH = new Date("01/01/2007 " + valuestop).getHours();

      var timeStartS = new Date("01/01/2007 " + valuestart).getSeconds();
      var timeEndS = new Date("01/01/2007 " + valuestop).getSeconds();

      var minDiff = await (timeEnd - timeStart);  
      var hourDiff = await (timeEndH - timeStartH);  
      var secDiff = await (timeEndS - timeStartS);  

      if (minDiff < 0) {
        minDiff = 60+parseInt(minDiff)
      }
      if (secDiff < 0) {
        secDiff = 60+parseInt(secDiff)
      }

      const chatTime = await (hourDiff+':'+minDiff+':'+secDiff);

      totalchatTime = totalchatTime+chatTime;

      const chatRate = await result.messages[0].rate;

      advisorData1.push({
        _id: result._id,
        messages: result.messages,
      })
    }

    const advisorDataNew =  await advisorData1.sort((a,b) => b.rating_avg - a.rating_avg);

    //const advisorDataNew2 =  await advisorData.sort((a,b) => b.rating_avg - a.rating_avg);

    const totals = await Earning.aggregate([
    {
      $match: {
        client: new ObjectId(id1),
        advisor: new ObjectId(id2)
      }
    },
    { "$group": { _id: null, total_chat_time: { $sum: "$chat_time" } , total_earning: { $sum: "$earning" } } }
    ]);

    const totalChatTime = (totals && totals[0]) ? totals[0].total_chat_time : 0;

    const totalEarning =  (totals && totals[0]) ? parseFloat(totals[0].total_earning).toFixed(2) : 0;

    res.json({
      success: true,
      message: 'data fetched!',
      advisorDataNew,
      advisorData,
      total_chat_time: totalChatTime,
      total_earning: totalEarning,
    });

  } catch (ex) {
    next(ex);
  }
};

module.exports.getMsgHistoryfirst = async (req, res, next) => {
  try {
    const { id1, id2 } = req.body;

    const messages = await MessagesHistory.find({ users:{$all:[id1, id2]} }).sort({ updatedAt: 1 });
  
    const projectedMessages = messages.map((msg) => {
      return {

        from: msg.users[0],
        to: msg.users[1],
        msg: msg.message.text,
        doc: msg.doc,
        createdAt: msg.createdAt
      };
    });

    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

// add message when click send message button and then it causes "NEW_MESSAGE" event
module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message , doc , rate, pictimes ,pic } = req.body;
    console.log(req.body);
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
    if (data && dataHistory) return res.json({ msg: "Message added successfully.", msgId: data._id.toString(), msgHId: dataHistory._id.toString() });
    else return res.json({ msg: "Failed to add message to the database." });
  } catch (ex) {
    next(ex);
  }
};

module.exports.deleteChat = async (req, res, next) => {
  const { from, to } = req.body;

  try {
    const result = await ChatMessage.deleteMany({ $or: [ { "sender": from }, { "sender" : to } ] });
    if (!result) {
      throw createError(404, 'Messages does not exist.');
    }
    res.send({
      success: true,
      message: 'Data deleted',
    });
  } catch (error) {
    console.log(error.message);

    next(error);
  }
}
