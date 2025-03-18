/**
 * Client Dashboard page... 
 * author: Maksym
 * modifiedAt:09/18/2023
 */
import React, { useState, useEffect } from 'react'
import { Link, useParams ,useNavigate } from 'react-router-dom';
import FrontHeader from '../../Frontend/FrontHeader';
import Notifications from '../../Components/Notifications';
import InboxAdvisor from '../../Components/InboxAdvisor';
import MyAdvisor from '../../Components/MyAdvisor';
import MyAdvisorView from '../../Components/MyAdvisorView';
import ProfileInformation from '../../Components/CustomerProfile/ProfileInformation';
import MyChat from '../../Components/MyChat';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import swal from 'sweetalert';
import { io } from 'socket.io-client';
import ReactPaginate from 'react-paginate';
import Modal from 'react-modal';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction"; 
import TransactionHistory from '../../Components/TransactionHistory';
import moment from 'moment';
import AlertforAll from '../../Components/Chat/AlertforAll';
import $ from 'jquery';
import { ActionButton, ComponentLoading, Loading } from '../../Components/Loading';

const customStyles = {
  content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -40%)',
  },
};

Modal.setAppElement('#root');

export default function ClDashboard() {
  const [accountCreatedBy,setAccountCreatededBy] = useState('');
  const [chatEngage, setChatEngage] = useState(false);
  const [calendersBooking,setCalendersBooking] = useState([]);
  const [msg,setMsg] = useState('');
  const [errorType,setErrorType] = useState('');
  const navigate = useNavigate();
  const newParams = useParams();
  const [sortRate, setSortRate] = useState('');
  const [filerCategory, setFilerCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [filterSearch, setFilterSearch] = useState('');
  const params = new URLSearchParams(window.location.search);
  const yourParamName = params.get('tab');
  const [activeTab, setActiveTab] = useState((yourParamName > 0) ? parseInt(yourParamName) : 0);
  const [chatActive, setChatActive] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [noOfMinutes, setNoOfMinutes] = useState(0);
  const [InboxActive, setInboxActive] = useState(true);
  // roomId
  const [chatId, setChatId] = useState(0);
  const [pwd, setPwd] = useState();
  const [pwd_conf, setPwdConf] = useState('');
  const [pwd_curr_conf, setPwdCurrConf] = useState('');
  const [MyadvisorList, setMyAdvisorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const updatePassword = () => {
    const formData = {
        password: pwd,
        password_confirmation: pwd_conf,
        current_password: pwd_curr_conf,
        accountCreatedBy:accountCreatedBy
    }

    axios.post(`${process.env.REACT_APP_BASE_URL}/client/auth/update-password`, formData, {
        headers: {
            'Authorization': `Bearer ` + localStorage.getItem('clientToken')
        },
    }).then(res => {
        if (res.data.success === true) {
            setMsg("Password has been updated successfully.");
            setErrorType('success');  
            setTimeout(() => {
              window.location.href = `/client/dashboard?tab=8`;
          },1000); 
        } else if (res.data.error) {
            swal("error", res.data.error.message, "error");
        }
    });
}

  let subtitle;
  const [modalIsOpen, setIsOpen] = useState(false);

  const [slots, setSlots] = useState([]);
  const [bookingAdvId, setBookingAdvId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState();
  const [selectedDay, setSelectedDay] = useState();
  const [checkedState, setCheckedState] = useState(
      new Array(slots?.length).fill(false)
  );

  function afterOpenModal() {
    debugger;
      // subtitle.style.color = '#f00';
  }

  function closeModal() {
    setBookingAdvId();
    setIsOpen(false);
  }

  useEffect(() => {

    if(localStorage.getItem('advisorFavlist')) {
      swal('success','Advisor has been added successfully in your My Advisor List.', 'success');
      localStorage.removeItem('advisorFavlist');
    }

    const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
    var decoded = jwt_decode(localStorage.getItem('clientToken'));
    socket.on('CHAT-CONNECTED', ({ room , user1 , user2 }) => {
       if(user1 === localStorage.getItem('aid') && (user2 === localStorage.getItem('cid'))) {
         navigate(`/chatroom/${decoded.id}/client/${room}`);
         localStorage.setItem('chatstarted',true);
       }
    });
    socket.on('CLIENT-CHAT-REJECTED-NOTIFYBACK', ({ advisor }) => {
      if(advisor === localStorage.getItem('aid')) {
        swal('Hello', "Advisor is busy! Please book time slot to connect with advisor.","error");
        localStorage.removeItem('timers');
        //setchatRequest(false);
      }
    });

    socket.on('TERMINATE-CHAT-RECEIPT', ({ advisor , client , room }) => {
      if(client === localStorage.getItem('cid')) {
        localStorage.removeItem('WAIT_TIME');
        localStorage.removeItem('chatstarted');
        localStorage.removeItem('timers');
        setChatEngage(false);
      }
    });

    return () => {
      socket.off('CHAT-CONNECTED');
      socket.off('CLIENT-CHAT-REJECTED-NOTIFYBACK');
      socket.off('TERMINATE-CHAT-RECEIPT');
    }
  },[]);

  useEffect(() => {
      var cdecoded = jwt_decode(localStorage.getItem('clientToken'));
      const data_update = {
          "client_id": cdecoded.id,
          "online_status": 1
      }
      axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/update-client-online-status`, data_update , {
          headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
          },  
      }).then(result14 => { 
        
      })
  },[]);

  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    setLoading(true);
    var cdecoded = jwt_decode(localStorage.getItem('clientToken'));
    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/getBookings/${cdecoded.id}`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
    }).then(result => {
      if(result.data.data.length > 0) {
        setBookings(result.data.data);
      }

    }).catch(error => {

    })
    setLoading(false);
  },[]);

  const [daySelected,setDaySelected] = useState('');

  const handleDateClick = (res,act) => {
        if(act == 'event') {
          var check = moment(res.event.start).format("YYYY-MM-DD");
        } else {
          var check = res.dateStr;
        }

        $(".activeHighlight").removeClass('activeHighlight');
        $('[data-date='+check+']').addClass('activeHighlight');
        setDaySelected(moment(check).format("dddd"));
        var today = moment().format('YYYY-MM-DD');
        var dayAfter = moment().add(1, 'days').calendar('YYYY-MM-DD');
        if(check < today)  {
           swal('warning', "Booking could not be done for past date", "warning");                 
        } else if(moment(dayAfter).format('YYYY-MM-DD') === check) {
          swal('warning', "No Booking available on date "+check, "warning");  
        } else {                     
            setSelectedDay(check);
            axios.get(`${process.env.REACT_APP_BASE_URL}/client/calendar-availabilities/by-date/${check}?advisor_id=${bookingAdvId}`).then(result => {
                if (result.status === 200) {
                     if(result.data.data.length === 0 ) {   
                        setSlots([]); 
                        swal('warning', "No Booking available on date "+check, "warning");
                     } else {
                        setSlots(result.data.intervals);
                     }
                    setCheckedState(
                        new Array(result.data.intervals?.length).fill(false)
                    );
                } else {
                    setSlots([]);
                }
            }).catch(err => {
                //setSlots([]);
            });
        }
 }

 const handleOnChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) =>
        index === position ? !item : item
    );

    setCheckedState(updatedCheckedState);

    let totalSlots = [];
    updatedCheckedState.map((currentState, index) => {
        if (currentState === true) {
            totalSlots.push(slots[index]);
        }
    }

    );
    setSelectedSlot(totalSlots);
  };

