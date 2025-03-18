import React, { useState , useEffect } from 'react'
import { Link, useParams , useNavigate } from 'react-router-dom';
import FrontHeader from '../../Frontend/FrontHeader';
import AdvisorInbox from '../../Components/AdvisorInbox';
import MyClients from '../../Components/MyClients';
import InboxClient from '../../Components/InboxClient';
import Notifications from '../../Components/Notifications';
import BookingCalendar from '../../Components/BookingCalendar'
import MyBooking from '../../Components/MyBooking';
import MyClientView from '../../Components/MyClientView';
import ProfileInformation from '../../Components/AdvisorProfile/ProfileInformation';
import PaymentInformation from '../../Components/PaymentInformation';
import MyReviews from '../../Components/MyReviews';
import MyServices from '../../Components/MyServices';
import Earning from '../../Components/Earning';
import MyChat from '../../Components/MyChat';
import MyClientBox from '../../Components/MyClientBox';
import NotificationsBox from '../../Components/NotificationsBox';
import MyReviewsBox from '../../Components/MyReviewsBox';
import axios from 'axios';
import {io} from 'socket.io-client';
import swal from 'sweetalert';
import jwtDecode from 'jwt-decode';
import ProgressBar from "@ramonak/react-progress-bar";
import "react-circular-progressbar/dist/styles.css";
import $ from 'jquery';
import { getAidFromStorageToken } from '../../Utils/storageHelper';
import { ActionButton } from '../../Components/Loading';

