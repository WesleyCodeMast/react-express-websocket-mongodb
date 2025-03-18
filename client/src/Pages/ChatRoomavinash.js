import React  , { useState , useEffect , useRef } from 'react'
import ClientHeader from '../Components/Headers/ClientHeader'
import {io} from 'socket.io-client';
import ChatContainer from '../Components/Chat/ChatContainer';
import { useParams , useNavigate } from 'react-router-dom';
import axios from 'axios';
import Timer from '../Components/Chat/Timer';
import swal from 'sweetalert';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import StripePayment from '../Components/CustomerProfile/Addmore';
import AdvisorNotes from '../Components/Chat/AdvisorNotes';
import AdvisorMobileNotes from '../Components/Chat/MobileAdvisorNotes';
import AdvisorKeyNotes from '../Components/Chat/Keynotes';
import MobileKeynotes from '../Components/Chat/MobileKeynotes';
import { getAidFromStorageToken, getCidFromStorageToken } from '../Utils/storageHelper';

export default function ChatRoom() {

  const params = useParams();
  const navigate = useNavigate();
  const socket = useRef();
  const [msg,setMsg] = useState('');
  const [errorType,setErrorType] = useState('');
  const [minChatMin , setMiniMumChatMinutes] = useState('');
  const [maxChatMin , setMaxiMumChatMinutes] = useState('');
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
  const [showResults, setShowResults] = React.useState('false')
  const onClick = () => setShowResults(true);
  const [timerExpire,setTimerExpire] = useState(false);
  const [clientTopUp,setClientTopUp] = useState(false);

  const [newTimers,setTimers] = useState('');

  var from = '';
  var to = '';

  if(params.type === 'client') {
     from = localStorage.getItem('cid');
     to = localStorage.getItem('aid');
  } else {
     from = localStorage.getItem('aid');
     to = localStorage.getItem('cid');
  }

  useEffect(() => {
    if (window.performance && localStorage.getItem('timers')) {
      if (performance.navigation.type == 1) {
          localStorage.removeItem('timers');
          localStorage.setItem('advisor_to_chat', true);
      } 
    }
  },[])

  const setRatenew = (e) => {
    localStorage.setItem('newRate', localStorage.getItem('advisorRate'));
    setAdvistorRate(e.target.value);
  }

  useEffect(() => {
    localStorage.removeItem('ChatRequestviaPayment');
    localStorage.setItem('room', params.room);
    setTimeout(() => {
      localStorage.removeItem('stopTimer');
    },1000);
    /**
     * after 3 minutes, set localStorage Item 'offerExpire' to true
     */
    setTimeout(() => {
      localStorage.setItem('offerExpire',true);
      setShowOffer(false);
    },180000);

    const id = localStorage.getItem('cid');
   
    if(localStorage.getItem('cid') && localStorage.getItem('aid')) {
      axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/clients/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result => {
        var balance = '';
        var IsProceed = ''
        var actualMinute = '';
        if(result.data.data.promotion.length > 0) {
          setTimerLeft(parseFloat(result.data.data.result[0].wallet_balance)+parseFloat(result.data.data.promotion[0].amount));
          balance = parseFloat(result.data.data.result[0].wallet_balance)+parseFloat(result.data.data.promotion[0].amount);
          IsProceed = parseFloat(localStorage.getItem('advisorRate') * localStorage.getItem('minChatMinutes')).toFixed(2);
          actualMinute = parseFloat(result.data.data.result[0].wallet_balance)+parseFloat(result.data.data.promotion[0].amount);
          localStorage.setItem('promo_amount',result.data.data.promotion[0].amount);
        } else {
          setTimerLeft(parseFloat(result.data.data.result[0].wallet_balance));
          balance = parseFloat(result.data.data.result[0].wallet_balance);
          IsProceed = parseFloat(localStorage.getItem('advisorRate') * localStorage.getItem('minChatMinutes')).toFixed(2);
          actualMinute = parseFloat(result.data.data.result[0].wallet_balance);
        }

        if(balance >= IsProceed) {
            localStorage.removeItem('lowbalance');
            if(localStorage.getItem('advisor_to_chat1')) {
              CurrentTimers();
            } else if(localStorage.getItem('advisor_to_chat') || localStorage.getItem('timers') && (localStorage.getItem('cid') && localStorage.getItem('aid'))) {
                   axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/timers/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , {
                      headers: {
                          'Accept': 'application/json, text/plain, */*',
                          'Content-Type': 'application/json',
                      },  
                  }).then(result => {
                      setTimers(result.data.data.timer);
                      localStorage.setItem('timers', result.data.data.timer);
                      socket.current.emit('ganesh', ({ client: localStorage.getItem('cid') , advisor: localStorage.getItem('aid') , msg: result.data.data.timer }));
                  }).catch(err => {
                      console.log(err);
                  });
            } else {
                const data_Add = {
                  "client_id": localStorage.getItem('cid'),
                  "advisor_id": localStorage.getItem('aid'),
                  "start_time" : moment().format('LTS'),
                  "end_time": '0:0:0',
                  "advisor_rate": localStorage.getItem('advisorRate')
                }
                if(!localStorage.getItem('oid')) {
                  axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices`, data_Add).then(result1 => {
                    localStorage.setItem('oid', result1.data.data._id);
                  })
                 }
                 localStorage.setItem('start-balance', actualMinute);
                 localStorage.setItem('timers', (actualMinute*60)/localStorage.getItem('advisorRate'));
                 const newData = {
                    "client_id": localStorage.getItem('cid'),
                    "advisor_id": localStorage.getItem('aid'),
                    "timer": (actualMinute*60)/localStorage.getItem('advisorRate')
                 }
                 axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/timers`, newData).then(result1 => {
                    setTimers(result1.data.data.timer);
                    localStorage.setItem('timers', result1.data.data.timer);
                })
            }
         } else {
          localStorage.setItem('lowbalance',true);
          localStorage.removeItem('chatstarted'); 
        }
     });
    }
  },[timerleft, params.type, from, to ]);

  /**
   * in every 2 minutes, fetch timer from server and then emit ganesh socket action with the timer ,,,
   */
  useEffect(() => {
    if(localStorage.getItem('cid') && localStorage.getItem('aid')) {
        var i = setInterval(function() { 
          axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/timers/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
            },  
          }).then(result => {
              localStorage.setItem('advisor_to_chat', true);
              setTimers(result.data.data.timer);
              localStorage.setItem('timers', result.data.data.timer);
              socket.current.emit('ganesh', ({ client: localStorage.getItem('cid') , advisor: localStorage.getItem('aid') , msg: result.data.data.timer }));
          }).catch(err => {
              console.log(err);
          });
       }, 120000);
     }       
   },[]);  

  async function getCurrentBalance() {
    if(localStorage.getItem('cid')) {
        const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/client/${localStorage.getItem('cid')}`).then(result => {
          setTimerLeft(parseFloat(result.data.data.wallet_balance));
      });
      return res;  
    } 
  }

  function CurrentTimers() {
    socket.current.on('timerChat-notify', ({ room , advisor  ,client , timers }) => {
      if(advisor === localStorage.getItem('aid') && client === localStorage.getItem('cid')) {
        localStorage.removeItem('advisor_to_chat');
        localStorage.setItem('stopTimer',true);
        localStorage.setItem('timers', timers);
        localStorage.setItem('newTimers', timers);
        setChatInitiate(false);
        window.location.reload();
      }
    });
  }

  async function CurrentBalance() {
    if(localStorage.getItem('cid')) {
      const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/clients/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result => {
        if(result.data.data.promotion.length > 0) {
          setTimerLeft(parseFloat(result.data.data.result[0].wallet_balance)+parseFloat(result.data.data.promotion[0].amount));
          return parseFloat(result.data.data.result[0].wallet_balance)+parseFloat(result.data.data.promotion[0].amount);
        } else {
          setTimerLeft(result.data.data.result[0].wallet_balance);
          return result.data.data.result[0].wallet_balance;
        }
      });
      return res;
    }
  }

 useEffect(() => {

    const img_data = {
      "client_id": localStorage.getItem('cid'),
      "advisor_id": localStorage.getItem('aid')
    }

    axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/profile-images`, img_data ).then(result => {
          setClientImage(`${process.env.REACT_APP_BASE_URL}/${result.data.client_profile}`);
          setAdvisorImage(`${process.env.REACT_APP_BASE_URL}/${result.data.advisor_profile}`);
          setAdvisorname(result.data.advisor_username);
          setClientName(result.data.client_username);
    }).catch(err => {})

    axios.get(`${process.env.REACT_APP_BASE_URL}/${Types}/auth/profile`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer `+Token
      },
    }).then(result => {
        setName(result.data.data.username);
        setMiniMumChatMinutes(result.data.min_rate_per_min);
        setMaxiMumChatMinutes(result.data.max_rate_per_min);
        if(result.data.data.avatar) {
           setImage(`${process.env.REACT_APP_BASE_URL}/${result.data.data.avatar}`);
        }
        if(result.data.data.avail_free_mins) {
          SetFreeMinutes(true);
         }

         localStorage.setItem('comm_rate',result.data.data.commission_rate);
         
    }).catch(err => {});

  },[Token, Types]);
  /**
   * check if the advisor 's status is 1 and if so, emit Chat-Initiate socket action with the room, user1 and user2,
   * else remove localStorage Item 'chatstarted'
   */
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/getAdvisorChatStatus/${localStorage.getItem('aid')}`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
    }).then(result => {
        if(result.data.status === 1 ) {
           localStorage.setItem('chatstarted', true);
            socket.current.emit('CHAT-INITIATE', ({ 
              room: localStorage.getItem('username'), 
              user1: localStorage.getItem('aid') , 
              user2: localStorage.getItem('cid') 
            }));
           
        } else {
           localStorage.removeItem('chatstarted');
        }
    }).catch(err => {})
  },[]);

  useEffect(() => {
    socket.current = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
    console.log("Socket Connection: ", socket.current);
    socket.current.emit('JOIN_ROOM', ({ room:params.room , user:params.id}));

    if(params.type === 'service' && localStorage.getItem('cid') && localStorage.getItem('aid')) {
      axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/clients/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result => { 
        var cbalance = '';
        var IsProceed = '';
        if(result.data.data.promotion.length > 0) {
          cbalance = parseFloat(result.data.data.result[0].wallet_balance)+parseFloat(result.data.data.promotion[0].amount);
          IsProceed = parseFloat(localStorage.getItem('advisorRate') * localStorage.getItem('minChatMinutes')).toFixed(2);
        } else {
          cbalance = parseFloat(result.data.data.result[0].wallet_balance);
          IsProceed = parseFloat(localStorage.getItem('advisorRate') * localStorage.getItem('minChatMinutes')).toFixed(2);
        }
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

        if(localStorage.getItem('advisor_customrate')) {
          setShowOffer(false);
        }

    },[]);

    function calculateTotalTime(t1,t2) {
      localStorage.removeItem('timers');
      var time_start = moment(t2,'HH:mm:ss A');
      var time_end = moment(t1,'HH:mm:ss A');
      var duration = time_end.diff(time_start,'seconds');
      return duration;
   }

  function Earning(t1,t2) {
    var duration = calculateTotalTime(t1,t2);
    var actual = 1;
    if(localStorage.getItem('FreeExpire')) {
        actual = duration - 1800;
        if(Math.sign(actual) === -1) {
            actual = 0;
        } else {
            actual = duration;
        }
    } else {
        actual = duration;
    }
    
    var Income = Math.abs(parseFloat((actual / 60)* localStorage.getItem('advisorRate'))).toFixed(2);

    return (parseFloat(localStorage.getItem('start-balance')) - Income);
  }

   useEffect(() => {
    if(socket.current)  {

      socket.current.on('ganesh-info' , ({ client, advisor, msg }) => {
        if(client === localStorage.getItem('cid') && advisor === localStorage.getItem('aid')) {
            localStorage.setItem('stopTimer',true);
            localStorage.setItem('timers', Math.round(msg));
            localStorage.setItem('newTimers', Math.round(msg));
            setChatInitiate(false);
        }
      })

      socket.current.on('TIMER-SEND-NOTIFY' , ({ advisor  ,client , timer}) => {
        if(localStorage.getItem('cid') === client && localStorage.getItem('aid') === advisor) {
          localStorage.setItem('timers', timer);
          setChatInitiate(true);
        }
      });

      socket.current.on('RATE-ACCEPTED', ({ advisor, client, totalAmount , oldAmount ,prevRate ,rate }) => {
          if(client === localStorage.getItem('cid') && advisor === localStorage.getItem('aid')) {
                const delayTimer = {
                   "timer": Math.abs((totalAmount*60)/rate)
                }
                axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/timers/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , delayTimer, {
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json',
                    },  
                }).then(result3 => {
                      localStorage.setItem('stopTimer',true);
                      localStorage.setItem('newRate', prevRate);
                      localStorage.setItem('advisorRate', rate);
                      localStorage.setItem('offerExpire',true);
                      localStorage.setItem('oldbalance',oldAmount);
                      setShowOffer(false);
                      localStorage.setItem('timers', Math.round((totalAmount*60)/rate));
                      localStorage.setItem('newTimers', Math.round((totalAmount*60)/rate));
                      setChatInitiate(false);
                      if(params.type === 'service') {
                        window.location.reload(false); 
                      }
                })
          }
      });

      socket.current.on('topup-client-notify', ({ room , advisor  ,client }) => {
        if(client === localStorage.getItem('cid') && room === params.room) {
          setClientTopUp(true);
          setTimerExpire(false);
        }
      });

    socket.current.on('FREE-MINUTE-ACCEPTED', ({ client, totalAmount }) => {
      if(client === localStorage.getItem('cid')) {

        localStorage.setItem('stopTimer',true);
            localStorage.setItem('FreeExpire',true);
            SetFreeMinutes(false);
            localStorage.setItem('timers', Math.round(totalAmount));
            localStorage.setItem('newTimers', Math.round(totalAmount));
            window.location.reload(false);
       }
    });

    socket.current.on('timer-expire-notify', ({  room ,advisor , client , timer }) => {
      if(client === localStorage.getItem('cid')) {
        localStorage.setItem('endChatTime',timer);
        const valAmount = 0;
        const data_val = {
          wallet_balance : parseFloat(Math.abs(valAmount))
        }
        axios.put(`${process.env.REACT_APP_BASE_URL}/client/auth/upade-wallet-balance/${localStorage.getItem('cid')}` , data_val).then(result => {
          localStorage.removeItem('timers');
        }).catch(err => {})
        setTimerExpire(true);
          setTimeout(() => {
            HandleLeaveChat();
          },45000);
      }
    });

    socket.current.on('addmorebal-notify', ({  advisor , client , timer }) => {
      if(client === localStorage.getItem('cid') && advisor === localStorage.getItem('aid')) {
        localStorage.setItem('stopTimer',true);
        if(localStorage.getItem('timers')) {

          const delayTimer = {
            "timer": parseInt(localStorage.getItem('timers')) + parseInt(timer)
           }
           axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/timers/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , delayTimer, {
              headers: {
                  'Accept': 'application/json, text/plain, */*',
                  'Content-Type': 'application/json',
              },  
          }).then(result3 => {
              const balBefore = parseInt(localStorage.getItem('timers')) + parseInt(timer);   
              localStorage.setItem('timers', Math.round(balBefore));    
              localStorage.setItem('newTimers', Math.round(balBefore));
              localStorage.setItem('start-balance', parseFloat((balBefore/60) * localStorage.getItem('advisorRate')));
              setChatInitiate(false);
              setShowTopup(false);
                if(params.type === 'service') {
                  window.location.reload(false);
                }
           })

         
        } else {
          const balBefore = parseInt(timer);  
          localStorage.setItem('timers', Math.round(balBefore));    
          localStorage.setItem('newTimers', Math.round(balBefore));
          setChatInitiate(false);
          setShowTopup(false);
          window.location.reload(false);
        }
      }
    });

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
       if(user1 === localStorage.getItem('aid') && (user2 === localStorage.getItem('cid'))) {
        axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/clients/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result => {

          var cbalance = '';
          var IsProceed = '';
          if(result.data.data.promotion.length > 0) {
            cbalance = parseFloat(result.data.data.result[0].wallet_balance)+parseFloat(result.data.data.promotion[0].amount);
            IsProceed = parseFloat(localStorage.getItem('advisorRate') * localStorage.getItem('minChatMinutes')).toFixed(2);
          } else {
            cbalance = parseFloat(result.data.data.result[0].wallet_balance);
            IsProceed = parseFloat(localStorage.getItem('advisorRate') * localStorage.getItem('minChatMinutes')).toFixed(2);
          }

          if(cbalance >= IsProceed) { 
            localStorage.setItem('chatstarted',true);
            setChatInitiate(true);
          }
        });
       } else {
          setChatInitiate(false);
       }
    });

    socket.current.on('leave-chat-notify' , ({ room , advisor, client , action }) => {
      if(advisor === localStorage.getItem('aid') && client === localStorage.getItem('cid')) {
        //getCurrentBalance();
        if(params.type === 'client') {
          //setTimerExpire('false');
         
          axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result => {
            localStorage.setItem('advisorRate', result.data.data.advisor_rate);
            localStorage.setItem('StartTime', result.data.data.start_time);
            localStorage.setItem('EndTime', result.data.data.end_time);
             
              var acm = Earning(result.data.data.start_time,result.data.data.end_time);
              var res_amot = localStorage.getItem('promo_amount') ? localStorage.getItem('promo_amount') : 0;

              var actualMinute = acm - res_amot;
              
              const data_val = {
                wallet_balance : parseFloat(Math.abs(actualMinute))
              }

              axios.put(`${process.env.REACT_APP_BASE_URL}/client/auth/upade-wallet-balance/${client}` , data_val).then(result => {
                if(!localStorage.getItem('client-end-chat')) {
                  swal("success", "Advisor has ended the chat", "success");
                }

                  if(!localStorage.getItem('client-end-chat')) {
                    swal("success", "Advisor has ended the chat", "success");
                    localStorage.removeItem('timers');
                    localStorage.removeItem('chatinitiate');
                    localStorage.removeItem('chatstarted');
                    localStorage.removeItem('timer');
                    localStorage.removeItem('timerExtend');
                    localStorage.removeItem('cid');
                    setReviewOpen(true);
                    localStorage.setItem('review', true);
                    setChatInitiate(false);
                  }
              
              

                //updatePromotionAmount
               
              }).catch(err => {})
            
          });
      
             
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

            if(localStorage.getItem('advisor-end-chat')) {
              swal("success", "Chat has been ended", "success");
            } else {
              swal("success", "Client has ended chat", "success");
            }
            
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
                // navigate('/receipt');
                window.location.href = '/receipt';
            })
            localStorage.removeItem('aid');
            setSubmitNotes(true);
            setChatInitiate(false);
         })  
        }
      }
      
   });
  
   socket.current.on('CLIENT-CHAT-REJECTED-NOTIFYBACK', ({ advisor }) => {
    if(advisor === localStorage.getItem('aid')) {
      swal('oops', "Advisor is busy! Please book time slot to connect with advisor.","error");
      localStorage.removeItem('timers');
      setTimeout(() => {
         navigate('/client/dashboard');
      },5000)
    }
    
   });

   socket.current.on('RECHARGE-TIME-EXPIRE-NOTIFYBACK', ({ room , advisor }) => {
    if(params.type === 'service' && params.room === room && advisor === params.id) {
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
              navigate('/advisor/dashboard')
          },1000)
      })
    }  
   });

   socket.current.on('ALERT-CHAT-EXTEND-NOTIFYBACK', lk => {
     if(lk === params.id && params.type === 'service') {
         swal('success', 'Wait for a minute to client recharge their top up', 'success');
     } 
   })

  }

  return () => {
    socket.current.off('ganesh-info');
  }

  },[socket.current, params.id, params.room, params.type])

  const handleChange =(e) => {
    if(params.type === 'client') {
      localStorage.removeItem('timers');
      from = localStorage.getItem('cid');
      to = localStorage.getItem('aid');
    } else {
      localStorage.removeItem('timers');
      from = localStorage.getItem('aid');
      to = localStorage.getItem('cid');
    }
    localStorage.removeItem('timers');
    window.location = `/client/stripe-checkout-chat/${e.target.value}/${from}/${to}`;
 }

 const [HangupshowPopup,setHangupshowPopup] = useState(false);

  const HandleLeaveChat = () => {
   localStorage.setItem('client-end-chat',true);
   setTimerExpire(false);
    if(localStorage.getItem('endChatTime')) {
          setTimerExpire(false);
          setHangupshowPopup(false);
          localStorage.removeItem('HangupshowPopup');
          setReviewOpen(true);
          localStorage.removeItem('chatstarted');
          localStorage.removeItem('chatInitiate');
          localStorage.removeItem('timers');
          setChatInitiate(false);
          if(params.type === 'service') {
            localStorage.removeItem('chatstarted');
            localStorage.removeItem('chatInitiate');
            localStorage.removeItem('timers'); 
          }

          let element = localStorage.getItem('endChatTime');
          const data_val2 = {
            "end_time": element,
            "advisor_rate": localStorage.getItem('advisorRate')
          }
    
          axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , data_val2).then(result => {
            axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result1 => {
              localStorage.setItem('advisorRate', result1.data.data.advisor_rate);
              localStorage.setItem('StartTime', result1.data.data.start_time);
              localStorage.setItem('EndTime', element);
            }).catch(err => {})
          }).catch(err => {});
    
          socket.current.emit('leave-chat' , ({room:params.room , advisor: localStorage.getItem('aid'),
              client: localStorage.getItem('cid') , action: 'exit'}));
              
    } else {
       setTimerExpire(false);
       setHangupshowPopup(true);
       localStorage.setItem('HangupshowPopup',true);
       //HandleLeaveChatSecondStep();
    }
  }

  const AdvisorHandleLeaveChat = () => {
    localStorage.setItem('advisor-end-chat', true);
    if(localStorage.getItem('endChatTime')) {
          setTimerExpire(false);
          setHangupshowPopup(false);
          localStorage.removeItem('HangupshowPopup');
          setReviewOpen(true);
          localStorage.removeItem('chatstarted');
          localStorage.removeItem('chatInitiate');
          localStorage.removeItem('timers');
          setChatInitiate(false);
          if(params.type === 'service') {
            localStorage.removeItem('chatstarted');
            localStorage.removeItem('chatInitiate');
            localStorage.removeItem('timers'); 
          }

              let element = localStorage.getItem('endChatTime');
              const data_val2 = {
                "end_time": element,
                "advisor_rate": localStorage.getItem('advisorRate')
              }
        
              axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , data_val2).then(result => {
                axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result1 => {
                  localStorage.setItem('advisorRate', result1.data.data.advisor_rate);
                  localStorage.setItem('StartTime', result1.data.data.start_time);
                  localStorage.setItem('EndTime', element);
                }).catch(err => {})
              }).catch(err => {})
    
          socket.current.emit('leave-chat' , ({room:params.room , advisor: localStorage.getItem('aid'),
              client: localStorage.getItem('cid') , action: 'exit'}));
    } else {
      setTimerExpire(false);
      setHangupshowPopup(true);
      localStorage.setItem('HangupshowPopup',true);
    }
  }

  const chatRejected = () => {
    HandleLeaveChatSecondStep();
  }

  const LeaveChatCancel = () => {
    setHangupshowPopup(false);
  }

  function HandleLeaveChatSecondStep() {
      setHangupshowPopup(false);
      setTimerExpire(false);
      setReviewOpen(true);
      localStorage.removeItem('chatstarted');
      localStorage.removeItem('chatInitiate');
      localStorage.removeItem('timers');
      setChatInitiate(false);
      if(params.type === 'service') {
         localStorage.removeItem('chatstarted');
         localStorage.removeItem('chatInitiate');
         localStorage.removeItem('timers'); 
         setChatInitiate(false);
      } 

      let element = moment().format('LTS');
        const data_val2 = {
          "end_time": element,
          "advisor_rate": localStorage.getItem('advisorRate')
        }
  
      axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , data_val2).then(result => {
        axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result1 => {
          localStorage.setItem('advisorRate', result1.data.data.advisor_rate);
          localStorage.setItem('StartTime', result1.data.data.start_time);
          localStorage.setItem('EndTime', element);
        }).catch(err => {})
      }).catch(err => {})
 
      socket.current.emit('leave-chat' , ({room:params.room , advisor: localStorage.getItem('aid'),
           client: localStorage.getItem('cid') , action: 'exit'}));
  }

  const [showTopUp,setShowTopup] = useState(false);

  const Handletopup = () => {
    setShowTopup(true);
    // setTimerExpire(false);
    setHangupshowPopup(false);
    // socket.current.emit('topup-client' , 
    //   ({
    //     room:params.room , 
    //     advisor: localStorage.getItem('aid'),
    //     client: localStorage.getItem('cid') 
    //   }));
  }

  const HandletopupMore = () => {
    setShowTopup(true);
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


  const addDefaultSrc = (ev) => {
    ev.target.src = `/assets/images/avtar/user-profile.png`;
  }

  const ClosePopupPayment = () => {
     setPaymentPopUp(false);
  }

  const ClosePopupReview = () => {
    setReviewOpen(false);
    setTimeout(() => {
      const id = getCidFromStorageToken();
      axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${id.id}/${localStorage.getItem('aid')}`).then(result => {
        localStorage.setItem('advisorRate', result.data.data.advisor_rate);
        localStorage.setItem('StartTime', result.data.data.start_time);
        localStorage.setItem('EndTime', result.data.data.end_time);
      });
        window.location.href = '/receipt';
      }, 700);
  }

  const [MyShare,setMyShare] = useState(false);

  const GetAdvistorRate = () => {
    if(advisorRate > localStorage.getItem('newRate')) {
      swal('error', 'Discounted rate should not more than current Rate', 'error');
    } else if(advisorRate === '') {
      swal('error', 'Please do not leave blank field', 'error');
    } else {
      axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/timers/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
        },  
      }).then(result => {   
          var ac_amount = parseFloat(result.data.data.timer)/60; 
          setMyShare(false);
          localStorage.removeItem('newtimers');
          socket.current.emit('acceptRate', ({ room: params.room , advisor: params.id , client: localStorage.getItem('cid')  ,
          amount:Math.round(ac_amount)*parseFloat(localStorage.getItem('newRate')),
          oldAmount: ac_amount,
          timer:localStorage.getItem('timers'),  
          prevRate: localStorage.getItem('newRate'),
          rate:advisorRate}));
      }).catch(err => {
          console.log(err);
      });
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

  const HandleShare = () => {
    setMyShare(true);
  }

  const CloseTopupMore = () => {
    setShowTopup(false);
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
                <div className='chat-head purple-gradient rounded-t-xl px-3 py-2 mobile-padding-zero'>
                  <div className='row hidden-xs'>
                    <div className='col-6 col-lg-6'>
                    { params.type === 'client' ?
                        <h6 className='text-white text-base mb-0 ffp_chatbox'>{advisorName}</h6>
                        :
                        <h6 className='text-white text-base mb-0 ffp_chatbox'>{clientName}</h6>
                    }
                    </div>
                    <div className='col-6 col-lg-6'>
                      <h6 className='custom-text text-base font-semibold text-right mb-0'>${parseFloat(localStorage.getItem('advisorRate')).toFixed(2)}/min</h6>
                    </div>
                  </div>
                  <div className='hidden-xl mobileRoom'>
                    <div className='inline-flex'>
                      <div className='in1'>
                        { chatInitiate === true && params.type === 'client' &&
                          <button className="btn btn-link" onClick={HandleLeaveChat}><img src='/assets/images/frontend/hangup-icon.png' alt='Hang Up' className='inline-block' /> Hang Up</button> 
                        }
                        { chatInitiate === true && params.type === 'service' &&
                         
                          <>
                            <MobileKeynotes advisor_id = {params.id} />
                            <button className="btn btn-link" data-toggle="modal" data-target="#mobilekeynote"> Key Note </button>
                          </>
                        }
                      </div>
                      <div className='in2'>
                        { params.type === 'client' ?
                                <img src={`${advisorImage}`} onError={addDefaultSrc} className='' alt='Advisor' />
                              :
                              <img src={`${clientImage}`} onError={addDefaultSrc} className='' alt='Client' />
                          }
                      </div>
                      <div className='in3'>
                        { params.type === 'client' ?
                            <h4 className='text-black font-bold fsp-20 text-center pt-3 ffp_chatbox'>{advisorName}</h4>
                              :
                            <h4 className='text-black font-bold fsp-20 text-center pt-3 ffp_chatbox'>{clientName}</h4>
                        }
                      </div>
                      <div className='in4'>
                        { chatInitiate === true && localStorage.getItem('timers') &&
                            <>
                              <div className='count-down'>
                                <Timer 
                                    delayResend = {localStorage.getItem('timers') ? localStorage.getItem('timers'): newTimers} 
                                    socket = {socket} 
                                    room = {params.room} 
                                    action = {setChatInitiate} 
                                    timerAction = {setTimerExtend}
                                />
                                <p>Time Left</p>
                              </div>
                            </>  
                         } 
                      </div>
                    </div>
                  </div>
                </div>
                <div className='mtopup hidden-xl'>
                  { chatInitiate === true && params.type === 'client' &&
                    <>
                        <button className="btn btn-purple" type='button' 
                              onClick={HandletopupMore}
                              title="Add more fund"
                              style={{fontSize: "14px"}}
                        >
                          Top Up
                        </button>
                    </> 
                  }
                  <div className='container-fluid'>
                    <div className='row'>
                      <div className='col-6 p-0'>
                        {
                          params.type === 'service' && 
                          <button className="btn btn-purple" style={{fontSize: "14px"}} onClick={onClick}>General Notes</button> 
                        }
                      </div>
                      <div className='col-6 p-0'>
                        { params.type === 'service' &&
                          <a href="/advisor/dashboard/active" className="btn btn-purple chHis">Chat History</a>
                        }
                      </div>
                    </div>
                    <div className='mobilenotes'>
                      { showResults === true && params.type === 'service' &&  
                        <>
                          <AdvisorMobileNotes advisor_id = {params.id} action={setShowResults} />
                        </>
                      }
                    </div>
                  </div>
                  {
                      params.type === 'service' && showOffer && !localStorage.getItem('offerExpire') &&
                        <button className="btn btn-purple bold-button custMobile px-5 py-2 ffp_chatbox rounded-5 fsp-15" type='button' 
                              onClick={HandleShare}
                              title="Offer Special Rate"
                              style={{fontSize: "14px"}}
                        >
                          Custom Rate
                        </button>
                    }
                </div>
              <div className='row'>
              <div className='col-12 col-sm-8 col-lg-9' id='chatbox'>
                <div className='chat-room'>
                  <div className="inbox_msg" style={{ background: 'url(assets/images/frontend/Chatbg.jpg)', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                      <ChatContainer socket = {socket} from = {from} to = {to}  actionChat ={setChatInitiate} popupShow={setPaymentPopUp} image={Image} advisorImage={advisorImage} clientImage={clientImage} amount={localStorage.getItem('timers')}/>
                  </div>
                </div>
              </div>
              
                <div className='col-12 col-sm-4 col-lg-3 hidden-xs' id='profilebox'>
                    <div className='side-panel text-center pt-4'>
                          { params.type === 'client' ?
                               <img src={`${advisorImage}`} onError={addDefaultSrc} className='mx-auto  rounded-full  active-advisor' alt='Advisor' />
                              :
                              <img src={`${clientImage}`} onError={addDefaultSrc} className='mx-auto  rounded-full  active-advisor' alt='Client' />
                          }
                           
                            {
                               params.type === 'client' &&
                               <>
                                <div className='btn-purple text-white bold-button mt-4 py-3 px-2 rounded-5 fsp-15 ffp_chatbox'>Balance: ${parseFloat(timerleft).toFixed(2)}</div>
                               </> 
                            }

                            
                           
                            { params.type === 'client' ?
                                <h4 className='text-black font-bold fsp-20 text-center pt-3 ffp_chatbox'>{advisorName}</h4>
                                  :
                                <h4 className='text-black font-bold fsp-20 text-center pt-3 ffp_chatbox'>{clientName}</h4>
                            }
                            { params.type === 'service' &&
                               <a href="/advisor/dashboard/active" className="btn btn-purple text-white bold-button mt-4 px-5 py-2 ffp_chatbox rounded-5 fsp-15">Chat history & Notes</a>
                            }
                            {/* {
                              params.type === 'service' && freeMinutes && !localStorage.getItem('FreeExpire') && 
                                <button className="btn btn-purple bold-button mt-4 px-5 py-2 ffp_chatbox rounded-5 fsp-15" type='button' 
                                      onClick={FreeMinutesHandle}
                                      title="Promotional Free Minutes"
                                >
                                  Free Minutes
                                </button>
                            }  */}
      
                            { chatInitiate === true && localStorage.getItem('timers') &&
                                <>
                                  <div className='count-down'>
                                    <i className="bi bi-clock-fill fsp-25 text-purple"></i>
                                      <span className='ml-2 font-bold'>
                                        <Timer 
                                            delayResend = {localStorage.getItem('timers') ? localStorage.getItem('timers'): newTimers} 
                                            socket = {socket} 
                                            room = {params.room} 
                                            action = {setChatInitiate} 
                                            timerAction = {setTimerExtend}
                                        />
                                      </span>
                                  </div>
                                </>  
                            } 
                            {
                              params.type === 'service' && showOffer && !localStorage.getItem('offerExpire') &&
                                <button className="btn btn-purple bold-button mt-2 px-5 py-2 ffp_chatbox rounded-5 fsp-15" type='button' 
                                      onClick={HandleShare}
                                      title="Offer Special Rate"
                                      style={{fontSize: "14px"}}
                                >
                                  Custom Rate
                                </button>
                            } 
                            

                          { chatInitiate === true && params.type === 'client' &&
                            <>
                                <button className="btn btn-purple bold-button mt-2 px-5 py-2 ffp_chatbox rounded-5 fsp-15" type='button' 
                                      onClick={HandletopupMore}
                                      title="Add more fund"
                                      style={{fontSize: "14px"}}
                                >
                                  Top Up
                                </button>
                            </> 
                          }
                          <div className='notesbutton'>
                          { chatInitiate === true && params.type === 'client' &&
                            <button className="btn btn-primary bold-button mt-4 mb-2 px-5 py-2 ffp_chatbox rounded-5 fsp-15" style={{fontSize: "14px"}} onClick={HandleLeaveChat}>End the Chat</button> 
                          }
                          {/* { chatInitiate === true && params.type === 'service' &&
                            <button className="btn btn-primary bold-button mt-4 mb-2 px-5 py-2 ffp_chatbox rounded-5 fsp-15" style={{fontSize: "14px"}} onClick={AdvisorHandleLeaveChat}>End the Chat</button> 
                          } */}
                          {/* <button className="btn btn-primary bold-button mt-4 mb-2 px-4 py-2 ffp_chatbox rounded-5 fsp-15" style={{fontSize: "14px"}} data-toggle="modal" data-target="#keynote">Key Note</button> */}
                          
                          {
                            params.type === 'service' && 
                            <>
                                <button className="btn btn-primary bold-button mt-4 mb-2 px-4 py-2 ffp_chatbox rounded-5 fsp-15" style={{fontSize: "14px"}} data-toggle="modal" data-target="#keynote">Key Note</button> 
                                <AdvisorKeyNotes advisor_id = {params.id} />
                                <button className="btn btn-purple bold-button mt-2 px-5 py-2 ffp_chatbox rounded-5 fsp-15" onClick={onClick}>Notes</button> 
                            </>
                            
                          }
                          </div>
                          <div className='mobilenotes'>
                            { showResults === true && params.type === 'service' &&  
                              <>
                                <AdvisorMobileNotes advisor_id = {params.id} action={setShowResults} />
                              </>
                            }
                          </div>
                          
                         { params.type === 'service' &&
                            <>
                              <AdvisorNotes advisor_id = {params.id} />
                             </>  
                         } 

                          {
                           chatInitiate && chatInitiate === false && params.type === 'client' && localStorage.getItem('cid') && !localStorage.getItem('lowbalance') &&
                              <div>
                                <span className='ml-2 font-bold text-red ffp_chatbox'>Waiting for advisor to connect</span>
                              </div>
                          }

                          {
                            params.type === 'client' && localStorage.getItem('lowbalance') &&
                              <div>
                                <span className='ml-2 font-bold text-red ffp_chatbox'>Please recharge your wallet</span>
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
    
     { MyShare === true && params.type === 'service' && 
       <div className="modal show" style={{display: 'block'}} id="myModal3">
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
      }

    { reviewOpen && params.type === 'client' &&
      <div className="modal show" style={{display: 'block'}} id="myModal4">
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
              <div className='col-lg-12'>
                  <span className="text-center col-lg-4"><button type="button" onClick={ClosePopupReview}  style={{ background: '#e3a008' , border: '1px solid #e3a008' }} className="px-4 px-md-4 py-1.5 btn btn-light rounded-1 mt-2 mb-2 ffp_chatbox fsp-17">Skip</button></span>
                  <span className="text-center col-lg-6"><button type="button" onClick={SubmitReview} className="px-4 px-md-4 py-1.5 btn btn-light rounded-1 mt-2 mb-2 ffp_chatbox fsp-17">Submit</button></span>
               </div>  
              </div>
            </div>
          </div>
        </div>
      </div>
    }

                { HangupshowPopup === true  && 
                    <div className="modal"  style={{ "display": "block" }} id="notificationPopupHangup">
                        <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-body">
                            <div className='Notification'>
                                <div className='text-center p-3'>
                                    <img src='/assets/images/frontend/check.png' alt='right' className='inline-block' />
                                </div>
                            <div className='Notification text-gray-800 text-3xl mb-2 font-semibold text-center'>Chat</div>
                            <div className=' text-gray-400 text-base text-center'>Are you sure you would like to hang up ?</div>
                            <div className="text-right pt-2">
                                <button type="button" onClick={() => LeaveChatCancel()} className="px-4 px-md-4 py-1.5 btn btn-primary rounded-1 mt-3 mb-2 ffp fsp-12 mr-2">Cancel</button>
                                <button type="button" onClick={() => chatRejected()}  className="px-4 px-md-4 py-1.5 btn btn-light rounded-1 mt-2 ffp fsp-17">Hang Up</button>
                            </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                } 

                { 
                  (timerExpire === true) && params.type === 'service' &&
                    <div className="modal"  style={{ "display": "block" }} id="notificationPopupHangup">
                        <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-body">
                            <div className='Notification'>
                                <div className='text-center p-3'>
                                    <img src='/assets/images/frontend/check.png' alt='right' className='inline-block' />
                                </div>
                            <div className='Notification text-gray-800 text-3xl mb-2 font-semibold text-center'>Chat</div>
                            <div className=' text-gray-400 text-base text-left'>We are urging the client to top up and chat longer. Please stay for extra 45 seconds.</div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                } 

                {
                  clientTopUp === true && params.type === 'service' &&
                  <div className="modal"  style={{ "display": "block" }} id="notificationPopupHangup">
                      <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content">
                          <div className="modal-body">
                          <div className='Notification'>
                              <div className='text-center p-3'>
                                  <img src='/assets/images/frontend/check.png' alt='right' className='inline-block' />
                              </div>
                          <div className='Notification text-gray-800 text-3xl mb-2 font-semibold text-center'>Chat</div>
                          <div className=' text-gray-400 text-base text-center'>Please wait , client is top up their account</div>
                          </div>
                          </div>
                      </div>
                      </div>
                  </div>
                }

                { timerExpire === true && params.type === 'client' &&
                    <div className="modal"  style={{ "display": "block" }} id="notificationPopupHangup">
                        <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-body">
                            <div className='Notification'>
                                <div className='text-center p-3'>
                                    <img src='/assets/images/frontend/check.png' alt='right' className='inline-block' />
                                </div>
                            <div className='Notification text-gray-800 text-3xl mb-2 font-semibold text-center'>Chat</div>
                            <div className=' text-gray-400 text-base text-center'>Would you like to hang up?</div>
                            <div className="text-right pt-2">
                                <button type="button" onClick={Handletopup} className="px-4 px-md-4 py-1.5 btn btn-primary rounded-1 mt-3 mb-2 ffp fsp-12 mr-2">Top Up</button>
                                <button type="button" onClick={HandleLeaveChat}  className="px-4 px-md-4 py-1.5 btn btn-light rounded-1 mt-2 ffp fsp-17">Finish the Chat</button>
                            </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                } 

       {
          (showTopUp === true) && params.type === 'client' &&

              <div className="modal show" id="fundaddon" style={{display: 'block'}}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header text-left">
                      <h4 className="modal-title">
                          Recharge Wallet
                      </h4>
                      <button type="button" className="close" onClick={CloseTopupMore} data-dismiss="modal">&times;</button>
                    </div>
                    <div className="modal-body">
                        <StripePayment />
                    </div>
                  </div>
                </div>
              </div>
      }    

      {/* <div className="modal" id="keynote">
                    <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header text-left">
                        <h4 className="modal-title">
                            Key Note
                        </h4>
                        <button type="button" className="close" data-dismiss="modal">&times;</button>
                        </div>
                        <div className="modal-body">
                        <div className='keynote text-center'>
                            <div className='notedetail'>
                            <p>&#x2022; <span>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</span></p>
                            <p>&#x2022; <span>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.</span></p>
                            <p>&#x2022; <span>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.</span></p>
                            <p>&#x2022; <span>Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.</span></p>
                            <p>&#x2022; <span>Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.</span></p>
                            <p>&#x2022; <span>Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.</span></p>
                            </div>
                            <textarea className="form-control" rows="4" placeholder='Comment' value ={advisorkeyNotes} onChange={(e) => setAdvisorKeyNotes(e.target.value)}></textarea>
                            <button className="rounded-1 bg-purple-900 opacity-90 py-2 px-4 mt-3 text-base font-medium text-white hover:btn-light" id="submit" onClick={SubmitKeyNotesAdvisor} ><span id="button-text"> Submit </span></button>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>      */}

    </div>
  )
}