const bookSlot = () => {

      const formData = {
          date: selectedDay,
          advisor_id: bookingAdvId,
          intervals: selectedSlot,
      }

      const amount = selectedSlot.length*15;

      const client = jwt_decode(localStorage.getItem('clientToken'));

      axios.post(`${process.env.REACT_APP_BASE_URL}/client/calendar-availabilities/book`, formData, 
          { headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ` + localStorage.getItem('clientToken')
          }}).then(result => {
          if (result.status === 200) {
              axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/client/${client.id}`).then(result => {
                  const IsProceed = parseFloat(localStorage.getItem('rpm_schedule') * localStorage.getItem('minchat_schedule')).toFixed(2);
                  const cbalance = parseFloat(result.data.data.result.wallet_balance);
                  if(cbalance >= IsProceed) {   
                          swal("success", "We have reserved your time for this booking and informed the advisors that you will be here.", "success");
                          setIsOpen(false);
                          window.location.href = `/client/dashboard?tab=9`;
                  } else {
                      swal("error", "Your Wallet Balance is low, redirecting to payment", "error");
                      setTimeout(() => {
                          window.location.href = `/client/stripe-checkout-schedule-chat/${amount}/${client.id}/${bookingAdvId}`;
                      },3000);
                  }
                });
          }
      }).catch(err => {
          console.log(err);
      })
  }

  const ClickOpenToChat = () => {
    setToggle(false);
    setActiveTab(1);
    setChatActive(false);
    setInboxActive(true);
  }

  const setTabbingActive = (tab) => {
    setActiveTab(tab);
    setToggle(false);
  }

  const [toggle, setToggle] = useState(false);
  const [advisorList, setAdvisorList] = useState([]);
  const [MyAdvisors,setMyAdvisors] = useState([]);

  useEffect(() => {
    localStorage.removeItem('chatrejected');
    localStorage.removeItem('newClientSingup');
    localStorage.removeItem('endChatTime');
    localStorage.removeItem('oid');
    localStorage.removeItem('client-end-chat');
    localStorage.removeItem('client_added');
    localStorage.removeItem('termiadded');
    debugger;
    setLoading(true);
    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisors?page=${page}&size=${limit}&filter_search=${filterSearch}&filer_category=${filerCategory}&sort_rate=${sortRate}`).then(result => {
            if (result.status === 200) {
                setAdvisorList(result.data.data);
                setpageCount(Math.ceil(parseInt(result.data.total) / parseInt(result.data.perPage)));
                setPage(result.data.page);
            } else {
                setAdvisorList([]);
            }
        }).catch(err => {
            console.log(err);
        });

        axios.get(`${process.env.REACT_APP_BASE_URL}/admin/categories`).then(result => {
            if (result.status === 200) {
                setCategories(result.data.data);
            }
        }).catch(err => {
            console.log(err);
        })
    setLoading(false);
    }, [filterSearch, filerCategory, sortRate]);

  function GetAdvisorList() {
    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisors?page=${page}&size=${limit}`).then(result => {
        if (result.status === 200) {
          if(result.data.data.chat_engage === 0) {
             localStorage.removeItem('timers');
          }
            setAdvisorList(result.data.data);
            setpageCount(Math.ceil(parseInt(result.data.total) / parseInt(result.data.perPage)));
            setPage(result.data.page);
        } else {
            setAdvisorList([]);
        }
    }).catch(err => {
        console.log(err);
    })
    
    if(localStorage.getItem('aid')) {
      axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisorStatus/${localStorage.getItem('aid')}`).then(result3 => {
        if(result3.data.data[0].chat_engage === 1) {
          localStorage.removeItem('timers');
          localStorage.setItem('advisor_to_chat', true);
          setChatEngage(true);
        } else {
          localStorage.removeItem('advisor_to_chat');
          setChatEngage(false);
        }
      });
    } else {
      localStorage.removeItem('advisor_to_chat');
    }
  }

  useEffect(() => {
    setLoading(true);
    const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
    socket.on('ADVISOR-ONLINE-OFFLINE-NOTIFYBACK', ({ advisor , status }) => {
      GetAdvisorList();
    });
    setLoading(false);
    return () => {
        socket.off('ADVISOR-ONLINE-OFFLINE-NOTIFYBACK');
    }
  },[]);

  /**
   * api when client click chat now button on Client Dashboard page... 
   * @param {*} id : advisor Id
   * @param {*} username : advisor Name
   * @param {*} rpm : rate per minutes
   * @param {*} drpm : disconted Rate( which deducted the cost from rate per minutes...)
   * @param {*} minChatMinutes : min Chat minutes
   */

  const HandleChatProceed = (id, username, rpm, drpm , minChatMinutes) => {
    setAcceptLoading(true);
    const clientToken = localStorage.getItem('clientToken');
    localStorage.setItem("clientTz", Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    if (clientToken) {
        var decoded = jwt_decode(clientToken);
        const data = {
            "advisor_id": id,
            "client_id": decoded.id
        }

        let ratePerMin = drpm === 0 ? rpm : drpm;
        const userNameClient = localStorage.getItem('newuserNameClient') ? localStorage.getItem('newuserNameClient') : decoded.username;

          axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisorStatus/${id}`).then(result3 => {
            // current advisor have engaged in meeting,,, so you cannot chat right now, please wait or schedule a chat....
            if(result3.data.data[0].chat_engage === 1) {
              setAcceptLoading(false);
                swal('Hello','Advisor is busy right now! you can wait or schedule chat', 'warning');
                setIsOpen(true);
                setBookingAdvId(params.id);
            } 
            // current advisor is available for meeting ,,, so connect socket and then 
            else {
              setChatId(id);
              // setchatRequest(true);
              var minChat = minChatMinutes === 0 ? 1 : minChatMinutes;
              var minChatAllowed = ratePerMin * minChat;
              debugger;
              if(noOfMinutes >= minChatAllowed) {
                const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
                axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/notification/add`, data).then(result => {
                    socket.emit('NOTIFICATION-SEND', ({advisor:id,client:decoded.id, noti_id:result.data.data._id, cl_name:userNameClient, minChat: minChat}));
                    setTimeout(() => {
                        localStorage.setItem('cid', decoded.id);
                        localStorage.setItem('aid', id);
                        localStorage.setItem('advisorRate', parseFloat(ratePerMin).toFixed(2));
                        localStorage.setItem('username', username);
                        localStorage.setItem('notif_id', result.data.data._id);
                        localStorage.setItem('minChatMinutes', minChatMinutes);
                        navigate(`/connecting`);
                    }, 1000);
                })
              } else {
                  localStorage.setItem('cid', decoded.id);
                  localStorage.setItem('aid', id);
                  localStorage.setItem('advisorRate', parseFloat(ratePerMin).toFixed(2));
                  localStorage.setItem('username', username);
                  localStorage.setItem('minChatMinutes', minChatMinutes);
                  localStorage.setItem("sendrequest", id);
                  navigate(`/client/stripe-checkout-chat/5/${decoded.id}/${id}`);
              }
          }
        })

    } else {
        // if I am not client, (especially, i have loged in as advisor or admin) then redirect to client login page,
        localStorage.setItem('chatInitiate', true);
        localStorage.setItem('aid', id);
        localStorage.setItem('username', username);
        localStorage.setItem('advisorRate', parseFloat(rpm).toFixed(2));
        localStorage.setItem('minChatMinutes', minChatMinutes);
        window.location.href = '/client-login'
    }
  } 

  var BookingsList = [];
  const HandleScheduleChat = (id,rpm,minchat) => {
        setSlots([]);
        setCalendersBooking([]);
        axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/getAdvisor-availability/${id}`, {
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            },
          }).then(result => {
            if(result.data.data.length > 0) {
                setCalendersBooking(result.data.data);
                result.data.data.map(item => {
                    BookingsList.push({
                        'title': 'B',
                        'date': item.date
                    });
                })
            }
            console.log(BookingsList);
           
          }).catch(error => {

          })

    if (localStorage.getItem('clientToken')) {
        localStorage.removeItem('ScheduleInitiate');
        setIsOpen(true);
        setBookingAdvId(id);
        localStorage.setItem('rpm_schedule', parseFloat(rpm).toFixed(2));
        localStorage.setItem('minchat_schedule' , minchat);
        var decoded = jwt_decode(localStorage.getItem('clientToken'));
        const data = {
            "advisor_id": id,
            "client_id": decoded.id
        }
        axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/notification/offline`, data).then(result => {
        })
    } else {
        localStorage.setItem('ScheduleInitiate', true);
        localStorage.setItem('scheuleId',id);
        window.location.href = '/client-login';
    }
  }

  const uniqueTags = [];
  calendersBooking.map(img => {
      if (uniqueTags.indexOf(img.date) === -1) {
          uniqueTags.push(img.date)
      }
  });

  const [pageCount, setpageCount] = useState(0);
  const [page, setPage] = useState(1);
  let limit = 16;

  const paginationData = async (currentPage) => {
    const res = await fetch(
        `${process.env.REACT_APP_BASE_URL}/frontend/advisors?size=${limit}&page=` + currentPage, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ` + localStorage.getItem('accessToken')
        },
    }
    );
    return await res.json();
  };

  const handlePageClick = async (data) => {
      let currentPage = data.selected + 1;
      const result = await paginationData(currentPage);
      setAdvisorList(result.data);
  };

  useEffect(() => {
    debugger;
    localStorage.removeItem('EndTime');
    localStorage.removeItem('StartTime');
    localStorage.removeItem('offerExpire');
    localStorage.removeItem('FreeExpire');
    localStorage.removeItem("sendrequest");
    newParams.id === 'active' && setActiveTab(5);

    fetchClientStatus();

  }, [newParams.id]);

  async function fetchClientStatus() {
    setLoading(true)
    if(localStorage.getItem('clientToken'))
      await axios.get(`${process.env.REACT_APP_BASE_URL}/client/auth/profile`, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ` + localStorage.getItem('clientToken')
        },
      }).then(result => {
        if(result.data.data.suspended === 1) {
          setSuspended(true)
        }
        if(result.data.data.account_created_by) {
          setAccountCreatededBy(result.data.data.account_created_by);
        }
        const balance = Math.round((result.data.data.wallet_balance) * 100) / 100;            
        setNoOfMinutes(balance);
        /*setName(result.data.data.username);
        setType(true);*/
      }).catch(err => {
        console.log(err);
      })
    setLoading(false);
  }

  useEffect(() => {

    if(localStorage.getItem('clientToken')) {
        axios.get(`${process.env.REACT_APP_BASE_URL}/client/favourite-advisors`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem('clientToken')
            },
        }).then(result => {
            let advisors = result.data.data;
            setMyAdvisors(advisors);
            let myAdvisorIdsList = advisors.map(a => a._id);
            setMyAdvisorList(myAdvisorIdsList);
          });
    }
  },[]);

  useEffect(() => {
    debugger;
  }, [msg, errorType])

  const HandleFav = (id) => {
    if(localStorage.getItem('clientToken')) {
        const data = {
            "advisor_id" : id
        }
        debugger;
        // add the advisor with ID into my Favorite advisors
        if(advisorList.find((a) => a._id == id) && !MyadvisorList.includes(id)) {
          setMyAdvisorList([...MyadvisorList, id]);
        }
        else
          return;
        axios.post(`${process.env.REACT_APP_BASE_URL}/client/favourite-advisors`, data , {
             headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem('clientToken')
            }
        }).then(result => { 
            setMsg("Advisor has been added successfully in your My Advisor List.");
            setErrorType('success');   
            setTimeout(() => {
              setMsg("");
            }, 2000);
        })
    } else {
        setMsg("You must login to add favourite advisor in your my advisor list");
        localStorage.clear();
        window.location.pathname = '/client-login';
        setErrorType('error');  
    }
  }

  const HandleDeleteFav = (id) => {
    if(localStorage.getItem('clientToken')) {
      // add the advisor with ID into my Favorite advisors
      if(advisorList.find((a) => a._id == id) && MyadvisorList.includes(id)) {
        
        let tempAdvisorList = MyadvisorList.filter(myAdvisor => myAdvisor !== id );
        setMyAdvisorList(tempAdvisorList);
      }
      else
        return;

      axios.delete(`${process.env.REACT_APP_BASE_URL}/client/favourite-advisors/${id}`, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ` + localStorage.getItem('clientToken')
        }
      }).then(result => { 
        setMsg("Advisor has been removed successfully in your My Advisor List.");
        setErrorType('success');  
        setTimeout(() => {
          setMsg("");
        }, 2000);
      })
    } else {
        localStorage.setItem('advisorFavlist', id);
        navigate('/client-login'); 
    }
 }

  const ContinueChat = () => {
    navigate(`/chatroom/${localStorage.getItem('cid')}/client/${localStorage.getItem('username')}`); 
    //window.location.href = `/chatroom/${localStorage.getItem('cid')}/client/${localStorage.getItem('username')}`; 
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
                    <Link onClick={() => setActiveTab(2)} className={`nav-link position-relative fsp-16 ${activeTab === 2 ? 'active' : ''}`} to="#">
                      Favorite Advisors
                      <span className='position-absolute'></span>
                    </Link>
                  </li>

                  <li>
                    <Link onClick={() => setActiveTab(7)} className={`nav-link position-relative fsp-16 ${activeTab === 7 ? 'active' : ''}`} to="#">
                       Transaction History
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                 
                  <li>
                    <Link onClick={() => setActiveTab(4)} className={`nav-link position-relative fsp-16 ${activeTab === 4 ? 'active' : ''}`} to="#">
                      Profile Information
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  {
                     !suspended && 

                      <li>
                        <Link onClick={() => setActiveTab(5)} className={`nav-link position-relative fsp-16 ${newParams.id} ${activeTab === 5 ? 'active' : ''}`} to="#">
                          My Chat History
                          <span className='position-absolute'></span>
                        </Link>
                      </li>
                  }

                  <li>
                    <Link onClick={() => setActiveTab(6)} className={`nav-link position-relative fsp-16 ${activeTab === 6 ? 'active' : ''}`} to="#">
                      My Wallet
                      <span className='position-absolute'></span>
                    </Link>
                  </li>

                  <li>
                    <Link onClick={() => setActiveTab(8)} className={`nav-link position-relative fsp-16 ${activeTab === 8 ? 'active' : ''}`} to="#">
                      Change Password
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setActiveTab(9)} className={`nav-link position-relative fsp-16 ${activeTab === 9 ? 'active' : ''}`} to="#">
                      My Bookings
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  
                </nav>
                {
                chatEngage === true && 

                  <>
                    <div className='mb-2 ml-2'>
                      <button className="btn btn-purple bold-button px-5 py-2 ffp_chatbox rounded-5 fsp-15" 
                        type='button' 
                        title="Continue Chat"
                        onClick={ContinueChat} >
                      Continue Chat
                    </button>
                    </div>
                  </>
                }
              </div>
              <div className='mobilesidebar'>
                <span onClick={() => setToggle(!toggle)}>&#9776; </span>
                {
                chatEngage === true && 

                  <>
                    <div className='mb-2 ml-2'>
                      <button className="btn btn-purple bold-button px-3 py-1 mt-2 ffp_chatbox rounded-5 fsp-15" 
                        type='button' 
                        title="Continue Chat"
                        onClick={ContinueChat} >
                      Continue Chat
                    </button>
                    </div>
                  </>
                }
              </div>
            </div>

            <div className='col-12 col-lg-12'>
              <div className='bg-white rounded dashboard-nav custom-shadow' style={{ height: '100%' }}>
                <div className={activeTab === 0 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full '>
                    { msg && <AlertforAll action = "true" message = {msg} type = {errorType} revert = {setMsg}/> }
                    <span className='text-pink fsp-22 font-bold'>Advisors List</span>                             
                    
                    <div className='row mt-3 mb-4'>
                            <div className='col-sm-4 col-md-4 col-xs-6'>
                                <div className='sortorder searchbycategory'>
                                    {/* <div className="input-group">
                                        <label htmlFor="input-sort" className="input-group-text">Sort by Advisor Rate</label> 
                                        <select  style={{background: "#f8d56f42", border: "1px solid #ddd !important", borderRadius: "0.5rem !important"}} id="input-sort" defaultValue={sortRate} onChange={(e) => setSortRate(e.target.value)} className="form-control">
                                            <option value="">Select Advisor Rate Order</option>
                                            <option value="asc">Rate (Low &gt; High)</option>
                                            <option value="desc">Rate (High &gt; Low)</option>
                                        </select>
                                    </div> */}
                                    <select id="input-sort" defaultValue={sortRate} onChange={(e) => setSortRate(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                        <option value="">Select Advisor Rate Order</option>
                                        <option value="asc">Rate (Low &gt; High)</option>
                                        <option value="desc">Rate (High &gt; Low)</option>
                                    </select>
                                </div>
                            </div>
                            <div className='col-sm-4 col-md-4 col-xs-6'>
                                <div className='searchbycategory'>
                                <select id="countries" defaultValue={filerCategory} onChange={(e) => setFilerCategory(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                    <option value="">All Categories</option>
                                    {categories && categories.map((category, index) => (
                                    <option value={category._id} key={index}>{category.name}</option>
                                    ))}
                                </select>
                                </div>
                            </div>
                            <div className='col-sm-4 col-md-4 col-xs-12'>
                                <div className="searchuser filter_advisor">
                                    <input type="text" name="filter_advisor" placeholder="Search by advisor name or service" value={filterSearch}  onChange={(e) => setFilterSearch(e.target.value)} className="form-control py-2 border-0 rounded-1" />
                                </div>
                            </div>
                        </div>
                        <ActionButton loading={acceptLoading}>
                          <div className='row'>
                          {advisorList && advisorList.map((usr, index) => (
                                <div className='col-md-3 col-sm-6 text-center ipadpadding' key={index}>
                                    <div className='rounded-sm border border-slate-300 py-4 Advisors-Grid dashboard-Advisors-Grid'>
                                        <div className='row'>
                                          <div className='col-sm-6 col-6'>
                                            {usr.chat_status ? <img src='/assets/images/frontend/chat-green.svg' className='relative -top-3 left-3' alt="We chat" /> :
                                              <img src='/assets/images/frontend/chat-gray.svg' className='relative -top-3 left-3' alt="We chat" />
                                            }
                                          </div>
                                          {
                                            MyadvisorList.includes(usr._id) === true ?
                                            <div className='col-sm-6 col-6'>
                                                <button onClick={() => HandleDeleteFav(usr._id)} className="bold-button rounded-1 fsp-15 mr-1 text-right relative -top-4 heartbtn">
                                                    <i className={`bi bi-heart-fill text-lg text-red-600`} title="Click on to add this advsior on your favourite advisor list"></i>
                                                </button>
                                            </div>
                                            :
                                            <div className='col-sm-6 col-6'>
                                                <button onClick={() => HandleFav(usr._id)} className="bold-button rounded-1 fsp-15 mr-1 text-right relative -top-4 heartbtn">
                                                    <i className={`bi bi-heart text-lg text-red-600`} title="Click on to add this advsior on your favourite advisor list"></i>
                                                </button>
                                             </div>
                                           }

                                        </div>
                                        
                                        <a href={`/advisorprofile/${usr._id}`}>

                                            {usr.avatar
                                                ? <img src={`${process.env.REACT_APP_BASE_URL}/${usr.avatar}`} alt={usr.name} width="115" className='avatar-img' />
                                                : <img src='/assets/images/frontend/user-profile.png' alt={usr.name} className='avatar-img' />}

                                        </a>
                                        <a href={`/advisorprofile/${usr._id}`}><h3 className='ad-name'>
                                         
                                           {usr.displayname.substring(0,15)}{ usr.displayname.length > 15 && ' .......' }
                                          </h3></a>
                                          <div className="flex justify-center adrating">

                                              {[...new Array(5)].map((arr, index) => {
                                                  return index < parseInt(usr.rating_avg) &&
                                                      <svg key={index} aria-hidden="true" className="w-4 h-4 m-0 p-0 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>{index + 1} star</title><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                              })}
                                              
                                              {(usr.rating_avg > parseInt(usr.rating_avg)) &&
                                                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-4 h-4 m-0 p-0 text-gray-900 halfstar" viewBox="0 0 20 20">
                                                      <path d="M5.354 5.119 7.538.792A.516.516 0 0 1 8 .5c.183 0 .366.097.465.292l2.184 4.327 4.898.696A.537.537 0 0 1 16 6.32a.548.548 0 0 1-.17.445l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256a.52.52 0 0 1-.146.05c-.342.06-.668-.254-.6-.642l.83-4.73L.173 6.765a.55.55 0 0 1-.172-.403.58.58 0 0 1 .085-.302.513.513 0 0 1 .37-.245l4.898-.696zM8 12.027a.5.5 0 0 1 .232.056l3.686 1.894-.694-3.957a.565.565 0 0 1 .162-.505l2.907-2.77-4.052-.576a.525.525 0 0 1-.393-.288L8.001 2.223 8 2.226v9.8z"/>
                                                  </svg>
                                              }

                                              {[...new Array(4)].map((arr, index) => {
                                                  return index >= parseInt(usr.rating_avg) &&
                                                      <svg key={index} aria-hidden="true" className="w-4 h-4 m-0 p-0 text-gray-300 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Fifth star</title><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                              })}

                                          </div>
                                        <ul className='d-flex justify-content-between mb-0 pl-0 p-2'>
                                            {
                                                usr.disconted_rate === 0 ? <li><p>${parseFloat(usr.rate_per_min).toFixed(2)}/min </p></li> : 
                                                <li>

                                                      <p>
                                                           ${parseFloat(usr.disconted_rate).toFixed(2)}/min
                                                            <br />
                                                            <b style={{  textDecoration: 'line-through' }}>${parseFloat(usr.rate_per_min).toFixed(2)}/min</b>
                                                        </p>
                                                </li>
                                            }
                                            {/* <li className='mx-2'>
                                                
                                            </li> */}
                                            <input type="hidden" value={usr.rating_avg} />
                                            <li><p>{usr.total_chats} Chats</p></li>
                                        </ul>
                                        {/* <p className='fsp-14 mb-2 text-justify px-3'>{usr.description}</p> */}
                                       
                                        
                                          {
                                              usr.chat_status ? 
                                                  <button onClick={() => HandleChatProceed(usr._id, usr.username, usr.rate_per_min,  usr.disconted_rate, usr.min_chat_minutes )} className="btn btn-primary bold-button px-3 py-2 ffp rounded-1 fsp-15">
                                                      Online - Chat Now
                                                  </button>
                                                  :
                                                  <button onClick={() => HandleScheduleChat(usr._id,usr.rate_per_min,  usr.disconted_rate, usr.min_chat_minutes)} className="btn btn-default bold-button px-3 py-2 ffp rounded-1 fsp-15">Offline - Schedule a Chat</button>
                                          }
                                         
                                        
                                    </div>
                                </div>
                            ))}
                        </div>
                        </ActionButton>

                        <ReactPaginate
                            previousLabel={"previous"}
                            nextLabel={"next"}
                            breakLabel={"..."}
                            pageCount={pageCount}
                            marginPagesDisplayed={2}
                            pageRangeDisplayed={3}
                            onPageChange={handlePageClick}
                            containerClassName={"pagination justify-content-center"}
                            pageClassName={"page-item"}
                            pageLinkClassName={"page-link"}
                            previousClassName={"page-item"}
                            previousLinkClassName={"page-link"}
                            nextClassName={"page-item"}
                            nextLinkClassName={"page-link"}
                            breakClassName={"page-item"}
                            breakLinkClassName={"page-link"}
                            activeClassName={"active"}
                        />
                  </div>
                </div>
                <div className={activeTab === 1 ? 'd-block' : 'd-none'}>
                  <div className='border-bottom lg:d-flex d-md-inline-block w-full'>
                    {InboxActive && <InboxAdvisor />}
                  </div>
                </div>

                <div className={activeTab === 2 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    {InboxActive &&
                      <>
                      <div className='row'>
                      <div className='col-lg-6 col-12 col-sm-6 p-0'>
                        <span className='text-pink fsp-22 font-bold mb-3 d-block'>Favorite Advisors</span>
                        </div>
                        <MyAdvisor />
                        </div>
                      </>
                    }
                    {chatActive &&
                      <MyAdvisorView />
                    }
                  </div>
                </div>
                <div className={activeTab === 3 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    <Notifications />
                  </div>
                </div>
                <div className={activeTab === 4 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full'>
                    <ProfileInformation />

                  </div>
                </div>
                <div className={activeTab === 5 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full chattab'>
                    <MyChat />
                  </div>
                </div>

                <div className={activeTab === 7 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full chattab'>
                      <TransactionHistory balance = {noOfMinutes} />
                  </div>
                </div>

                <div className={activeTab === 6 ? 'd-block' : 'd-none'}>
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full chattab'>
                  <div className='row mywallet'>
                    {/* <label htmlFor="inputlabel" className="col-sm-3 col-md-3 col-12 col-form-label text-right text-black font-medium ">My Wallet</label> */}
                    <div className='col-sm-7 col-md-7 col-12 position-relative'>
                        <div className='AvailableSecond'>
                        <p className='mb-1 fsp-22 font-bold text-black text-left'>Available Balance : 
                            <span className='text-pink fsp-22 font-semibold text-center '> &#36; {Math.abs(noOfMinutes)} USD</span></p>
                        </div>
                    </div>
                    <div className='col-sm-5 col-md-5 col-12 text-right'>
                        <button onClick={() => { navigate('/client/stripe-checkout') }} className="px-4 py-1.5 btn btn-primary rounded-1 mt-2 mb-2 ffp fsp-12">Top up</button>
                    </div>
                </div>
                  </div>
                </div>

                <div className={activeTab === 8 ? 'd-block' : 'd-none'}>
                
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full chattab'>
                  <span className='text-pink fsp-22 font-bold mb-3 d-block'>Change Password</span>
                  { msg && <AlertforAll action = "true" message = {msg} type = {errorType} revert = {setMsg}/> }

                    <div className="row mb-3">
                        <label htmlFor="inputname" className="col-sm-12 col-form-label text-black font-medium">Current Password <span className='text-red text-base absolute top-0'>*</span></label>
                        <div className="col-sm-12">
                            <input type="password" onChange={(e) => setPwdCurrConf(e.target.value)} className="form-control" name='cpassword' />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <label htmlFor="inputname" className="col-sm-12 col-form-label text-black font-medium">New Password <span className='text-red text-base absolute top-0'>*</span></label>
                        <div className="col-sm-12">
                            <input type="password" onChange={(e) => setPwd(e.target.value)} className="form-control" name='npassword' />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <label htmlFor="inputname" className="col-sm-12 col-form-label text-black font-medium">Confirm Password <span className='text-red text-base absolute top-0'>*</span></label>
                        <div className="col-sm-12">
                            <input type="password" onChange={(e) => setPwdConf(e.target.value)} className="form-control" name='cnpassword' />
                        </div>
                    </div>

                    <div className='text-right'><button onClick={updatePassword} className="px-4 px-md-4 py-1.5 btn btn-light rounded-1 mt-2 mb-2 ffp fsp-17">Update Password</button></div>
                  </div>
                </div>

                <div className={activeTab === 9 ? 'd-block' : 'd-none'}>
                
                  <div className='px-4 py-3 lg:d-flex d-md-inline-block w-full chattab'>
                  <span className='text-pink fsp-22 font-bold mb-3 d-block'>My Bookings</span>
                  <div className="inbox_chat">

                    {bookings && bookings.map((booking, index) => (
                      <a href='#!' key={index}>
                        <div className="chat_list purple-background">
                          <div className="chat_people">
                            <div className="chat_ib">
                              <h5 className='text-white'>{booking.client.username}</h5>
                              <p className='text-gray-200'>{booking.date} <span className="chat_date fsp-12 text-gray-400">
                              {(booking.intervals).map((name, index) => (  
                                <p key={index}>                   
                                  From {name.split("-")[0]} to {name.split("-")[1]}
                                </p>  
                              ))}  
                              </span></p>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className='col-12 col-lg-12 mt-3 mb-5'>
            <div className='bg-white rounded custom-shadow dashboardfooter pt-4 pb-4 px-4' style={{ height: '100%' }}>
                <ul className="flex flex-col md:flex-row items-center justify-center">
                  <li className="my-2"><Link to='/pages/member-terms-and-conditions' className="text-decoration-none text-black fsp-15">Member terms and conditions</Link></li>
                  <li className="my-2"><Link to='/privacypolicy' className="text-decoration-none text-black fsp-15">Privacy Policy</Link></li>
                  <li className="my-2"><Link to='/contact' className="text-decoration-none text-black fsp-15">Contact us</Link></li>
              </ul>
            </div>
            </div>
          </div>
          {toggle && (
            <div id="mySidenav" className="sidenav">
              <div className='sidebartitle'><h4></h4>
                <button className="closebtn" onClick={() => setToggle(!toggle)}><i className="bi bi-x-lg"></i></button></div>
              <div className='bg-white rounded' style={{ height: '100%' }}>

                <nav className="nav pt-4 pb-4 px-4 adtab ">
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
                    <Link onClick={() => setTabbingActive(2)} className={`nav-link position-relative fsp-16 ${activeTab === 2 ? 'active' : ''}`} to="#">
                      Favorite Advisors
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(7)} className={`nav-link position-relative fsp-16 ${activeTab === 7 ? 'active' : ''}`} to="#">
                      Transaction History
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(4)} className={`nav-link position-relative fsp-16 ${activeTab === 4 ? 'active' : ''}`} to="#">
                      Profile Information
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(5)} className={`nav-link position-relative fsp-16 ${newParams.id} ${activeTab === 5 ? 'active' : ''}`} to="#">
                      My Chat History
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(6)} className={`nav-link position-relative fsp-16 ${newParams.id} ${activeTab === 6 ? 'active' : ''}`} to="#">
                     My Wallet
                      <span className='position-absolute'></span>
                    </Link>
                  </li>
                  <li>
                    <Link onClick={() => setTabbingActive(8)} className={`nav-link position-relative fsp-16 ${activeTab === 8 ? 'active' : ''}`} to="#">
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

        <div className='custompopup'>
          <Modal
              isOpen={modalIsOpen}
              onAfterOpen={afterOpenModal}
              onRequestClose={closeModal}
              style={customStyles}
              contentLabel="Example Modal"
              centered>
              <div className='container p-0 Calendarpopup'>
                <button onClick={closeModal}><i className="bi bi-x-lg"></i></button>
                                
                <div className='row p-0 m-auto'>

                    <div className='col-sm-12 col-12'>
                        <h2>Calendar</h2>
                        <div className='latestUsers'>

                            <div className='n2rCalendar'>
                                <FullCalendar
                                    initialView="dayGridMonth"
                                    events={uniqueTags.map(item => {
                                      return {
                                        'date': item,
                                        'backgroundColor': '#fcce27',
                                        'color': '#fcce27',
                                        'className' : ["eventBooking"]
                                      }
                                    })}
                                    
                                    eventClick={(e) => handleDateClick(e,'event')}
                                    dateClick={
                                        function (arg) {
                                          handleDateClick(arg,'date')
                                        }
                                    }
                                    editable={true}
                                    selectable={true}
                                    plugins={[dayGridPlugin, interactionPlugin]}
                                />
                            </div>
                        </div>
                    </div>
                    <div className='col-sm-12 col-12 Slots mt-4'>
                        <h2 className='lg:pl-0'>Available Slots for {daySelected}</h2>

                        {slots?.map((item, index) => (
                            <div className='activebtn inline-block' key={index}>
                                <input
                                    key={index}
                                    type="checkbox"
                                    id={`slot-checkbox-${index}`}
                                    name='slot'
                                    value={item}
                                    checked={checkedState[index]}
                                    onChange={() => handleOnChange(index)}
                                />
                                <label htmlFor={`slot-checkbox-${index}`}>{item}</label>
                            </div>
                        ))}
                        {slots && slots.length > 0 &&
                            <button onClick={bookSlot} className='btn btn-light'>Book Slot</button>
                        }
                    </div>
                </div>
              </div>
          </Modal>
      </div>

              {/* { ChatRequestviaPayment &&
                  <div className="modal myshare" style={{display: 'block' , background: '#a39ac39e' }} id="connectModal">
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-body">
                      <h4 className="modal-title">Connecting....</h4>
                          <h5 className='text-purple'>Waiting for advisor to accept the chat</h5>
                      </div>
                    </div>
                  </div>
                  </div>
              }                   */}
      </>
      {loading && <Loading />}
    </div>
  )
}