export default function AdDashboard() {
  const navigate = useNavigate();
  const needDominantBaselineFix = true;
  const params = new URLSearchParams(window.location.search);
  const setWaitingTimer = useState(false);
  const newParams = useParams();
  const yourParamName = params.get('tab');
  const advisor_id = getAidFromStorageToken();
  const [activeTab, setActiveTab] = useState((yourParamName > 0) ? parseInt(yourParamName) : 0);
  const [InboxActive, setInboxActive] = useState(true);
  const [chatActive] = useState(false);
  const [userStatus, setUserStatus] = useState('');
  const [suspended, setSuspended] = useState(false);
  const [showPopup, setshowPopup] = useState(false);    
  const [advisor, setAdvisor] = useState('');
  const [client, setClient] = useState('');
  const [noti_id, setnoti_id] = useState('');
  const [cl_name, setClName] = useState('');
  const [stripeActive,setStripeActive] = useState('');
  const [govtphoto,setGovtphoto] = useState('');
  const [ustaxnorms,setSUSTaxNorms] = useState('');
  const [certificate,setCertificate] = useState('');
  const [chatEngage, setChatEngage] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd_conf, setPwdConf] = useState('');
  const [pwd_curr_conf, setPwdCurrConf] = useState('');
  const [msg,setMsg] = useState('');
  const [errorType,setErrorType] = useState('');
  const [loadingStatusChange, setLoadingStatusChange] = useState(false);

  const updatePasswordChange = () => {
    const formData = {
        password: pwd,
        password_confirmation: pwd_conf,
        current_password: pwd_curr_conf,
    }

    if(pwd === '' || pwd_conf === '' || pwd_curr_conf === '') {
          swal("error", "Please do not leave blank any field", 'error');
    } else {
      axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-password`, formData, {
        headers: {
            'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
        },
    }).then(res => {
        if(res.data.success === true) {
            swal("success", "Password is updated successfully", "success");
        } else if(res.data.error) {
            swal("error", res.data.error.message, "error");
            setMsg(res.data.error.message);
            setErrorType('error');
        } else {
            setMsg("Something went wrong!");
            setErrorType('error');
        }
    }).catch(err => {
          setMsg("Something went wrong!");
          setErrorType('error');
    })
    }
  }

  const ClickOpenToChat = () => {
    setToggle(false);
    setActiveTab(1);
    setInboxActive(true);
  }

  const [checked, setChecked] = useState(0);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    localStorage.removeItem('EndTime');
    localStorage.removeItem('StartTime');
    localStorage.removeItem('offerExpire');
    localStorage.removeItem('FreeExpire');
    localStorage.removeItem('added');
    localStorage.removeItem('termiadded');
    localStorage.removeItem('timers');
    localStorage.removeItem('advisor_customrate');
    localStorage.removeItem('endChatTime');
    localStorage.removeItem('newtimers');
    localStorage.removeItem('advisor-end-chat');
    calCulateProfile();

    axios.get(`${process.env.REACT_APP_BASE_URL}/advisor/auth/profile`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
      },
    }).then(result => {
        if (result.data.success === true) {
          setCertificate(result.data.data.certificate);
          setSUSTaxNorms(result.data.data.us_tax_norms);
          setGovtphoto(result.data.data.gov_photo_id_front);
          setStripeActive(result.data.data.stripe_customer_id);
          if(result.data.data.suspended === 1) {
            setSuspended(true);
          }
          if(result.data.data.chat_engage === 0) {
            localStorage.removeItem('timers');
          } else {
            localStorage.setItem('advisor_to_chat', true);
            localStorage.setItem('advisor_customrate', true);
            setChatEngage(result.data.data.chat_engage);
          }
        setShowStatus(true);
        setUserStatus(result.data.data.approved);
        setChecked(result.data.data.chat_status);
        localStorage.setItem('stripe_customer_id',result.data.data.stripe_customer_id);
      }
    })
  },[]);

  function calCulateProfile() {
     var count = 0;
     var a = stripeActive === '' ? 0 : count++;
     var b = govtphoto === '' ? 0 : count++;
     var c = ustaxnorms === '' ? 0 : count++;
     var d = certificate === '' ? 0 : count++;

     if(count === 1) {
       count = 25;
     } else if(count === 2) {
       count = 50; 
     } else if(count === 3) {
        count = 75;
     } else if(count === 4) {
        count = 100;
     } else {
        count = 20;
     }
     return count;
  }

  useEffect(() => {
    const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
    const adv = getAidFromStorageToken();
    // when advisor receive this socket action from client

    // socket.on('CLIENT-CHAT-HANGUP-NOTIFYBACK', ({ advisor })  => {
    //   if(advisor === adv.id) {
    //       setshowPopup(false);
    //       swal('error', "Hello! Client Hangup the chat.","error");
    //       localStorage.removeItem('timers');
    //       setTimeout(() => {
    //         navigate(`/advisor/dashboard?tab=1`);
    //       },1000);
    //   }
    // });

    socket.on('NOTIFICATION-SEND-ADVISOR-RECIEPT', ({ advisor , client , startTime, endTime })  => {
        if(advisor === adv.id) {
           localStorage.setItem('StartTime', startTime);
           localStorage.setItem('EndTime', endTime);
        }
    });

    socket.on('CLIENT-END-CHAT-NOTIFY', ({ advisor  , client })  => {
      if(advisor === adv.id) {       
        localStorage.removeItem('timers');
        localStorage.removeItem('chatstarted');
        setChatEngage('');
        swal({
          title: "Notification chat ended",
          text: "Click on receipt button to view receipt of chat",
          buttons: {
            cancel: true,
            confirm: "Receipt"
          }
        }).then((value) => {
          if (value) {
                const id = getAidFromStorageToken();
                if(!localStorage.getItem('StartTime')) {
                  axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${id.id}`).then(result => {
                    localStorage.setItem('advisorRate', result.data.data.advisor_rate);
                    localStorage.setItem('StartTime', result.data.data.start_time);
                    localStorage.setItem('EndTime', result.data.data.end_time);
                  });      
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
                    window.location.href = '/receipt';
                })
              });  
          }
        });
      }
    });
    socket.on('ADVISOR-ONLINE-OFFLINE-NOTIFYBACK', ({ advisor , status }) => {
      const adv = getAidFromStorageToken();
      if(adv.id == advisor) {
        setChecked(status);
      }
    });  
    return () => {
      // socket.off('CLIENT-CHAT-HANGUP-NOTIFYBACK');
      socket.off('CLIENT-END-CHAT-NOTIFY');
      socket.off('NOTIFICATION-SEND-ADVISOR-RECIEPT');
    }
  },[]);

  useEffect(() => {
    newParams.id === 'active' && setActiveTab(10);
    newParams.id === 'chat' && setActiveTab(3);

    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisor/${advisor_id.id}`, {
      headers: {
          'Content-Type': 'application/json',
      },
    }).then(result => {
        let rpm = result.data.disconted_rate === 0 ?  result.data.data.rate_per_min : result.data.disconted_rate;
        if(!localStorage.getItem('continueChat')) {
          localStorage.setItem('advisorRate', rpm);   
        }
    });
    
  }, [newParams.id]);

  

  const handleChange = async (event) => {
    setLoadingStatusChange(true);
    const data = {
      "chat_status": parseInt(event.target.value)
    }

    await axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-status`, data, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
      },
    }).then(result => {
        const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
        const adv = getAidFromStorageToken();
        setChecked(1 - checked);
        socket.emit('ADVISOR-ONLINE-OFFLINE', ({advisor:adv.id , status: parseInt(event.target.value)}));
    }).catch(err => {
      console.log(err);
    })
    setLoadingStatusChange(false);
  };

  const setTabbingActive = (tab) => {
    setActiveTab(tab);
    setToggle(false);
  }

  const [toggle, setToggle] = useState(false);

   const ChatAccepted = (id,cid,noti_id) => {
        localStorage.setItem('aid', id);
        localStorage.setItem('cid', cid);
        localStorage.setItem('notif_id', noti_id);
        localStorage.setItem('continueChat',true);
        $("#pausesound").trigger('click');
        axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/get-client-online-status/${cid}`, {
          headers: {
              'Content-Type': 'application/json',
          },
        }).then(result => {

          if(result.data.online_status === 1) {

                  const data = {
                    "client_id": cid,
                    "advisor_id": id
                }
                const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
                socket.emit('CHAT-INITIATE', ({ room: localStorage.getItem('username'), user1: id , user2:cid }));
                const data_update = {
                    "chat_engage": 1
                }
                axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-engage-status`, data_update , {
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer `+localStorage.getItem('advisorToken')
                    },  
                }).then(result => { 
                    const data_update_chat = {
                      "client_id": cid,
                      "chat_status" :1
                    }
                    
                    axios.put(`${process.env.REACT_APP_BASE_URL}/client/update-chat-status`, data_update_chat ).then(result => {
                      
                    });

                    axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/add-clients-advisors`, data).then(result2 => {
                        window.location.href = `/chatroom/${id}/service/${localStorage.getItem('username')}`;  
                    }).then(resul => {
                            const datadelete = {
                              from: localStorage.getItem('cid'),
                              to: localStorage.getItem('aid')
                            }
                            axios.delete(`${process.env.REACT_APP_BASE_URL}/chat/deletemsg`, {
                              datadelete
                            }).then(resultres => { });
                    })
                })
                return () => {
                    socket.off('CHAT-INITIATE');
                }
            } else {
                axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/notification/delete/${noti_id}`).then(result => {
                  // swal('error', "Hello!, Client is offline now","error");
                });
                // swal('error', "Hello!, Client is offline now","error");
            }
        });

    }

    const chatRejected = (noti_id) => {
        localStorage.removeItem('notif_id');
        localStorage.removeItem('continueChat');
        const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
        socket.emit('CLIENT-CHAT-REJECTED', ({ advisor : advisor_id.id }));
        $("#pausesound").trigger('click');
        axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/notification/delete/${noti_id}`).then(result => {
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
                    swal('success', 'Request is rejected successfully', 'success');
                    window.location.reload();
                },1000);
            })
        })
        return () => {
            socket.off('CLIENT-CHAT-REJECTED');
        }
    }

  const ContinueChat = () => {
    window.location.href = `/chatroom/${localStorage.getItem('aid')}/service/${localStorage.getItem('username')}`; 
  }

  useEffect(() => {
    if(localStorage.getItem('notif_id') && !localStorage.getItem('continueChat')) {
      var i = setInterval(function() { 
        const advisor_id = getAidFromStorageToken();
        axios.get(`${process.env.REACT_APP_BASE_URL}/advisor/auth/getnotification/${advisor_id.id}` , {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer `+localStorage.getItem('advisorToken')
            },  
        }).then(result => {
            if(result.data.data.length > 0) {
              // remove message audio alert 
              $("#playsound").trigger('click');
              setshowPopup(true);
              setAdvisor(advisor_id.id);
              setClient(localStorage.getItem('cid'));
              setnoti_id(localStorage.getItem('notif_id'));
              setClName(localStorage.getItem('clientName'));
              localStorage.getItem('minChatMinutes');
              clearInterval(i);
            }
        }).catch(err => {
            console.log(err);
        })
      }, 200);
    }
  },[]); 

    var a = document.getElementById("idAudio");
		function playaudio() {
			// a.play();
		}
		function stopaudio() {
			a.pause();
			a.currentTime = 0;
		}

  return (
    <div>
      <FrontHeader />
      <>
       <div className='userdashboard'>
        <div className='container'>
          <div className='row pt-5'>
            <div className='col-12 col-lg-12 mb-3'>
              <div className='bg-white rounded custom-shadow desktopsidebar' style={{ height: '100%' }}>
                <audio id = "idAudio">
                  <source src = "../assets/images/incoming_call.mp3" type = "audio/ogg" />
                  <source src = "../assets/images/incoming_call.mp3" type ="audio/mpeg" />
                </audio>
                <button type="button" id="playsound" onClick={playaudio} style={{ display: 'none' }}>Play</button>
                <button type="button" id="pausesound" onClick={stopaudio} style={{ display: 'none' }}>Pause</button>
                <nav className="nav pt-4 pb-4 px-4">
                  <li>
                    <Link onClick={() => setActiveTab(0)} className={`nav-link position-relative fsp-16 px-3 py-2.5 ${activeTab === 0 ? 'active' : ''}`} to="#">
                      Dashboard
                      <span className='position-absolute'></span>
                    </Link>
                  </li>

                  <li>
                    <Link onClick={ClickOpenToChat} className={`nav-link position-relative fsp-16 ${activeTab === 1 ? 'active' : ''}`} to="#">
                      Inbox
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setActiveTab(3)} className={`nav-link position-relative fsp-16 ${activeTab === 3 ? 'active' : ''}`} to="#">
                      Notifications
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setActiveTab(4)} className={`nav-link position-relative fsp-16 ${activeTab === 4 ? 'active' : ''}`} to="#">
                      Booking Calendar
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setActiveTab(8)} className={`nav-link position-relative fsp-16 ${activeTab === 8 ? 'active' : ''}`} to="#">
                      My Listing
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setActiveTab(2)} className={`nav-link position-relative fsp-16 ${activeTab === 2 ? 'active' : ''}`} to="#">
                      My Clients
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setActiveTab(6)} className={`nav-link position-relative fsp-16 ${activeTab === 6 ? 'active' : ''}`} to="#">
                      Payment Information
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setActiveTab(9)} className={`nav-link position-relative fsp-16 ${activeTab === 9 ? 'active' : ''}`} to="#">
                      Earnings
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setActiveTab(7)} className={`nav-link position-relative fsp-16 ${activeTab === 7 ? 'active' : ''}`} to="#">
                      My Reviews
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  {
                     !suspended && 

                     <li>
                      <Link onClick={() => setActiveTab(10)} className={`nav-link position-relative fsp-16 ${newParams.id} ${activeTab === 10 ? 'active' : ''}`} to="#">
                        My Chat History
                        <span className='position-absolute'></span>
                      </Link>
                    </li>
                  }

                  <li>
                    <Link onClick={() => setActiveTab(5)} className={`nav-link position-relative fsp-16 ${activeTab === 5 ? 'active' : ''}`} to="#">
                      Contact Information
                      <span className='position-absolute'></span>
                    </Link>
                  </li>

                  <li>
                    <Link onClick={() => setActiveTab(11)} className={`nav-link position-relative fsp-16 ${activeTab === 11 ? 'active' : ''}`} to="#">
                      Change Password
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  
                  {
                    chatEngage && 
                        <li>
                            <button className="btn btn-purple bold-button px-5 py-2 ffp_chatbox rounded-5 fsp-15" 
                                type='button' 
                                title="Continue Chat"
                                onClick={ContinueChat} >
                              Continue Chat
                            </button>
                        </li>
                  }
        
                </nav>
              </div>

              <div className='mobilesidebar'>
                <span onClick={() => setToggle(!toggle)}>&#9776;</span>
                {chatEngage && 
                  <div>
                      <button className="btn btn-purple bold-button px-3 py-1 mt-2 ffp_chatbox rounded-5 fsp-15" 
                          type='button' 
                          title="Continue Chat"
                          onClick={ContinueChat} >
                        Continue Chat
                      </button>
                  </div>}
              </div>
            </div>
            <div className='col-12 col-lg-12'>
              <div className='bg-white rounded dashboard-nav custom-shadow' style={{ height: '100%' }}>

                <div className={activeTab === 0 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full '>
                    <span className='text-pink fsp-22 font-bold'>Dashboard</span>

                    
                      <div className='row mt-3'>
                        <div className='col-6 col-lg-3'>
                          <AdvisorInbox />
                        </div>
                        <div className='col-6 col-lg-3'>
                          <MyClientBox />
                        </div>
                        <div className='col-6 col-lg-3'>
                          <NotificationsBox />
                        </div>
                        <div className='col-6 col-lg-3'>
                          <MyReviewsBox />
                        </div>
                        <div className='col-12 mb-2 col-lg-6'>
                          <div className="mb-2 border-solid border-grey-light rounded border shadow-sm panelgroup">
                            <div className=" bg-gray-100 panelheading px-3 py-2 border-solid border-grey-light border-b text-black font-semibold text-base">
                              Complete your profile to start earning
                            </div>
                            <div className="p-3 panelbody">
                            <div className='row'>
                              <div className='col-12 col-lg-12'>
                                <div className='Progressbar'>
                                  <div className="w-full bg-gray-200 rounded-full">
                                    {
                                      showStatus && <ProgressBar completed={calCulateProfile()} bgColor = "#b07" />
                                    }
                                  </div>
                                </div>
                              </div>
                              <div className='col-12 col-lg-12'>
                                <div className='pending-things'>
                                  <>
                                  { showStatus && calCulateProfile() !== 100 && <h5 className='text-black text-lg font-semibold'>Pending things are:</h5> }
                                  <ul className="max-w-md space-y-1 text-gray-500 list-none list-inside dark:text-gray-400">
                                    <li>
                                    { showStatus && stripeActive === '' && <h2><a href="/advisor/dashboard?tab=6"><i className="bi bi-check"></i><span>Stripe Payment Setup</span></a></h2> }
                                    </li>
                                    <li>
                                    {  showStatus && ustaxnorms === '' && <h2><a href="/advisor/dashboard?tab=8"><i className="bi bi-check"></i><span>US tax forms, either W-8BEN as an international or W9 as a US citizen</span></a></h2> }
                                    </li>
                                    <li>
                                    { showStatus && certificate === '' && <h2><a href="/advisor/dashboard?tab=8"><i className="bi bi-check"></i><span>Certificate (If needed)</span></a></h2> }
                                    </li>
                                    <li>
                                    { showStatus && govtphoto === '' && <h2><a href="/advisor/dashboard?tab=8"><i className="bi bi-check"></i><span>Government Photo ID</span></a></h2>  }
                                    </li>
                                </ul>
                                  </>
                                </div>
                              </div>
                            </div>
                            </div>
                          </div>

                        </div>
                           <div className='col-12 mb-2 col-lg-6'>
                            <div className="mb-2 border-solid border-grey-light rounded border shadow-sm panelgroup">
                              <div className=" bg-gray-100 panelheading px-3 py-2 border-solid border-grey-light border-b text-black font-semibold text-base">
                                My Availability  { userStatus === 0 && 
                                    <>
                                       <h6 className='text-purple' style={{ "font-size": "14px" }}>
                                          This service is locked until your account is complete and approved by the admin
                                       </h6>
                                    </>
                                }
                              </div>
                              {
                                showStatus && 
                                <>
                                      <div className="p-3 panelbody">
                                        <div className='myavailability'>
                                            <span>Chat:</span>
                                            <ActionButton loading={loadingStatusChange}>
                                            <div className="switches-container">
                                              { checked === 0 ?
                                                <>
                                                  <input type="radio" className='notAvailable' id="switchOffline" onChange={handleChange} name="switchPlan" value="0"  gg = {checked} checked = "checked"  /> 
                                                  <input type="radio" className='Available' id="switchTakingchat" onChange={handleChange} name="switchPlan"  gg = {checked} value="1"  />
                                                </>
                                                :
                                                <>  
                                                  <input type="radio" className='notAvailable' id="switchOffline" onChange={handleChange} name="switchPlan"  gg = {checked} value="0" /> 
                                                  <input type="radio" className='Available' id="switchTakingchat" onChange={handleChange} name="switchPlan"  gg = {checked} value="1" checked = "checked" />
                                                </>
                                              }

                                                  <label htmlFor="switchOffline">OFFLINE</label>
                                                  <label htmlFor="switchTakingchat">TAKING CHAT</label>
                                                    <div className="switch-wrapper">
                                                      <div className="switch">
                                                        <div className='absent'>OFFLINE</div>
                                                        <div>TAKING CHAT</div>
                                                      </div>
                                                    </div>
                                            </div>
                                            </ActionButton>
                                        </div>
                                        </div>
                                      
                                </>
                              }
                               
                               </div>
                                
                            </div>

                            {/* <div className='col-12 mb-2 col-lg-6'>
                              <div className="mb-2 border-solid border-grey-light rounded border shadow-sm panelgroup">                              
                                {
                                  chatEngage && 

                                    <>
                                      <div className="p-3 panelbody">
                                        <div className='myavailability'>
                                            <button className="btn btn-purple bold-button mt-4 px-5 py-2 ffp_chatbox rounded-5 fsp-15" 
                                                type='button' 
                                                title="Continue Chat"
                                                onClick={ContinueChat} >
                                              Continue Chat
                                            </button>
                                          </div>
                                        </div>
                                    </>
                                  }
                               
                               </div>
                                
                            </div> */}
                      
                      </div>
                                         
                    
                    {InboxActive &&
                      <>
                      <div className='row'>
                          <div className='col-lg-6 col-12'>
                            <span className='text-black fsp-20 font-semibold mb-3 d-block'>Recently Clients</span>
                        </div>
                        
                        <MyClients />
                        </div>
                      </>
                    }
                    {chatActive &&
                      <MyClientView />
                    }
                  </div>
                </div>
                <div className={activeTab === 1 ? 'd-block' : 'd-none'}>
                  {InboxActive && <InboxClient />}
                </div>

                <div className={activeTab === 2 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                  <div className='row'>
                    <MyClients />
                    </div>
                  </div>
                </div>
                <div className={activeTab === 3 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    <Notifications action = {setWaitingTimer}/>
                  </div>
                </div>
                <div className={activeTab === 4 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    <span className='text-pink fsp-22 font-bold mb-3 d-block'>Booking Calendar</span>
                    <div className='row'>
                      <div className='col-12 col-lg-8'>
                        <BookingCalendar />
                      </div>
                      <div className='col-12 col-lg-4'>
                        <MyBooking />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={activeTab === 5 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    <ProfileInformation />
                  </div>
                </div>
                <div className={activeTab === 6 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    <PaymentInformation />
                  </div>
                </div>
                <div className={activeTab === 7 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    <span className='text-pink fsp-22 font-bold mb-3 d-block'>My Reviews</span>
                    <MyReviews />
                  </div>
                </div>
                <div className={activeTab === 8 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    <span className='text-pink fsp-22 font-bold mb-3 d-block'>My Listing</span>
                    <MyServices />
                  </div>
                </div>
                <div className={activeTab === 9 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    <Earning />
                  </div>
                </div>
                <div className={activeTab === 10 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    <MyChat />
                  </div>
                </div>
                <div className={activeTab === 11 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                  <span className='text-pink fsp-22 font-bold mb-2 block'>Change Password</span>
                      <div id="Change-Password">
                          <div className="row mb-3">
                              <label htmlFor="inputname" className="col-sm-12 label-text col-form-label text-left text-black font-medium">Current Password <span className='text-red text-base absolute -top-0'>*</span></label>
                              <div className="col-sm-12">
                                  <input type="password" className="form-control" name='cpassword' onChange={(e) => setPwdCurrConf(e.target.value)} />
                              </div>
                          </div>
                          <div className="row mb-3">
                              <label htmlFor="inputname" className="col-sm-12 label-text col-form-label text-left text-black font-medium">New Password <span className='text-red text-base absolute -top-0'>*</span></label>
                              <div className="col-sm-12">
                                  <input type="password" onChange={(e) => setPwd(e.target.value)} className="form-control" name='npassword' />
                              </div>
                          </div>
                          <div className="row mb-3">
                              <label htmlFor="inputname" className="col-sm-12 label-text col-form-label text-left text-black font-medium">Confirm Password <span className='text-red text-base absolute -top-0'>*</span></label>
                              <div className="col-sm-12">
                                  <input type="password" className="form-control" onChange={(e) => setPwdConf(e.target.value)} name='cnpassword' />
                              </div>
                          </div>
                          <div className='text-right'><button type="button" onClick={updatePasswordChange} className="px-4 px-md-4 py-1.5 btn btn-light rounded-1 mt-2 mb-2 ffp fsp-17">Update Password</button></div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='col-12 col-lg-12 mt-3 mb-5'>
            <div className='bg-white rounded custom-shadow dashboardfooter pt-4 pb-4 px-4' style={{ height: '100%' }}>
                <ul className="flex flex-col md:flex-row items-center justify-center">
                  <li className="my-2"><Link to='/pages/advisor-terms-and-conditions' className="text-decoration-none text-black fsp-15">Advisor terms and conditions </Link></li>
                  <li className="my-2"><Link to='/privacypolicy' className="text-decoration-none text-black fsp-15">Privacy Policy</Link></li>
                  <li className="my-2"><Link to='/contact' className="text-decoration-none text-black fsp-15">Contact us</Link></li>
              </ul>
            </div>
            </div>
            
          </div>
          {toggle && (
            <div id="mySidenav" className="sidenav">
              <div className='sidebartitle'><h4></h4>
                <a href="#?" className="closebtn" onClick={() => setToggle(!toggle)}><i className="bi bi-x-lg"></i></a></div>
              <div className='bg-white rounded' style={{ height: '100%' }}>

                <nav className="nav pt-4 pb-4 px-4 adtab">
                  <li>
                    <Link onClick={() => setTabbingActive(0)} className={`nav-link position-relative fsp-16 px-3 py-2.5 ${activeTab === 0 ? 'active' : ''}`} to="#">
                      Dashboard
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={ClickOpenToChat} className={`nav-link position-relative fsp-16 ${activeTab === 1 ? 'active' : ''}`} to="#">
                      Inbox
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(3)} className={`nav-link position-relative fsp-16 ${activeTab === 3 ? 'active' : ''}`} to="#">
                      Notifications
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(4)} className={`nav-link position-relative fsp-16 ${activeTab === 4 ? 'active' : ''}`} to="#">
                      Booking Calendar
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(8)} className={`nav-link position-relative fsp-16 ${activeTab === 8 ? 'active' : ''}`} to="#">
                      My Listing
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(6)} className={`nav-link position-relative fsp-16 ${activeTab === 6 ? 'active' : ''}`} to="#">
                      Payment Information
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(9)} className={`nav-link position-relative fsp-16 ${activeTab === 9 ? 'active' : ''}`} to="#">
                      Earnings
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(7)} className={`nav-link position-relative fsp-16 ${activeTab === 7 ? 'active' : ''}`} to="#">
                      My Reviews
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(10)} className={`nav-link position-relative fsp-16 ${newParams.id}  ${activeTab === 10 ? 'active' : ''}`} to="#">
                      My Chat History
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(2)} className={`nav-link position-relative fsp-16 ${activeTab === 2 ? 'active' : ''}`} to="#">
                      My Clients
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(5)} className={`nav-link position-relative fsp-16 ${activeTab === 5 ? 'active' : ''}`} to="#">
                      Contact Information
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(11)} className={`nav-link position-relative fsp-16 ${activeTab === 11 ? 'active' : ''}`} to="#">
                      Change Password
                      <span className='position-absolute'></span>
                    </Link>
                  </li>

                </nav>
              </div>
            </div>
          )}
          
        </div>
        </div>
        {/* </div><br /> */}


        { showPopup === true && 

          <div className="modal"  style={{ "display": "block" }} id="notificationPopup">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-body">
                    <div className='Notification'>
                      <div className='text-center p-3'>
                          <img src='/assets/images/frontend/check.png' alt='right' className='inline-block' />
                      </div>
                    <div className='Notification text-gray-800 text-3xl mb-2 font-semibold text-center'>Chat Notification Alert?</div>
                    <div className=' text-gray-400 text-base text-center'>{cl_name} want to connect with you</div>
                    <div className="text-right pt-2">
                      <button type="button" onClick={() => ChatAccepted(advisor,client , noti_id)} className="px-4 px-md-4 py-1.5 btn btn-primary rounded-1 mt-3 mb-2 ffp fsp-12 mr-2">Accept</button>
                      <button type="button"  onClick={() => chatRejected(noti_id)}  className="px-4 px-md-4 py-1.5 btn btn-light rounded-1 mt-2 ffp fsp-17">Reject</button>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        }  

      </>
    </div>
  )
}
