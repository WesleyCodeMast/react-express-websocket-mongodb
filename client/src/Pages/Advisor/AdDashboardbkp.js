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

export default function AdDashboard() {
  const navigate = useNavigate();
  // Can use browser detection logic here to determine this instead
  const needDominantBaselineFix = true;

  const params = new URLSearchParams(window.location.search);
  const setWaitingTimer = useState(false);
  const newParams = useParams();
  const yourParamName = params.get('tab');
  const advisor_id = getAidFromStorageToken();
  const [activeTab, setActiveTab] = useState((yourParamName > 0) ? parseInt(yourParamName) : 0);
  // const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);

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

  function startPlay() {
    let audio = new Audio('../assets/images/iphone_sound.mp3');
    return audio.play();
  }

  const handleSound = () => {
    setTimeout(() => {
      alert("press play");
      let audio = new Audio('../assets/images/iphone_sound.mp3');
      return audio.play();
    },1000);
  }

  useEffect(() => {
    const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
    socket.on('NOTIFICATION-SEND-TO-ADVISOR', ({ advisor , client , noti_id, cl_name,minChat }) => {
      if(advisor === advisor_id.id) {
        setshowPopup(true);
        setAdvisor(advisor);
        setClient(client);
        setnoti_id(noti_id);
        setClName(cl_name);
        localStorage.setItem('cid',client);
        localStorage.setItem('notif_id', noti_id);
        localStorage.setItem('clientName',cl_name);
        startPlay();
        localStorage.setItem('minChatMinutes', minChat);
      }
    });

    socket.on('CLIENT-CHAT-HANGUP-NOTIFYBACK', ({ advisor })  => {
      if(advisor === advisor_id.id) {
          setshowPopup(false);
          swal('error', "Hello! Client Hangup the chat.","error");
          localStorage.removeItem('timers');
          setTimeout(() => {
            navigate(`/advisor/dashboard?tab=1`);
          },1000);
      }
    });

        return () => {
          socket.off('NOTIFICATION-SEND-TO-ADVISOR');
          socket.off('CLIENT-CHAT-HANGUP-NOTIFYBACK');
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
        localStorage.setItem('advisorRate', rpm);   
    });
    
  }, [newParams.id]);

  const handleChange = (event) => {
        
    const data = {
      "chat_status": parseInt(event.target.value)
    }

    axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-status`, data, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
      },
    }).then(result => {
    }).catch(err => {
      console.log(err);
    })
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
                    axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/add-clients-advisors`, data).then(result2 => {
                        navigate(`/chatroom/${id}/service/${localStorage.getItem('username')}`);  
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
                  swal('error', "Hello!, Client is offline now","error");
                });
                swal('error', "Hello!, Client is offline now","error");
            }
        });

    }

    const chatRejected = (noti_id) => {
        localStorage.removeItem('notif_id');
        localStorage.removeItem('continueChat');
        const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
        socket.emit('CLIENT-CHAT-REJECTED', ({ advisor : advisor_id.id }));
        
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
      navigate(`/chatroom/${localStorage.getItem('aid')}/service/${localStorage.getItem('username')}`); 
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
              setshowPopup(true);
              setAdvisor(advisor_id.id);
              setClient(localStorage.getItem('cid'));
              setnoti_id(localStorage.getItem('notif_id'));
              setClName(localStorage.getItem('clientName'));
              localStorage.getItem('minChatMinutes');
              $("#btn_play").trigger('click');
              clearInterval(i);
            }
        }).catch(err => {
            console.log(err);
        })
      }, 200);
    }

  },[]); 

  return (
    <div>
      <FrontHeader />
      <>
       <div className='userdashboard'>
        <div className='container'>

          <div className='row pt-5'>
            <div className='col-12 col-lg-12 mb-3'>
              <div className='bg-white rounded custom-shadow desktopsidebar' style={{ height: '100%' }}>

                <nav className="nav pt-4 pb-4 px-4 adtab">

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
                      My Review
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
                  
                                  {
                                    chatEngage && 
                                        <li>
                                            <button className="btn btn-purple bold-button mt-4 px-5 py-2 ffp_chatbox rounded-5 fsp-15" 
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
                <span onClick={() => setToggle(!toggle)}>&#9776; Sidebar</span>
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
                              Complete your Profile to start Earning
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
                                            <div className="switches-container">
                                              { checked === 0 ?
                                                <>
                                                  <input type="radio" id="switchOffline" onChange={handleChange} name="switchPlan" value="0"  gg = {checked} checked = "checked"  /> 
                                                  <input type="radio" id="switchTakingchat" onChange={handleChange} name="switchPlan"  gg = {checked} value="1"  />
                                                </>
                                                :
                                                <>
                                                  <input type="radio" id="switchOffline" onChange={handleChange} name="switchPlan"  gg = {checked} value="0" /> 
                                                  <input type="radio" id="switchTakingchat" onChange={handleChange} name="switchPlan"  gg = {checked} value="1" checked = "checked" />
                                                </>
                                              }

                                                  <label htmlFor="switchOffline">OFFLINE</label>
                                                  <label htmlFor="switchTakingchat">TAKING CHAT</label>
                                                    <div className="switch-wrapper">
                                                      <div className="switch">
                                                        <div>OFFLINE</div>
                                                        <div>TAKING CHAT</div>
                                                      </div>
                                                    </div>
                                            </div>
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
                  <div className='col-lg-6 col-12'>
                    <span className='text-pink fsp-22 font-bold mb-3 d-block'>My Clients</span>
                    </div>
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


              </div>
            </div>
          </div>
          {toggle && (
            <div id="mySidenav" className="sidenav">
              <div className='sidebartitle'><h4>Sidebar</h4>
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
                      My Review
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
                      <button type="button" id="btn_play" onClick={handleSound}>button</button>
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
