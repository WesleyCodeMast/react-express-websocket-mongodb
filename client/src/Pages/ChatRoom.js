import AdvisorMobileNotes from '../Components/Chat/MobileAdvisorNotes';
import StripePayment from '../Components/CustomerProfile/Addmore';
import React  , { useState , useEffect , useRef, useContext, useCallback } from 'react';
import MobileKeynotes from '../Components/Chat/MobileKeynotes';
import ClientHeader from '../Components/Headers/ClientHeader'
import ChatContainer from '../Components/Chat/ChatContainer';
import { useParams , useNavigate, redirect } from 'react-router-dom';
import AdvisorNotes from '../Components/Chat/AdvisorNotes';
import AdvisorKeyNotes from '../Components/Chat/Keynotes';
import Timer from '../Components/Chat/Timer';
import {io} from 'socket.io-client';
import jwtDecode from 'jwt-decode';
import swal from 'sweetalert';
import moment from 'moment';
import axios from 'axios';
import { NoteIcon2, NoteIcon4 } from '../Components/Icons';
import { getAidFromStorageToken, getCidFromStorageToken } from '../Utils/storageHelper';
import CAvatar from '../Components/CAvatar';
import { notifyOnlineStatus } from '../Utils/socketUtils';
import { calculateTotalTime } from '../Utils/times';
import { notifyTerminateChat } from '../Utils/notificationUtils';
import { IPhoneContext } from '../Context/DeviceContext';
import { ActionButton } from '../Components/Loading';

