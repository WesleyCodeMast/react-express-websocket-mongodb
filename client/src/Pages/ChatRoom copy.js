import React  , { useState , useEffect , useRef } from 'react'
import ClientHeader from '../Components/Headers/ClientHeader'
import {io} from 'socket.io-client';
import ChatContainer from '../Components/Chat/ChatContainer';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Timer from '../Components/Chat/Timer';
import swal from 'sweetalert';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import { getAidFromStorageToken, getCidFromStorageToken } from '../Utils/storageHelper';

export default function ChatRoom() {

  const params = useParams();
  const socket = useRef();
  const [minChatMin , setMiniMumChatMinutes] = useState();
  const [chatInitiate , setChatInitiate] = useState(false);
  const [timerExtend, setTimerExtend] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPoint, setReviewPoint] = useState('');
  const [timerleft, setTimerLeft] = useState('');
  const [customerName , setName] = useState('');
  const [Image , setImage] = useState('');
  const Token = params.type === 'client' ? localStorage.getItem('clientToken') : localStorage.getItem('advisorToken');
  const Types = params.type === 'client' ? 'client' : 'advisor';
  const [subMitNotes, setSubmitNotes] = useState(false);
  const [advisorNotes,setAdvisorNotes] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [PaymentPopUp,setPaymentPopUp] = useState(false);
  const [advisorRate,setAdvistorRate] = useState('');
  const [showOffer,setShowOffer] = useState(true);
  const [freeMinutes,SetFreeMinutes] = useState(false);
  const [advisorImage, setAdvisorImage] = useState('assets/images/frontend/ad-profile-pic.png');
  const [clientImage, setClientImage] = useState('assets/images/frontend/ad-profile-pic.png');
  const [advisorName,setAdvisorname] = useState('');
  const [clientName,setClientName] = useState('');

  var from = '';
  var to = '';

  if(params.type == 'client') {
     from = localStorage.getItem('cid');
     to = localStorage.getItem('aid');
  } else {
     from = localStorage.getItem('aid');
     to = localStorage.getItem('cid');
  }

  const setRatenew = (e) => {
    localStorage.setItem('newRate', localStorage.getItem('advisorRate'));
    setAdvistorRate(e.target.value);
  }

  useEffect(() => {

    setTimeout(() => {
      localStorage.removeItem('stopTimer');
    },1000);

    setTimeout(() => {
      localStorage.setItem('offerExpire',true);
      setShowOffer(false);
    },30000);

    const id = localStorage.getItem('cid');
    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/client/${id}`).then(result => {
        setTimerLeft(parseFloat(result.data.data.wallet_balance));
        const balance = parseFloat(result.data.data.wallet_balance);
        const IsProceed = parseFloat(localStorage.getItem('advisorRate') * localStorage.getItem('minChatMinutes')).toFixed(2);
        const actualMinute = result.data.data.wallet_balance;
              
        if(balance >= IsProceed) {
            localStorage.removeItem('lowbalance');
            if(localStorage.getItem('timers')) {
              localStorage.setItem('timers', localStorage.getItem('timers'));
            } else {
                  localStorage.setItem('timers', (actualMinute*60)/localStorage.getItem('advisorRate'));
            }
         } else {
          localStorage.setItem('lowbalance',true);
          localStorage.removeItem('chatstarted'); 
        }
    });
  },[timerleft, params.type, from, to]);

  async function getCurrentBalance() {
      const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/client/${localStorage.getItem('cid')}`).then(result => {
          setTimerLeft(parseFloat(result.data.data.wallet_balance));
      });
    return res;  
  }

  async function CurrentBalance() {
    const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/client/${localStorage.getItem('cid')}`).then(result => {
      return result.data.data.wallet_balance;
    });
    return res;
  }

  useEffect(() => {
    const img_data = {
      "client_id": localStorage.getItem('cid'),
      "advisor_id": localStorage.getItem('aid')
    }

    axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/profile-images`, img_data ).then(result => {
          setClientImage(`${process.env.REACT_APP_BASE_URL}/${result.data.client_profile}`);
          setAdvisorImage(`${process.env.REACT_APP_BASE_URL}/${result.data.advisor_profile}`);
          setAdvisorname(result.data.advisor_name);
          setClientName(result.data.client_name);
    }).catch(err => {})

    axios.get(`${process.env.REACT_APP_BASE_URL}/${Types}/auth/profile`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer `+Token
      },
    }).then(result => {
        setName(result.data.data.username);
        setMiniMumChatMinutes(result.data.min_chat_minutes);
        if(result.data.data.avatar) {
           setImage(`${process.env.REACT_APP_BASE_URL}/${result.data.data.avatar}`);
        }
        if(result.data.data.avail_free_mins) {
          SetFreeMinutes(true);
         }

         localStorage.setItem('comm_rate',result.data.data.commission_rate);
         
    }).catch(err => {})
  },[Token, Types]);

  useEffect(() => {
    socket.current = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
    console.log("Socket Connection: ", socket.current);
    socket.current.emit('JOIN_ROOM', ({ room:params.room , user:params.id}));

    if(params.type === 'service' && localStorage.getItem('cid') && localStorage.getItem('aid')) {
      axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/client/${localStorage.getItem('cid')}`).then(result => { 
        const IsProceed = parseFloat(localStorage.getItem('advisorRate') * localStorage.getItem('minChatMinutes')).toFixed(2);;
        const cbalance = parseFloat(result.data.data.wallet_balance);
        if(cbalance >= IsProceed) {
          socket.current.emit('CHAT-INITIATE', ({ 
            room: localStorage.getItem('username'), 
            user1: localStorage.getItem('aid') , 
            user2: localStorage.getItem('cid') 
          }));
        }
      });
    }
},[params.id, params.room, params.type]);

    useEffect(() => {
        if(localStorage.getItem('chatstarted')) {
          localStorage.setItem('chatstarted',true);
          setChatInitiate(true);
        } else {
          localStorage.removeItem('chatstarted');
          setChatInitiate(false);
        }
    },[]);

   useEffect(() => {
    if(socket.current)  {
      socket.current.on('RATE-ACCEPTED', ({ advisor, client, totalAmount , prevRate ,rate }) => {
        if(client === localStorage.getItem('cid')) {
          localStorage.setItem('stopTimer',true);
          localStorage.setItem('newRate', prevRate);
          localStorage.setItem('advisorRate', rate);
          localStorage.setItem('offerExpire',true);
          setShowOffer(false);
          localStorage.setItem('timers', Math.round(totalAmount));
          window.location.reload(false); 
        }
      });

    socket.current.on('FREE-MINUTE-ACCEPTED', ({ client, totalAmount }) => {
      if(client === localStorage.getItem('cid')) {
        localStorage.setItem('stopTimer',true);
        localStorage.setItem('FreeExpire',true);
        SetFreeMinutes(false);
        localStorage.setItem('timers', Math.round(totalAmount));
        window.location.reload(false);
      }
    });

    // socket.current.on('NOTIFICATION-SEND-CHATROOM', ({ advisor , client }) => {
    //     if(params.type === 'service' && advisor === params.id) {
    //       window.location.href = '/advisor/dashboard';
    //     }
    // });

    socket.current.on('NOTIFICATION-PAYMENT-COMP-NOTIFY', ({ advisor , client , room }) => { 
      if(params.type === 'service' && advisor === params.id && room === params.room) {
        localStorage.setItem('chatstarted',true);
        window.location.reload();
      }
      if(params.type === 'client' && client === params.id && room === params.room) {
        localStorage.setItem('chatstarted',true);
        window.location.reload();
      }
    });

    socket.current.on('CHAT-START', ({ user1 , user2 }) => {
      console.log("Chat Start",user1,user2);
       if(user1 === localStorage.getItem('aid') && (user2 === localStorage.getItem('cid'))) {
        axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/client/${localStorage.getItem('cid')}`).then(result => {
          const IsProceed = parseFloat(localStorage.getItem('advisorRate') * localStorage.getItem('minChatMinutes')).toFixed(2);;
          const cbalance = parseFloat(result.data.data.wallet_balance);
          if(cbalance >= IsProceed) {   
            localStorage.setItem('chatstarted',true);
            setChatInitiate(true);
            var time = moment().format('LTS');
            const data_Add = {
                "client_id": user2,
                "advisor_id": user1,
                "start_time" : time,
                "end_time": '0:0:0',
                "advisor_rate": localStorage.getItem('advisorRate')
            }
            if(!localStorage.getItem('oid')) {
              axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices`, data_Add).then(result1 => {
                localStorage.setItem('oid', result1.data.data._id);
              })
            }
          }
        });

       } else {
          setChatInitiate(false);
       }
    });

    socket.current.on('leave-chat-notify' , ({ room , advisor, client , time }) => {
      getCurrentBalance();
      setReviewOpen(true);
      const data = {
        from: localStorage.getItem('cid'),
        to: localStorage.getItem('aid')
      }
      axios.delete(`${process.env.REACT_APP_BASE_URL}/chat/deletemsg`, {
        data
      }).then(result => {
        console.log("Result", result);
      });
      var time1 = moment().format('LTS');
      const data_val = {
        "end_time": time1,
        "advisor_rate": localStorage.getItem('advisorRate')
      }

      axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${client}/${advisor}` , data_val).then(result => {
        axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${client}/${advisor}`).then(result1 => {
          localStorage.setItem('advisorRate', result1.data.data.advisor_rate);
          localStorage.setItem('StartTime', result1.data.data.start_time);
          localStorage.setItem('EndTime', time1);
        }).catch(err => {})
      }).catch(err => {})

      if(params.type === 'client') {
        var actualMinute = 0;
        if(localStorage.getItem('FreeExpire')) {
          actualMinute = parseFloat((localStorage.getItem('timers')-1800) / 60).toFixed(2);
        } else if(localStorage.getItem('newRate')) {
          var kl = parseFloat((localStorage.getItem('timers')*localStorage.getItem('newRate') - localStorage.getItem('prevtimer')*localStorage.getItem('advisorRate')));
          if(Math.sign(kl) === -1) {
            actualMinute = parseFloat(kl / 60).toFixed(2);
          } else {
            actualMinute = parseFloat(kl / 60).toFixed(2);
          }
        } else {
          actualMinute = parseFloat(localStorage.getItem('timers') / 60).toFixed(2);
        }

        if(Math.sign(actualMinute) === -1) {
          actualMinute = 0;
        }
        
          const data_val = {
            wallet_balance : parseFloat(actualMinute*localStorage.getItem('advisorRate'))
          }
          axios.put(`${process.env.REACT_APP_BASE_URL}/client/auth/upade-wallet-balance/${localStorage.getItem('cid')}` , data_val).then(result => {
            localStorage.removeItem('timers');
          }).catch(err => {})

        localStorage.removeItem('chatinitiate');
        localStorage.removeItem('chatstarted');
        localStorage.removeItem('timer');
        localStorage.removeItem('timerExtend');
        localStorage.removeItem('cid');
        setReviewOpen(true);
        localStorage.setItem('review', true);
        setChatInitiate(false);
      }
      if(params.type === 'service') {
        localStorage.removeItem('timers');
        localStorage.removeItem('chatstarted');

        const id = getAidFromStorageToken();
        axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${id.id}`).then(result => {
          localStorage.setItem('advisorRate', result.data.data.advisor_rate);
          localStorage.setItem('StartTime', result.data.data.start_time);
          localStorage.setItem('EndTime', result.data.data.end_time);
        });

        swal("success", "Client has ended chat", "success");
        axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/notification/delete/${localStorage.getItem('notif_id')}`).then(result => {
            const data_update = {
              "chat_engage": 0
          }
          axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-engage-status`, data_update , {
              headers: {
                  'Accept': 'application/json, text/plain, */*',
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer `+localStorage.getItem('advisorToken')
              },  
          }).then(result1 => {
              window.location.href = '/receipt'
          })
        localStorage.removeItem('aid');
        setSubmitNotes(true);
        setChatInitiate(false);
       })  
      }
   });

   socket.current.on('CLIENT-CHAT-REJECTED-NOTIFYBACK', data => {
     swal('oops', "Advisor is busy! Please book time slot to connect with advisor.","error");
     localStorage.removeItem('timers');
     setTimeout(() => {
        window.location = '/client/dashboard'
     },5000)
   });

   socket.current.on('RECHARGE-TIME-EXPIRE-NOTIFYBACK', data => {
        swal('oops', "Chat Time Expire and chat is terminated","error");
        const data_update = {
          "chat_engage": 0
        }
        axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-engage-status`, data_update , {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer `+localStorage.getItem('advisorToken')
            },  
      }).then(result => {  
            setTimeout(() => {
              window.location = '/advisor/dashboard'
          },1000)
      })
   });

   socket.current.on('ALERT-CHAT-EXTEND-NOTIFYBACK', lk => {
     if(lk == params.id && params.type == 'service') {
         swal('success', 'Wait for a minute to client recharge their top up', 'success');
     } 
   })
  }

  },[socket.current, params.id, params.room, params.type])

  const handleChange =(e) => {
    if(params.type == 'client') {
      from = localStorage.getItem('cid');
      to = localStorage.getItem('aid');
    } else {
      from = localStorage.getItem('aid');
      to = localStorage.getItem('cid');
    }
    window.location = `/client/stripe-checkout-chat/${e.target.value}/${from}/${to}`;
 }

  const HandleLeaveChat = () => {
    setReviewOpen(true);
     localStorage.removeItem('chatstarted');
     localStorage.removeItem('chatInitiate');
     localStorage.removeItem('timers');
     setChatInitiate(false);
    socket.current.emit('leave-chat' , ({room:params.room , advisor: localStorage.getItem('aid'),
          client: localStorage.getItem('cid')}));
  }

  const SubmitReview = () => {
      const data = {
         "rating": reviewPoint,
         "review": reviewComment,
         "advisor_id": localStorage.getItem('aid')
      }
      axios.post(`${process.env.REACT_APP_BASE_URL}/client/reviews` , data, {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer `+localStorage.getItem('clientToken')
        },  
    }).then(result1 => {
        const id = getCidFromStorageToken();
        axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${id.id}/${localStorage.getItem('aid')}`).then(result => {
          localStorage.setItem('advisorRate', result.data.data.advisor_rate);
          localStorage.setItem('StartTime', result.data.data.start_time);
          localStorage.setItem('EndTime', result.data.data.end_time);
        });
         window.location.href = '/receipt';
    }).catch(err => {
        swal('oops', 'Please add comment', 'error');
    })
  }

  const SubmitNotesAdvisor = () => {
      const data = {
        "notes": advisorNotes,
        "client_id": localStorage.getItem('cid'),
        "advisor_id": params.id
      }
      
      axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/notes` , data, {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer `+localStorage.getItem('advisorToken')
        },  
    }).then(result => {
          swal('success', "Notes Submitted", 'success');
          setAdvisorNotes('');
    }).catch(err => {
        swal('oops', 'Please add notes', 'error');
    })
  }

  const addDefaultSrc = (ev) => {
    ev.target.src = `/assets/images/avtar/user-profile.png`;
  }

  const ClosePopupPayment = () => {
     setPaymentPopUp(false);
  }

  const ClosePopupReview = () => {
    const id = getCidFromStorageToken();
    setReviewOpen(false);
    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${id.id}/${localStorage.getItem('aid')}`).then(result => {
      localStorage.setItem('advisorRate', result.data.data.advisor_rate);
      localStorage.setItem('StartTime', result.data.data.start_time);
      localStorage.setItem('EndTime', result.data.data.end_time);
    });
    setTimeout(() => {
      window.location.href = '/receipt';
    }, 1000);
  }

  const GetAdvistorRate = async() => {
    const actualAmount = await CurrentBalance();
    if(advisorRate > localStorage.getItem('advisorRate')) {
      swal('error', 'Discounted rate should not more than current Rate', 'error');
    } else {
      socket.current.emit('acceptRate', ({ room: params.room , advisor: params.id , client: localStorage.getItem('cid')  ,
      amount:Math.round((actualAmount*localStorage.getItem('advisorRate')*60)/localStorage.getItem('advisorRate')),
      timer:localStorage.getItem('timers'),  
      prevRate: localStorage.getItem('newRate'),
      rate:advisorRate}));
    }
  }

  const FreeMinutesHandle = async() => {
    const kl = await CurrentBalance();
      socket.current.emit('free-minutes', ({ 
        room: params.room , 
        client: localStorage.getItem('cid')  , 
        amount:Math.round((30*localStorage.getItem('advisorRate')*60)/localStorage.getItem('advisorRate')),
        timer: localStorage.getItem('timers')
      }));
    swal('success', 'Free Minutes Applied', 'success');
  }

  return (
    <div>
      <ClientHeader name = {customerName} type = {Types} />
       <div className='chat fixed w-full'>
          <div className='container'>
            <div className='row'>
              <div className='col-12 col-lg-12'>
              <div className='chat-box mt-5 mb-5'>
              
              <div className="messaging shadow-md rounded-xl bg-white">
                <div className='chat-head purple-gradient rounded-t-xl px-3 py-2'>
                  <div className='row'>
                    <div className='col-6 col-lg-6'>
                    { params.type === 'client' ?
                        <h6 className='text-white text-base mb-0 ffp_chatbox'>{advisorName}</h6>
                        :
                        <h6 className='text-white text-base mb-0 ffp_chatbox'>{clientName}</h6>
                    }
                    </div>
                    <div className='col-6 col-lg-6'>
                      <h6 className='custom-text text-base font-semibold text-right mb-0'>${localStorage.getItem('advisorRate')}/min</h6>
                    </div>
                  </div>
                </div>
                <div className='row'>
              <div className='col-12 col-sm-8 col-lg-9' id='chatbox'>
                <div className='chat-room'>
                  <div className="inbox_msg" style={{ background: 'url(assets/images/frontend/Chatbg.jpg)', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                        <ChatContainer socket = {socket} from = {from} to = {to}  actionChat ={setChatInitiate} popupShow={setPaymentPopUp} image={Image} advisorImage={advisorImage} clientImage={clientImage} amount={localStorage.getItem('timers')}/>
                  </div>
                </div>
              </div>
              
                <div className='col-12 col-sm-4 col-lg-3' id='profilebox'>
                    <div className='side-panel text-center pt-4'>
                          { params.type === 'client' ?
                               <img src={`${advisorImage}`} onError={addDefaultSrc} className='mx-auto  rounded-full  active-advisor'/>
                              :
                              <img src={`${clientImage}`} onError={addDefaultSrc} className='mx-auto  rounded-full  active-advisor'/>
                          }
                           
                            {
                               params.type === 'client' &&
                               <>
                                   <div className='btn-purple text-white bold-button mt-4 py-3 px-2 rounded-5 fsp-15 ffp_chatbox'>Balance: ${parseFloat(timerleft).toFixed(2)}</div>
                                   <a href="/client/dashboard/active" className="btn btn-purple text-white bold-button mt-4 px-5 py-2 ffp_chatbox rounded-5 fsp-15" target="_blank">Chat History</a>
                               </> 
                            }

                            { params.type === 'service' &&
                               <a href="/advisor/dashboard/active" className="btn btn-purple text-white bold-button mt-4 px-5 py-2 ffp_chatbox rounded-5 fsp-15" target="_blank">Chat History</a>
                            }
                           
                            { params.type === 'client' ?
                                <h4 className='text-black font-bold fsp-20 text-center pt-3 ffp_chatbox'>{advisorName}</h4>
                                  :
                                <h4 className='text-black font-bold fsp-20 text-center pt-3 ffp_chatbox'>{clientName}</h4>
                            }
                            {/* <span className="text-black font-semibold fsp-14 text-center pt-1">Client's date of birth </span> */}
                           
                            {
                              params.type === 'service' && showOffer && !localStorage.getItem('offerExpire') &&
                                <button className="btn btn-purple bold-button mt-4 px-5 py-2 ffp_chatbox rounded-5 fsp-15" type='button' 
                                      data-toggle="modal" 
                                      data-target="#myModal3"
                                      title="Offer Special Rate"
                                >
                                  Custom Rate
                                </button>
                            } 
                            {
                              params.type === 'service' && freeMinutes && !localStorage.getItem('FreeExpire') && 
                                <button className="btn btn-purple bold-button mt-4 px-5 py-2 ffp_chatbox rounded-5 fsp-15" type='button' 
                                      onClick={FreeMinutesHandle}
                                      title="Promotional Free Minutes"
                                >
                                  Free Minutes
                                </button>
                            } 
      
                        { chatInitiate === true && localStorage.getItem('timers') &&
                            <>
                              <div className='count-down'>
                                <i className="bi bi-clock-fill fsp-30 text-purple"></i>
                                  <span className='ml-2 font-bold'>
                                    <Timer 
                                          delayResend = {localStorage.getItem('timers')} 
                                          socket = {socket} 
                                          room = {params.room} 
                                          action = {setChatInitiate} 
                                          timerAction = {setTimerExtend}
                                    />
                                  </span>
                              </div>
                            </>  
                         } 

                         { chatInitiate === true && params.type === 'client' &&
                              <button className="btn btn-primary bold-button mt-4 px-5 py-2 ffp_chatbox rounded-5 fsp-15" onClick={HandleLeaveChat}>End the Chat</button>  
                         }

                         { params.type === 'service' &&
                            <>
                              <div className='advisornotes'>
                                Advisor Notes:-
                                <textarea className="form-control text-sm" cols={4} rows={14} placeholder="Comment" value ={advisorNotes} onChange={(e) => setAdvisorNotes(e.target.value)}></textarea>
                                {  params.type === 'service' &&
                                    <a onClick={SubmitNotesAdvisor} className="btn btn-primary text-pink bold-button mt-4 px-5 cursor-pointer fsp-15 inline-block">
                                      Submit Notes
                                  </a>
                                } 
                              </div>
                             </>  
                         } 

                        {
                           chatInitiate === false && params.type === 'client' && localStorage.getItem('cid') && !localStorage.getItem('lowbalance') &&
                              <div>
                                <span className='ml-2 font-bold text-purple ffp_chatbox'>Waiting for advisor to connect</span>
                              </div>
                         }

                         {
                            params.type === 'client' && localStorage.getItem('lowbalance') &&
                              <div>
                                <span className='ml-2 font-bold text-purple ffp_chatbox'>Please recharge your wallet</span>
                              </div>
                         }

                    </div>
                </div>

              </div>
                
              </div>
              </div>

              </div>
            </div>
          </div>
      </div>

  { PaymentPopUp && params.type === 'client' &&
       <div className="modal show" id="myModaltoptup"  style={{display: 'block'}}>
       <div className="modal-dialog modal-dialog-centered">
         <div className="modal-content">
              <button type="button" className="close text-right pr-3 pt-0 mt-3 focus:outline-0" data-dismiss="modal" onClick={ClosePopupPayment}><i className='bi bi-x-lg text-xl'></i></button> 
           <div className="modal-body">
             <div className='balance'>
             <ul className="list-inline">
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="5" className="btn-check" id="bordered-radio-1" name="btnradio" />        
                     <span className="forcustom">5 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="10" className="btn-check" id="bordered-radio-2" name="btnradio" />        
                     <span className="forcustom">10 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="15" className="btn-check" id="bordered-radio-3" name="btnradio" />        
                     <span className="forcustom">15 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="20" className="btn-check" id="bordered-radio-4" name="btnradio" />        
                     <span className="forcustom">20 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="25" className="btn-check" id="bordered-radio-5" name="btnradio" />        
                     <span className="forcustom">25 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="30" className="btn-check" id="bordered-radio-6" name="btnradio" />        
                     <span className="forcustom">30 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="35" className="btn-check" id="bordered-radio-7" name="btnradio" />        
                     <span className="forcustom">35 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="40" className="btn-check" id="bordered-radio-8" name="btnradio" />        
                     <span className="forcustom">40 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="45" className="btn-check" id="bordered-radio-9" name="btnradio" />        
                     <span className="forcustom">45 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="50" className="btn-check" id="bordered-radio-10" name="btnradio" />        
                     <span className="forcustom">50 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="55" className="btn-check" id="bordered-radio-11" name="btnradio" />        
                     <span className="forcustom">55 minutes</span>
                   </label>
                 </div>
               </li>
               <li>
                 <div className="radio">
                   <label>
                     <input type="radio"  onChange={handleChange} value="60" className="btn-check" id="bordered-radio-12" name="btnradio" />        
                     <span className="forcustom">60 minutes</span>
                   </label>
                 </div>
               </li>
               
             </ul>
             <h4 className='text-center font-bold text-xl'>stripe</h4>
             </div>
           </div>
         </div>
       </div>
     </div>
  }
     
      <div className="modal myshare" id="myModal3">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header text-left">
              <h4 className="modal-title">Offer Special Rate
              <h5 className='text-purple'>Note: Make sure discounted rate should not be greater than current rate!</h5>
              </h4>
              <button type="button" className="close" data-dismiss="modal">&times;</button>
            </div>
            <div className="modal-body">
            <form className='profileinfo'>
            <div className="row mb-3">
                  <label htmlFor="inputname" className="col-sm-3 col-form-label text-right text-black font-medium">Discounted Rate</label>
                  <div className="col-sm-9">
                  <input type="number" className="form-control" name='MyShare' onChange = {setRatenew} placeholder='$ 3.99' />
                  </div>
              </div>
              <div className='text-right'><button type='button' onClick={GetAdvistorRate} className="px-3 px-md-3 py-1.5 btn btn-light rounded-1 mt-2 mb-2 ffp_chatbox fsp-17">Submit</button></div>
              </form>
            </div>
          </div>
        </div>
      </div>

    { reviewOpen && params.type === 'client' &&
      <div className="modal show" style={{display: 'block'}}id="myModal4">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header text-center">
              <h4 className="modal-title text-pink">Share Your Feedback</h4>
              <button type="button" className="close" data-dismiss="modal" onClick={ClosePopupReview}><span className='text-purple' style={{padding: '0px 10px 0px 8px'}}>&times;</span></button> 
            </div>
            <div className="modal-body">
              <div className='balance ratingreview text-center'>
                <p className='text-center'>You have 24 hours to write and edit this review after a chat is done. Your feedback will be taken seriously by our support team.</p>
           
            <div className="form-check form-check-inline mt-3 mb-3">
            <div className="flex items-center">
                  <input className="w-4 h-4" type="radio" onChange={(e) => setReviewPoint(e.target.value)} value ="5" name="flexRadioDefault" id="flexRadioDefault2" />
                  <div className="flex items-center ml-2">
                  <i className="bi bi-emoji-smile-fill"></i>
                </div>
              </div>
              <div className="flex items-center mr-2">
               <input className="w-4 h-4" type="radio" onChange={(e) => setReviewPoint(e.target.value)} value ="1" name="flexRadioDefault" id="flexRadioDefault1" />
                  <div className="flex items-center ml-2">
                  <i className="bi bi-emoji-frown"></i>
                </div>
              </div> 
               
              
              </div>

              <textarea className="form-control text-sm" cols={4} rows={4} placeholder="Comment" onChange={(e) => setReviewComment(e.target.value)}></textarea>
              <div className="text-center"><button type="button" onClick={SubmitReview} className="px-4 px-md-4 py-1.5 btn btn-light rounded-1 mt-2 mb-2 ffp_chatbox fsp-17">Submit</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    </div>
  )
}
