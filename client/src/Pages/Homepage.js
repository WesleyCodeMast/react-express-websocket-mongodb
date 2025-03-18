import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'
import axios from 'axios';
import { io } from 'socket.io-client';
import Modal from 'react-modal';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction"; // needed
import { useParams } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import swal from 'sweetalert';
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from 'react-responsive-carousel';
import AlertforAll from '../Components/Chat/AlertforAll';
import moment from 'moment';
import { useQuery } from 'react-query';
import $ from 'jquery';
import { getChatTopics , homePageBanners , homepageText } from './Apidata';
import { getCidFromStorageToken } from '../Utils/storageHelper';
import { Loading } from '../Components/Loading';
import { useDispatch, useSelector } from 'react-redux';
import {
  decrement,
  increment,
  incrementAsync,
  incrementByAmount,
  selectCount
} from '../Reducer/reducer'  
const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

Modal.setAppElement('#root');

export default function Ourstory() {
    const count = useSelector(selectCount);
    const dispatch = useDispatch();
    const [incrementAmount, setIncrementAmount] = useState('2');
    const [advisorsList,setadvisorList] = useState([]);
    const [calendersBooking,setCalendersBooking] = useState([]);
    const chatTopics_result = useQuery('chatTopicss', getChatTopics);
    const [loading, setLoading] = useState(true);
    //const AllAdvisors_result = useQuery(['Advisorslist'],AllAdvisors);
    const homePageBanners_result = useQuery('banners', homePageBanners);
    const homepageText_result = useQuery('homepage_text', homepageText);
    var chatTopics;
    if(! chatTopics_result.isLoading) chatTopics = chatTopics_result;
    //if(! AllAdvisors_result.isLoading) var advisorsList = AllAdvisors_result.data;
    var bannerImage;
    if(! homePageBanners_result.isLoading) bannerImage = homePageBanners_result.data;
    var home_page_text
    if(! homepageText_result.isLoading) home_page_text = homepageText_result.data;

    useEffect(() => {
        const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
        socket.on('ADVISOR-ONLINE-OFFLINE-NOTIFYBACK', ({ advisor , status }) => {
            getAdvisorsListFunc();
        });
        return () => {
            socket.off('ADVISOR-ONLINE-OFFLINE-NOTIFYBACK');
        }
    },[]);

    useEffect(() => {
        getAdvisorsListFunc();
    },[])

    async function getAdvisorsListFunc() {
        setLoading(true);
        await axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/all-advisors`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
        }).then(result => {
            setadvisorList(result.data.data);
        }).catch(error => {
            swal('Sorry','Please check your internet connection!', 'warning');
        });
        setLoading(false);
    }

    const navigate = useNavigate();
    const [msg,setMsg] = useState('');
    const [errorType,setErrorType] = useState('');
    const [MyAdvisors,setMyAdvisors] = useState([]);

    const params = useParams();

    let subtitle;
    const [modalIsOpen, setIsOpen] = useState(false);
    const [slots, setSlots] = useState([]);
    const [bookingAdvId, setBookingAdvId] = useState('');
    const [selectedSlot, setSelectedSlot] = useState();
    const [selectedDay, setSelectedDay] = useState();
    const [noadvisor,setNoadvisor] = useState(false);
    const [checkedState, setCheckedState] = useState(
        new Array(slots?.length).fill(false)
    );

    function afterOpenModal() {
    //   subtitle.style.color = '#f00';
    }

    function closeModal() {
        setBookingAdvId();
        setIsOpen(false);
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
                setMyAdvisors(result.data.data);
            });
        }

    },[]);

    const MyadvisorList = [];
    if(MyAdvisors) {
        MyAdvisors.map((itm,index) => (
            MyadvisorList.push(itm._id)
        ))
    }

    useEffect(() => {
        localStorage.removeItem('chatstarted');
        localStorage.removeItem('review');
        localStorage.removeItem('chatrejected');
    }, []);

    useEffect(() => {
        if(params.id === localStorage.getItem('scheuleId')) {
            setIsOpen(true);
            setBookingAdvId(params.id);
        }
    },[params.id]);

    const [chatId, setChatId] = useState(0);

    useEffect(() => {
        
        if(localStorage.getItem('clientToken')) {
            const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
            var decoded = getCidFromStorageToken();
            socket.on('CHAT-CONNECTED', ({ room , user1 , user2 }) => {
            if(user1 === localStorage.getItem('aid') && (user2 === localStorage.getItem('cid'))) {
                navigate(`/chatroom/${decoded.id}/client/${room}`);
                localStorage.setItem('chatstarted',true);
            } else {
            }
            });
            socket.on('CLIENT-CHAT-REJECTED-NOTIFYBACK', ({ advisor }) => {
                if(advisor === localStorage.getItem('aid')) {
                    swal('Hello', "Advisor is busy! Please book time slot to connect with advisor.","error");
                    localStorage.removeItem('timers');
                } 
            });
            return () => {
                socket.off('CHAT-CONNECTED');
                socket.off('CLIENT-CHAT-REJECTED-NOTIFYBACK');
            }
        }        
      },[]);

    const HandleChatProceed = (id, username, rpm, drpm, minChatMinutes) => {

        let ratePerMin = drpm === 0 ? rpm : drpm;

        if (localStorage.getItem('clientToken')) {
            var decoded = getCidFromStorageToken();
            const data = {
                "advisor_id": id,
                "client_id": decoded.id
            }

            axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisorStatus/${id}`).then(result3 => {
                if(result3.data.data[0].chat_engage === 1) {
                    swal('Hello','Advisor is busy right now! you can wait or schedule chat', 'warning');
                    setIsOpen(true);
                    setBookingAdvId(params.id);
                } else {
                    setChatId(id);
                    // setchatRequest(true);
                    axios.get(`${process.env.REACT_APP_BASE_URL}/client/auth/profile`, {
                        headers: {
                          'Accept': 'application/json, text/plain, */*',
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer `+localStorage.getItem('clientToken')
                        },
                      }).then(result => {
                          var minChat = minChatMinutes === 0 ? 1 : minChatMinutes;
                          var minChatAllowed = ratePerMin * minChat;

                            if(result.data.data.wallet_balance >= minChatAllowed) {
                                const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
                                axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/notification/add`, data).then(result => {
                                    socket.emit('NOTIFICATION-SEND', ({advisor:id,client:decoded.id, noti_id:result.data.data._id, cl_name:decoded.username, minChat: minChatMinutes}));
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
                      })
               
                }
            })

        } else {
            localStorage.setItem('chatInitiate', true);
            localStorage.setItem('aid', id);
            localStorage.setItem('username', username);
            localStorage.setItem('advisorRate', parseFloat(ratePerMin).toFixed(2));
            localStorage.setItem('minChatMinutes', minChatMinutes);
            localStorage.setItem('newClientSingup',id);
            navigate('/client-signup');
        }
    }

    var BookingsList = [];

    const HandleScheduleChat = (id,rpm,drpm,minchat) => {
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

        let ratePerMin = drpm === 0 ? rpm : drpm;

        if (localStorage.getItem('clientToken')) {
            localStorage.removeItem('ScheduleInitiate');
            setIsOpen(true);
            setBookingAdvId(id);
            localStorage.setItem('rpm_schedule', parseFloat(ratePerMin).toFixed(2));
            localStorage.setItem('minchat_schedule' , minchat);
            var decoded = getCidFromStorageToken();
            const data = {
                "advisor_id": id,
                "client_id": decoded.id
            }
            axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/notification/offline`, data).then(result => {
            })
        } else {
            localStorage.setItem('ScheduleInitiate', true);
            localStorage.setItem('scheuleId',id);
            navigate(`/client-signup`);
        }
    }

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
            setMsg("Booking could not be done for past date");
            setErrorType('error');  
            setIsOpen(false);   
        } else if(moment(dayAfter).format('YYYY-MM-DD') === check) {
            setMsg("No Booking available on date "+check);
            setErrorType('error'); 
            setIsOpen(false);
        } else {                    
            setSelectedDay(check);
            axios.get(`${process.env.REACT_APP_BASE_URL}/client/calendar-availabilities/by-date/${check}?advisor_id=${bookingAdvId}`).then(result => {
                if (result.status === 200) {
                     if(result.data.data.length === 0 ) {  
                        setMsg("No Booking available on date "+check);
                        setErrorType('error')   
                        setIsOpen(false);
                        setSlots([]);
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
        const client = getCidFromStorageToken();
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
                        setMsg("We have reserved your time for this booking and informed the advisors that you will be here.");
                        setErrorType('success');  
                        setIsOpen(false);   
                        swal('success', "We have reserved your time for this booking and informed the advisors that you will be here.","Success");  
                        window.location.href = `/client/dashboard?tab=9`;
                    } else {
                        setMsg("Your Wallet Balance is low, redirecting to payment");
                        setErrorType('error');  
                        setTimeout(() => {
                            navigate(`/client/stripe-checkout-schedule-chat/${amount}/${client.id}/${bookingAdvId}`);
                        },1000);
                    }
                  });

            }
        }).catch(err => {
            console.log(err);
        })
    }

    const HandleAdvisorProfile = (idUser) => {
        navigate(`/advisorprofile/${idUser}`);
    }

    const HandleFav = (id) => {
        if(localStorage.getItem('clientToken')) {
            const data = {
                "advisor_id" : id
            }
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
                    window.location.href = '/';
                },1000); 
            })
        } else {
            localStorage.setItem('advisorFavlist', id);
            navigate('/client-login'); 
        }
    }

    const HandleDeleteFav = (id) => {
        if(localStorage.getItem('clientToken')) {
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
                    window.location.href = '/';
                },1000); 
            })
        } else {
            localStorage.setItem('advisorFavlist', id);
            navigate('/client-login'); 
        }
    }

    const uniqueTags = [];
    calendersBooking.map(img => {
        if (uniqueTags.indexOf(img.date) === -1) {
            uniqueTags.push(img.date)
        }
    });

    return (
        <div className=''>
            <FrontHeader />
            
            <>
                <section className="mt-lg-4 mt-xl-5 Your-Privacy">
                    <div className='container'>
                        <div className='row'>
                            <div className='col-12 col-lg-12 px-3 px-lg-0'>
                                <div className="content-top">
                                    <div
                                    dangerouslySetInnerHTML={{__html: home_page_text?.data.content}}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className='container'>
                    <div className='w-full h-auto'>

                     <Carousel showThumbs={false}>
                        {
                            bannerImage?.data.map((banner, index) => (
                            <div key={index}>
                                <img src={`${process.env.REACT_APP_BASE_URL}/${banner.image}`} alt="User Profile" />
                            </div>
                        ))}
                     </Carousel>

                    </div>
                    </div>
                </section>
                <section className='md:mb-5 mb-3 mt-6'>
                    <div className='container'>
                        <div className='row'>
                            <button
                                aria-label="Increment value"
                                onClick={() => dispatch(increment())}
                                >
                                +
                            </button>
                            <span>{count}</span>
                            <button
                                aria-label="Decrement value"
                                onClick={() => dispatch(decrement())}>
                                -
                            </button>
                        </div>
                        <div className='row'>
                            <input
                                aria-label="Set increment amount"
                                value={incrementAmount}
                                onChange={e => setIncrementAmount(e.target.value)}
                                />
                            <button
                                onClick={() =>
                                    dispatch(incrementByAmount(Number(incrementAmount) || 0))
                                }>
                                Add Amount
                            </button>
                            <button
                                onClick={() => dispatch(incrementAsync(Number(incrementAmount) || 0))}>
                                Add Async
                            </button>
                        </div>
                    </div>
                </section>
                <section className='md:mb-5 mb-3 mt-6 Our-Advisors'>
                    <div className='container'>
                        <h2 className='text-center'>Our <span>Advisors</span></h2>
                        { msg && <AlertforAll action = "true" message = {msg} type = {errorType} revert = {setMsg}/> }
                          <div className='row p-0 m-auto'>
                            {advisorsList?.map((usr, index) => (

                                <div className='col-md-3 col-sm-6 px-1 text-center' key={index}>
                                    <div className='rounded-sm border border-slate-300 py-4 Advisors-Grid'>
                                    <div className='row'>
                                        <div className='col-sm-6 col-6'>
                                        {
                                            usr.chat_status ? <img src='assets/images/frontend/chat-green.svg' className='relative -top-3 left-3' alt="We chat" /> :
                                            <img src='assets/images/frontend/chat-gray.svg' className='relative -top-3 left-3' alt="We chat" />
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

                                        <a href="#?" onClick={() => HandleAdvisorProfile(usr._id)}>

                                            {usr.avatar
                                                ? <img src={`${process.env.REACT_APP_BASE_URL}/${usr.avatar}`} alt={usr.name} className='avatar-img w-28 h-28' />
                                                : <img src='/assets/images/frontend/ad-avatar.png' alt={usr.name} className='avatar-img w-28 h-28' />}

                                        </a>
                                        <a href={`/advisorprofile/${usr._id}`} className='block px-3'>
                                            <h3 className='ad-name'> 
                                                {usr.displayname.substring(0,15)}{ usr.displayname.length > 15 && ' .......' }
                                                <span className=' float-right'></span>
                                            </h3>
                                        </a>
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
                                                usr.disconted_rate === 0 ?
                                                     <li>
                                                        <p>
                                                            ${parseFloat(usr.rate_per_min).toFixed(2)}/min 
                                                        </p>
                                                    </li> : 
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
                                            <li><p>{usr.chat_count} Chats</p></li>
                                        </ul>
                                        {/* <p className='fsp-14 mb-2 text-justify px-3 minheightofdes'>{usr.description.substring(0,40)}{ usr.description.length > 40 && ' .......' }</p> */}
                                        
                                        {
                                            usr.chat_status ?
                                                <button onClick={() => HandleChatProceed(usr._id, usr.username, usr.rate_per_min, usr.disconted_rate, usr.min_chat_minutes)} className="btn btn-primary bold-button px-3 py-2 ffp rounded-1 mt-3 fsp-15">
                                                    Online - Chat Now
                                                </button>
                                                :
                                                <button onClick={() => HandleScheduleChat(usr._id,usr.rate_per_min, usr.disconted_rate, usr.min_chat_minutes)} className="btn btn-secondary bold-button px-3 py-2 ffp rounded-1 mt-3 fsp-15">Offline - Schedule a Chat</button>
                                        }
                                    </div>
                                </div>

                            ))}

                            {
                               noadvisor && 
                               <div className="col-12 col-lg-12 px-3 px-lg-0">
                                  <h1 className='text-center'>There is no advisor listed yet</h1>
                               </div>
                            }   

                        </div>
                        { advisorsList?.length > 6 && <div className="text-center advisor-bottom-button"><Link to="/advisorlist" className="btn btn-light create-account">View all</Link></div> }
                    </div>
                </section>

                <section className='mb-5 md:mt-6 Chat-Topics'>
                    <div className='container'>
                        <h2 className='text-center'> Chat <span>Topics</span></h2>
                        <div className='row p-0 m-auto'>
                            <div className='col-sm-12 psychic-readings'>
                                <div className='topic-chat-yellow'>
                                    <img src={`${process.env.REACT_APP_BASE_URL}/${chatTopics?.data.data.topicimage1}`} className='img-fluid' alt="Psychic Readings" />
                                    <h3>{chatTopics?.data.data.topic1headline}</h3>
                                    <p>{chatTopics?.data.data.topic1content}</p>
                                </div>
                            </div>
                            <div className='col-sm-12 psychic-readings'>
                                <div className='topic-chat-green'>
                                    <img src={`${process.env.REACT_APP_BASE_URL}/${chatTopics?.data.data.topicimage2}`} className='img-fluid' alt="Commerce" />
                                    <h3>{chatTopics?.data.data.topic2headline}</h3>
                                    <p>{chatTopics?.data.data.topic2content}</p>
                                </div>
                            </div>
                            <div className='col-sm-12 psychic-readings'>
                                <div className='topic-chat-pink'>
                                    <img src={`${process.env.REACT_APP_BASE_URL}/${chatTopics?.data.data.topicimage3}`} className='img-fluid' alt="Dispute Resolution" />
                                    <h3>{chatTopics?.data.data.topic3headline}</h3>
                                    <p>{chatTopics?.data.data.topic3content}</p>
                                </div>
                            </div>
                            <div className='col-sm-12 psychic-readings'>
                                <div className='topic-chat-purple'>
                                    <img src={`${process.env.REACT_APP_BASE_URL}/${chatTopics?.data.data.topicimage4}`} className='img-fluid' alt="Vitality" />
                                    <h3>{chatTopics?.data.data.topic4headline}</h3>
                                    <p>{chatTopics?.data.data.topic4content}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </>

            <FrontFooter />
            <>
                <div className='custompopup'>
                    <Modal
                        isOpen={modalIsOpen}
                        onAfterOpen={afterOpenModal}
                        onRequestClose={closeModal}
                        style={customStyles}
                        contentLabel="Example Modal"
                        centered    
                    >
                        <div className='container p-0 Calendarpopup'>
                        <button onClick={closeModal}><i className="bi bi-x-lg"></i></button>          
                        <div className='row p-0 m-auto'>
                            <div className='col-sm-6 col-12'>
                                <h2>Calendar</h2>
                                <div className='latestUsers'>
                                    <div className='n2rCalendar'>
                                        <FullCalendar
                                          initialView="dayGridMonth"
                                          dateClick={
                                            function (arg) {
                                               handleDateClick(arg,'date')
                                            }
                                        }
                                          events={uniqueTags.map(item => {
                                            return {
                                               'date': item,
                                               'backgroundColor': '#fcce27',
                                               'color': '#fcce27',
                                               'className' : ["eventBooking"]
                                            }
                                          })}
                                          
                                          eventClick={(e) => handleDateClick(e,'event')}
                                          editable={true}
                                          selectable={true}
                                          plugins={[dayGridPlugin, interactionPlugin]}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='col-sm-6 col-12 Slots'>
                                <h2 className='lg:pl-3 mb-2'>Available Slots for {daySelected}</h2>
                                {
                                    slots?.map((item, index) => (
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

                                {
                                   slots && slots.length > 0 &&
                                   <div className='text-center slotbtn mt-2'>
                                        <button onClick={bookSlot} className='btn btn-light'>Book Slot</button>
                                   </div>
                                }
                            </div>
                        </div>
                        </div>
                    </Modal>
                </div>
            </>
            {loading && <Loading />}
        </div>
    )
}