export default function ChatRoom() {

  const params = useParams();
  const navigate = useNavigate();
  const [oppositeStatus,setOppositeStatus] = useState(true);
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
  const [showResults, setShowResults] = useState(false)
  const [stateChat, setStateChat] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const isiPhone = useContext(IPhoneContext);
  const chatroomRef = useRef();
  const onClick = (e) => {
    e.preventDefault();
    debugger;
    setShowResults(true);
  }
  const [timerExpire,setTimerExpire] = useState(false);
  const [clientTopUp,setClientTopUp] = useState(false);

  const [newTimers,setTimers] = useState('');
  const [isUserActive, setIsUserActive] = useState(true);
  const [timeOutId, setTimeOutId] = useState(null);
  const [callModal,setCallModal] = useState('false');
  var from = '';
  var to = '';

  if(params.type === 'client') {
     from = localStorage.getItem('cid');
     to = localStorage.getItem('aid');
  } else {
     from = localStorage.getItem('aid');
     to = localStorage.getItem('cid');
  }
  const resizeHeight = () => {
      setTimeout(() => {
        if(chatroomRef.current) {
          console.log(chatroomRef.current.style)
          chatroomRef.current.style.height = window.visualViewport.height - 200;
          console.log(chatroomRef.current.style.height)
        }
      }, 200)}

  useEffect(() => {
    if (window.performance && localStorage.getItem('timers')) {
      if (performance.navigation.type == 1) {
          localStorage.removeItem('timers');
          localStorage.setItem('advisor_to_chat', true);
      } 
    }

    if(!chatroomRef.current)
      return;
    
    // if(isiPhone) {
      // window.addEventListener('resize', resizeHeight);
      document.body.style.overflow = 'hidden';
      return () => {
        // window.removeEventListener('resize', resizeHeight);
        
    };
    // }

  },[])
  
  useEffect(() => {

    function handleVisibilityChange() {

      if(document.hidden) {   
        // change my status to offline
        setTimeout(() => {
          setIsUserActive(false);
        }, 300);
        // notify that my status has been changed to offline
        notifyOnlineStatus(socket, params.room, localStorage.getItem('aid'), localStorage.getItem('cid'), false, from, to);
        if(timeOutId) {
          clearTimeout(timeOutId);
        }

        // const newTimeoutId = setTimeout(() => {
        //   if(localStorage.getItem('cid') && localStorage.getItem('aid')) {
        //     var localStorageTime = localStorage.getItem('WAIT_TIME')
        //     if(localStorageTime!=null && localStorageTime!=undefined) {
        //       var currentTime = moment().format('LTS');
        //       var timeDifference = calculateTotalTime(currentTime,localStorageTime);
        //       debugger;
        //       if(!showResults && timeDifference > 25){
        //         // let element = moment().format('LTS');
        //         let element = new Date().toISOString();
        //         debugger;
        //         notifyTerminateChat(socket, params.room, params.type, element, showResults);
        //       } else if(timeDifference >= 14) {
        //         setStateChat(true);
        //         setCallModal('true');
        //       }
        //     }
        //   }
        // }, 30000);
        // setTimeOutId(newTimeoutId);
      }
      else {
        setTimeout(() => {
          setIsUserActive(true);
        }, 300);
        // notify that my status has been changed to online
        notifyOnlineStatus(socket, params.room, localStorage.getItem('aid'), localStorage.getItem('cid'), true, from, to);
        // change my status to online
        clearTimeout(timeOutId);
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if(timeOutId) {
        clearTimeout(timeOutId);
      }
    }

  }, [socket, timeOutId])
  const setRatenew = (e) => {
    localStorage.setItem('newRate', localStorage.getItem('advisorRate'));
    setAdvistorRate(e.target.value);
  }
  /**
   * 
   */
  useEffect(() => {
    debugger;
    localStorage.removeItem('ChatRequestviaPayment');
    localStorage.setItem('room', params.room);
    setTimeout(() => {
      localStorage.removeItem('stopTimer');
    },1000);

    setTimeout(() => {
      localStorage.setItem('offerExpire',true);
      setShowOffer(false);
    },180000);

    const id = localStorage.getItem('cid');
    debugger;
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
                  socket.current.emit('ganesh', ({ client: localStorage.getItem('cid'), advisor: localStorage.getItem('aid') , msg: result.data.data.timer }));
              }).catch(err => {
                  console.log(err);
              });
            } else {
                const data_Add = {
                  "client_id": localStorage.getItem('cid'),
                  "advisor_id": localStorage.getItem('aid'),
                  "start_time" : new Date().toISOString(),
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
                    if(!localStorage.getItem('WAIT_TIME')) {
                      localStorage.setItem('WAIT_TIME',moment().format('LTS'));
                    }  
                })
            }
         } else {
          localStorage.setItem('lowbalance',true);
          localStorage.removeItem('chatstarted'); 
        }
     });
    }
 
  },[timerleft, params.type, from, to ]);

  useEffect(() => {
    async function fetchTime() {
      var i = setInterval(async function() { 
        await axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/timers/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , {
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

    if(localStorage.getItem('cid') && localStorage.getItem('aid')) {
      fetchTime();
    }      
    },[]);
   useEffect(() => {

   }, [newTimers, advisorRate])
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
    if(Token)
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
          
      }).catch(err => {
        window.location.pathname = '/';
      });
    else {
      window.location.pathname = '/';
    }
  },[Token, Types]);

  // perform when initiate chat room and then emit 'CHAT-INITIATE' socket(roomID, aid, cid) and then remove localStorage item 'chatstarted'
  useEffect(() => {
    if(localStorage.getItem('aid'))
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
                user1: localStorage.getItem('aid'),
                user2: localStorage.getItem('cid')
              }));
            
          } else {
            localStorage.removeItem('chatstarted');
          }
      }).catch(err => {})
  },[]);

  /**
   * api which is performed when param has been changed
   *  1. connect to the socket server
   *  2. get the localStorageItem "clientTz"
   *  3. set and get the localStorageItem "advisorTz"
   *  4. emit 'JOIN_ROOM' socket(roomID, user, clientTz, aTz)
   *  5. if i am advisor, fetch "/frontend/clients/cid/aid" then compare the balance with isProceed,
   *  6. if balance is bigger than IsProceed, emit 'CHAT-INITIATE' socket(roomID, aid, cid)
   */
  useEffect(() => {
    if(socket.current) {
      socket.current.close();
    }

    socket.current = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
    console.log("Socket Connection: ", socket.current);
    let cTz = localStorage.getItem("clientTz");
    let aTz = "";
    if(cTz != null)
      aTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    else
      cTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    socket.current.emit('JOIN_ROOM', ({ room:params.room , user:params.id, clientTz: cTz, advisorTz: aTz}));

    if(params.type === 'service' && localStorage.getItem('cid') && localStorage.getItem('aid')) {
      axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/clients/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result => { 
        var cbalance = '';
        var IsProceed = '';
        if(result.data.data.promotion.length > 0) {
          cbalance = parseFloat(result.data.data.result[0].wallet_balance) + parseFloat(result.data.data.promotion[0].amount);
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
  },[params]);
  /**
   * when this component mounts, check if localStorage item 'chatstarted' is true, 
   * if localStorage item 'advisor_customrate' exist, setShowOffer(false)
   */
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

  /**
   * 
   * @param {*} t1 : start time 
   * @param {*} t2 : end time
   * @returns if FreeExpire is true, then calculate the actual is 0 when duration is less than 30 minutes otherwise, the actual is duration
   */
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
    /**
     * socket listener for 'TERMINATE-CHAT-NOTIFY' socket(roomID, aid, cid) 
     *  
     * if i am advisor, request order-invoices (rate, start_time, end_time),
     *  then change my chat_engage status to 0,
     *  then redirect to the receipt page
     * if i am client, request order-invoices (rate, start_time, end_time),
     * then request update-wallet-balance,
     * after 2 seconds, redirect to the receipt page
     */
      socket.current.on('TERMINATE-CHAT-NOTIFY', ({ advisor , client , room }) => {
        if(!showResults && params.room === room) {
          /**
           * if i am advisor, request order-invoices (rate, start_time, end_time),
           *  then change my chat_engage status to 0,
           *  then redirect to the receipt page
           */
              if(advisor === localStorage.getItem('aid') && client === localStorage.getItem('cid') && params.type === 'service') {
                    localStorage.removeItem('timers');
                    localStorage.removeItem('chatstarted');
                    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result => {
                        localStorage.setItem('advisorRate', result.data.data.advisor_rate);
                        setAdvistorRate(result.data.data.advisor_rate);
                        localStorage.setItem('StartTime', result.data.data.start_time);
                        localStorage.setItem('EndTime', result.data.data.end_time);
                    });
                    if(!showResults)
                        swal("success", "Chat terminated due to Inactivity", "success");
                    if(localStorage.getItem('notif_id'))
                        axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/notification/delete/${localStorage.getItem('notif_id')}`).then(result => {
                            const data_update = {
                                "chat_engage": 0
                            }
                            axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-engage-status`, data_update , {
                                headers: {
                                    'Accept': 'application/json, text/plain, */*',
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
                                },  
                            }).then(result1 => {
                                window.location.href = '/receipt';
                            });
                        }).catch(err => {
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
                                window.location.href = '/receipt';
                            }).catch(err => {});
                        });
            } 
            /**
             * if i am client, request order-invoices (rate, start_time, end_time),
             * then request update-wallet-balance,
             * after 2 seconds, redirect to the receipt page
             */
            if(advisor === localStorage.getItem('aid') && client === localStorage.getItem('cid') && params.type === 'client') {
                    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result => {
                    setAdvistorRate(result.data.data.advisor_rate);
                    localStorage.setItem('advisorRate', result.data.data.advisor_rate);
                    localStorage.setItem('StartTime', result.data.data.start_time);
                    localStorage.setItem('EndTime', result.data.data.end_time);
                     
                    var acm = Earning(result.data.data.start_time, result.data.data.end_time);
                    var res_amot = localStorage.getItem('promo_amount') ? localStorage.getItem('promo_amount') : 0;
                    var actualMinute = acm - res_amot;
                    
                    const data_val = {
                      wallet_balance : parseFloat(Math.abs(actualMinute))
                    }

                    axios.put(`${process.env.REACT_APP_BASE_URL}/client/auth/upade-wallet-balance/${client}` , data_val).then(result => {
                      if(!showResults)
                        swal("success", "Chat terminated due to Inactivity", "success");   
                      setTimeout(() => {
                        window.location.href = '/receipt';
                      },2000);                 
                      //updatePromotionAmount
                    }).catch(err => {})
              }) 
            }         
          }
      });
      /**
       * socket listener for 'ganesh-info' socket(client, advisor, msg)
       * set localStorage item 'stopTimer' to true,
       * set localStorage item 'timers' to msg,
       * set localStorage item 'newTimers' to msg,
       * setChatInitiate(false)
       */
      socket.current.on('ganesh-info' , ({ client, advisor, msg }) => {
        if(client === localStorage.getItem('cid') && advisor === localStorage.getItem('aid')) {
            localStorage.setItem('stopTimer',true);
            localStorage.setItem('timers', Math.round(msg));
            localStorage.setItem('newTimers', Math.round(msg));
            setChatInitiate(false);
        }
      })
      /**
       * socket listener for 'TIMER-SEND-NOTIFY' socket(advisor, client, timer)
       * set localStorage item 'timers' to timer,
       * setChatInitiate(true)
       */
      socket.current.on('TIMER-SEND-NOTIFY' , ({ advisor  ,client , timer}) => {
        if(localStorage.getItem('cid') === client && localStorage.getItem('aid') === advisor) {
          localStorage.setItem('timers', timer);
          setChatInitiate(true);
        }
      });
      /**
       * socket listener for 'RATE-ACCEPTED' socket(advisor, client, totalAmount, oldAmount, prevRate, rate)
       * check if client and advisor are the same,
       * 
       */
      socket.current.on('RATE-ACCEPTED', ({ advisor, client, totalAmount , oldAmount ,prevRate ,rate }) => {
          if(client === localStorage.getItem('cid') && advisor === localStorage.getItem('aid')) {
                const delayTimer = {
                   "timer": Math.abs((totalAmount*60)/rate)
                }
                axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/timers/${client}/${advisor}` , delayTimer, {
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json',
                    },  
                }).then(result3 => {
                      localStorage.setItem('stopTimer',true);
                      localStorage.setItem('newRate', prevRate);
                      localStorage.setItem('advisorRate', rate);
                      setAdvistorRate(rate);
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

      socket.current.on('status-changed-online', ({room, advisor, client, status, sender, reciever}) => {
        if(params.room === room && advisor === localStorage.getItem('aid') && client === localStorage.getItem('cid') && from === reciever) {
          setOppositeStatus(status);
        }
      });

      socket.current.on('topup-client-notify', ({ room, advisor, client }) => {
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
        debugger;
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
            axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/timers/${client}/${advisor}` , delayTimer, {
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
            setTimerExpire('false');
          
            axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result => {
              localStorage.setItem('advisorRate', result.data.data.advisor_rate);
              setAdvistorRate(result.data.data.advisor_rate);
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
              let id = getAidFromStorageToken();
              axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${id.id}`).then(result => {
                localStorage.setItem('advisorRate', result.data.data.advisor_rate);
                setAdvistorRate(result.data.data.advisor_rate);
                localStorage.setItem('StartTime', result.data.data.start_time);
                localStorage.setItem('EndTime', result.data.data.end_time);
              });

              if(localStorage.getItem('advisor-end-chat')) {
                swal("success", "Chat has been ended", "success");
              } else {
                swal("success", "Client has ended chat", "success");
              }
              if(localStorage.getItem('notif_id'))
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
                      window.location.href = '/receipt';
                  }).catch(err => {});
                  localStorage.removeItem('aid');
                  setSubmitNotes(true);
                  setChatInitiate(false);
              }).catch(err => {
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
                    window.location.href = '/receipt';
                }).catch(err => {});
              });  
          }
        }
        
    });
    
    socket.current.on('CLIENT-CHAT-REJECTED-NOTIFYBACK', ({ advisor }) => {
      if(advisor === localStorage.getItem('aid')) {
        swal('error', "Advisor is busy! Please book time slot to connect with advisor.","error");
        localStorage.removeItem('timers');
        setTimeout(() => {
          navigate('/client/dashboard');
        },5000)
      }
      
    });

    socket.current.on('RECHARGE-TIME-EXPIRE-NOTIFYBACK', ({ room , advisor }) => {
      if(params.type === 'service' && params.room === room && advisor === params.id) {
          swal('error', "Chat Time Expire and chat is terminated","error");
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
  const handleBack = () => {
    debugger;
    if(params.type === 'client')
      navigate('/client/dashboard');
    else if(params.type === 'service')
      navigate('/advisor/dashboard');
  }
  const HandleLeaveChat = () => {
    if(params.type === 'client') {
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
  
          let element = new Date(localStorage.getItem('endChatTime')).toISOString();
          const data_val2 = {
            "end_time": element,
            "advisor_rate": localStorage.getItem('advisorRate')
          }
    
          axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , data_val2).then(result => {
            axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result1 => {
              localStorage.setItem('advisorRate', result1.data.data.advisor_rate);
              setAdvistorRate(result1.data.data.advisor_rate);
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
         //HandleLeaveChatSecondStep();
      }
    }
    else if(params.type === 'service') {
      AdvisorHandleLeaveChat();
    }
  }

  const AdvisorHandleLeaveChat = () => {
    localStorage.setItem('advisor-end-chat', true);
    debugger;
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

              let element = new Date(localStorage.getItem('endChatTime')).toISOString();
              const data_val2 = {
                "end_time": element,
                "advisor_rate": localStorage.getItem('advisorRate')
              }
        
              axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , data_val2).then(result => {
                axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result1 => {
                  localStorage.setItem('advisorRate', result1.data.data.advisor_rate);
                  setAdvistorRate(result1.data.data.advisor_rate);
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

         let element = new Date().toISOString();
           const data_val2 = {
             "end_time": element,
             "advisor_rate": localStorage.getItem('advisorRate')
           }
     
           axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , data_val2).then(result => {
             axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result1 => {
               localStorage.setItem('advisorRate', result1.data.data.advisor_rate);
               setAdvistorRate(result1.data.data.advisor_rate);
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
    setTimerExpire(false);
    setHangupshowPopup(false);
    // socket.current.emit('topup-client' , 
    // ({room:params.room , advisor: localStorage.getItem('aid'),
    // client: localStorage.getItem('cid') }));
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
          setAdvistorRate(result.data.data.advisor_rate);
          localStorage.setItem('StartTime', result.data.data.start_time);
          localStorage.setItem('EndTime', result.data.data.end_time);
        });
        window.location.href = '/receipt';
    }).catch(err => {
        swal('Hello', 'Please add comment', 'error');
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
        setAdvistorRate(result.data.data.advisor_rate);
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
         
      {/* <ClientHeader name = {customerName} type = {Types} /> */}
       <div className='chat absolute w-screen'>
          <div className='container'>
            <div className='row'>
              <div className='col-12 col-lg-12'>
              <div ref={chatroomRef} className='chat-box chatroom-height absolute top-2 left-0 w-full'>
              <div className="messaging bg-white">
                  <div className='chat-head purple-gradient rounded-t-xl mobile-padding-zero  flex items-center'>
                    <nav className="w-full z-20 absolute top-0 left-0">
                      <div className='hidden-xs  purple-gradient rounded-t-xl py-4 px-3'>
                        <div className='flex flex-row items-center justify-around'>
                          { chatInitiate === true && 
                              <button className="absolute left-0 btn btn-link flex-1 cursor-pointer" onClick={handleBack}>
                                {/* <img src='/assets/images/frontend/hangup-icon.png' alt='Hang Up' className='inline-block' /> */}
                                  {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clipRule="evenodd" />
                                  </svg> */}
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="white" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                  </svg>

                                {/* Hang Up */}
                              </button> 
                            }  
                          { params.type === 'client' ?
                              <h6 className='text-white text-base font-bold mb-0 ffp_chatbox flex-1 text-center'>{advisorName}</h6>
                              :
                              <h6 className='text-white text-base font-bold mb-0 ffp_chatbox flex-1 text-center'>{clientName}</h6>
                          }
                          </div>
                      </div>
                    </nav>

                    <nav className="absolute w-full z-20 top-0 left-0 md:px-3 sm:px-0">

                    <div className='hidden-xl mobileRoom  purple-gradient rounded-t-xl py-2'>
                      <div className='flex items-center justify-around'>
                        <div className='in1'>
                        { chatInitiate === true && 
                            <button className="btn btn-link cursor-pointer" onClick={handleBack}>
                              {/* <img src='/assets/images/frontend/hangup-icon.png' alt='Hang Up' className='inline-block' /> */}
                                {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                                  <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clipRule="evenodd" />
                                </svg> */}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="white" className="w-6 h-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>

                              {/* Hang Up */}
                            </button> 
                          }
                          
                        </div>
                        <div className='in2 flex flex-cols items-center justify-content'>
                          <div className='mr-2 flex items-center'>
                            { params.type === 'client' ?

                              <CAvatar img={advisorImage} imgAlt={advisorName} size={24} status={oppositeStatus}/>
                              :
                              <CAvatar img={clientImage} imgAlt={clientName} size={24} status={oppositeStatus}/>
                            }
                          </div>
                          { params.type === 'client' ?
                            <h4 className='text-white font-bold fsp-20 text-center ffp_chatbox'>{advisorName}</h4>
                              :
                            <h4 className='text-white font-bold fsp-20 text-center ffp_chatbox'>{clientName}</h4>
                          }
                        </div>
                        {/* <div className='in3'>
                          
                        </div> */}
                        <div className='in4'>
                          { chatInitiate === true && localStorage.getItem('timers') &&
                              <>
                                <div className='count-down flex items-center'>
                                  <i className="bi bi-clock-fill fsp-25 text-white text-sm mr-2"></i>
                                  <Timer 
                                      delayResend = {localStorage.getItem('timers') ? localStorage.getItem('timers'): newTimers} 
                                      socket = {socket} 
                                      room = {params.room} 
                                      action = {setChatInitiate} 
                                      timerAction = {setTimerExtend}
                                  />
                                </div>
                              </>  
                          } 
                        </div>
                        { chatInitiate === true && params.type === 'service' &&
                          
                            <>
                              <button className="btn btn-link cursor-pointer text-white" data-toggle="modal" data-target="#mobilekeynote" onClick={onClick}> 
                                <NoteIcon4 /> 
                              </button>
                            </>
                          }
                        <button className="btn btn-link cursor-pointer" onClick={HandleLeaveChat}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="white" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    </nav>

                  </div>
                <div className='mtopup hidden-xl'>
                  {/* { chatInitiate === true && params.type === 'client' &&
                    <>
                        <button className="btn btn-purple" type='button' 
                              onClick={HandletopupMore}
                              title="Add more fund"
                              style={{fontSize: "14px"}}
                        >
                          Top Up
                        </button>
                    </> 
                  } */}
                  {/* <div className='container-fluid'>
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
                          <AdvisorMobileNotes advisor_id = {params.id} show={showResults} setShow={setShowResults}/>
                        </>
                      }
                    </div>
                  </div> */}
                  {/* {
                      params.type === 'service' && showOffer && !localStorage.getItem('offerExpire') &&
                        <button className="rounded-xl mt-4 border-2 border-red-500 px-2 py-2 text-sm mb-3 font-medium text-red-500 transition duration-200 hover:bg-red-600/5 active:bg-red-700/5" type='button' 
                              onClick={HandleShare}
                              title="Offer Special Rate"
                              style={{fontSize: "14px"}}
                        >
                          Custom Rate
                        </button>
                    } */}
                </div>
              <div className='row md:border-2 rounded-xl border-inherit mx-0'>
              <div className='col-12 col-sm-9 px-0' id='chatbox'>
                <div className='chat-room'>
                  <div className="inbox_msg" style={{ background: 'url(assets/images/frontend/Chatbg.jpg)', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                      <ChatContainer 
                        HandletopupMore={HandletopupMore}
                        stateChat={stateChat}
                        setStateChat={setStateChat}
                        oppositeStatus={oppositeStatus}
                        isUserActive={isUserActive}
                        advisorName={advisorName}
                        clientName={clientName}
                        socket = {socket} 
                        from = {from} 
                        to = {to}  
                        actionChat ={setChatInitiate} 
                        popupShow={setPaymentPopUp} 
                        image={Image} 
                        advisorImage={advisorImage} 
                        clientImage={clientImage} />
                  </div>
                </div>
              </div>
              
                <div className='col-12 col-sm-3 hidden-xs chat-container-sidebar-height shadow-[inset_1px_1px_10px_#46464620]' id='profilebox'>
                    <div className='side-panel text-center pt-20' >
                          { params.type === 'client' ?
                              <CAvatar img={advisorImage} imgAlt={advisorName} size={32} status={oppositeStatus}/>
                              // <img src={`${advisorImage}`} onError={addDefaultSrc} className='mx-auto rounded-full  active-advisor' alt='Advisor' />
                              :
                              <CAvatar img={clientImage} imgAlt={clientName} size={32} status={oppositeStatus}/>
                              // <img src={`${clientImage}`} onError={addDefaultSrc} className='mx-auto  rounded-full  active-advisor' alt='Client' />
                          }
                           
                           
                            { params.type === 'client' ?
                                <h4 className='text-black font-bold fsp-20 text-center pt-3 ffp_chatbox'>{advisorName}</h4>
                                  :
                                <h4 className='text-black font-bold fsp-20 text-center pt-3 ffp_chatbox'>{clientName}</h4>
                            }
                            {/* { params.type === 'service' &&
                               <a href="/advisor/dashboard/active" className="btn btn-purple text-white bold-button mt-4 px-4 py-2 ffp_chatbox rounded-5 fsp-15">Chat history & Notes</a>
                            } */}
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
                            <span className="mt-8 inline-flex items-center rounded-md px-2 py-1 text-base font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                              ${localStorage.getItem('advisorRate')}/min
                            </span>
                            {
                              params.type === 'service' && showOffer && !localStorage.getItem('offerExpire') &&
                                <div className='notesbutton'>
                                  <button className="rounded-xl mt-4 border-2 border-red-500 px-2 py-2 text-sm mb-3 font-medium text-red-500 transition duration-200 hover:bg-red-600/5 active:bg-red-700/5" type='button' 
                                        onClick={HandleShare}
                                        title="Offer Special Rate"
                                        style={{fontSize: "14px"}}
                                  >
                                    Custom Rate
                                  </button>
                                </div>
                            } 
                            

                          { chatInitiate === true && params.type === 'client' &&
                            <div className="flex justify-center mt-2">
                                {/* <button 
                                  onClick={HandletopupMore}
                                  title="Add more fund"
                                  className="mt-4 flex justify-center items-center rounded-xl bg-gradient-to-br from-[#ac3ca8] to-[#FF5555] px-3 py-2 text-sm font-medium text-white transition duration-200 hover:shadow-lg hover:shadow-[#6025F5]/50">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                  </svg>
                                  &nbsp;Top Up
                                </button> */}
                                {/* <button type="button" className="max-w-[140px] py-2 px-4 flex justify-center items-center  bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:ring-offset-red-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg ">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                  </svg>                                  
                                  Top Up
                                </button>
                                <button 
                                  className="flex justify-center items centerrounded-xl bg-gradient-to-br from-[#6025F5] to-[#FF5555] px-5 py-3 text-base font-medium text-white transition duration-200 hover:shadow-lg hover:shadow-[#6025F5]/50">
                                    Button 16
                                </button> */}

                                {/* <button className="btn btn-purple bold-button mt-2 px-5 py-2 ffp_chatbox rounded-5 fsp-15" type='button' 
                                      onClick={HandletopupMore}
                                      title="Add more fund"
                                      style={{fontSize: "14px"}}
                                >
                                  Top Up
                                </button> */}
                            </div> 
                          }
                          <div className='notesbutton'>
                          { chatInitiate === true && params.type === 'client' &&
                            
                            <button 
                              onClick={HandleLeaveChat}
                              className="rounded-xl mt-4 border-2 border-red-500 px-2 py-2 text-sm mb-3 font-medium text-red-500 transition duration-200 hover:bg-red-600/5 active:bg-red-700/5">
                                End the Chat
                            </button>
                          }
                          {
                            params.type === 'service' && 
                            <>
                              <div className='cursor-pointer flex justify-center mt-4' onClick={onClick}>
                                <ActionButton loading={loadingNotes}>
                                  <NoteIcon2 />
                                </ActionButton>
                              </div> 
                              <AdvisorKeyNotes advisor_id = {params.id}  />
                              <button className="btn btn-purple bold-button mt-2 px-5 py-2 ffp_chatbox rounded-5 fsp-15" onClick={onClick}>Notes</button> 
                            </>
                            
                          }
                          </div>
                          
                         {/* { params.type === 'service' &&
                            <>
                              <AdvisorNotes advisor_id = {params.id} />
                             </>  
                         }  */}

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

      <div className='mobilenotes'>
        { showResults === true && params.type === 'service' && 
          <>
            <AdvisorMobileNotes advisor_id = {params.id} client_id={localStorage.getItem('cid')} show={showResults } setShow={setShowResults} setLoading={setLoadingNotes}/>
          </>
        }
      </div>
     { MyShare === true && params.type === 'service' && 
       <div className="modal show" style={{display: 'block'}} id="myModal3">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header text-left">
              <h4 className="modal-title">Offer Special Rate
              <h5 className='text-purple'>Note: Make sure discounted rate should not be greater than current rate!</h5>
              </h4>
              <button 
                type="button" 
                className="close" 
                onClick={e=> {
                  e.preventDefault();
                  setMyShare(false);
                }}
                data-dismiss="modal">&times;</button>
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
                        <div className=' text-gray-400 text-base text-center'>Would you like to hang up?</div>
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
                          <div className=' text-gray-400 text-base text-center'>We are urging the client to top up and chat longer. Please stay for extra 45 seconds.</div>
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
                      {/* <button type="button" onClick={Handletopup} className="px-4 px-md-4 py-1.5 btn btn-primary rounded-1 mt-3 mb-2 ffp fsp-12 mr-2">Top Up</button> */}
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
      {
      (PaymentPopUp === true) && params.type === 'client' &&
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
