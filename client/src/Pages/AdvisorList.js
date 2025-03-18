import React, { useState, useEffect } from 'react'
import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'
import jwt_decode from "jwt-decode";
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import ReactPaginate from 'react-paginate';
import Modal from 'react-modal';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import swal from 'sweetalert';
import { useParams,useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import $ from 'jquery';
import moment from 'moment';
import { getCidFromStorageToken } from '../Utils/storageHelper';

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

export default function AdvisorList() {

    const navigate = useNavigate();
    const [chatId, setChatId] = useState(0);
    const [calendersBooking,setCalendersBooking] = useState([]);
    const params = useParams();

    const [msg,setMsg] = useState('');
    const [errorType,setErrorType] = useState('');

    const [slots, setSlots] = useState([]);
    const [bookingAdvId, setBookingAdvId] = useState('');
    const [selectedSlot, setSelectedSlot] = useState();
    const [selectedDay, setSelectedDay] = useState();
    const [MyAdvisors,setMyAdvisors] = useState([]);
    const [filterSearch, setFilterSearch] = useState('');
    const [sortRate, setSortRate] = useState('');
    const [filerCategory, setFilerCategory] = useState('');

    const [pageCount, setpageCount] = useState(0);
    const [page, setPage] = useState(1);
    let limit = 20;
    const [advisorList, setAdvisorList] = useState([]);
    const [categories, setCategories] = useState([]);
    const [checkedState, setCheckedState] = useState(
        new Array(slots?.length).fill(false)
        );
    var subtitle;
    const [modalIsOpen, setIsOpen] = useState(false);


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

    }, [filterSearch, filerCategory, sortRate, ]);

    function afterOpenModal() {
       //subtitle.style.color = '#f00';
    }

    function closeModal() {
        setBookingAdvId();
        setIsOpen(false);
    }

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
        });

        setSelectedSlot(totalSlots);
    };

    // const HandleChatProceed = (id, username) => {
    //     if (localStorage.getItem('clientToken')) {
    //         var decoded = jwt_decode(localStorage.getItem('clientToken'));

    //         const data = {
    //             "advisor_id": id,
    //             "client_id": decoded.id
    //         }
    //         axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/notification/add`, data).then(result => {
    //             setTimeout(() => {
    //                 localStorage.setItem('cid', decoded.id);
    //                 localStorage.setItem('aid', id);
    //                 window.location.href = `/chatroom/${decoded.id}/client/${username}`;
    //             }, 1000);
    //         })
    //     } else {
    //         localStorage.setItem('chatInitiate', true);
    //         window.location.href = '/client-login'
    //     }
    // }

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
                                        localStorage.setItem('advisorRate', ratePerMin);
                                        localStorage.setItem('username', username);
                                        localStorage.setItem('notif_id', result.data.data._id);
                                        localStorage.setItem('minChatMinutes', minChatMinutes);
                                        navigate(`/connecting`);
                                    }, 1000);
                                })
                            } else {
                                debugger;
                                localStorage.setItem('cid', decoded.id);
                                localStorage.setItem('aid', id);
                                localStorage.setItem('advisorRate', ratePerMin);
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
            localStorage.setItem('advisorRate', ratePerMin);
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
           swal('warning', "Booking could not be done for past date", "warning");                 
        } else if(moment(dayAfter).format('YYYY-MM-DD') === check) {
          swal('warning', "No Booking available on date "+check, "warning");  
        } else {                     
            setSelectedDay(check);
            axios.get(`${process.env.REACT_APP_BASE_URL}/client/calendar-availabilities/by-date/${check}?advisor_id=${bookingAdvId}`).then(result => {
                if (result.status === 200) {
                     if(result.data.data.length === 0 ) {    
                        swal('warning', "No Booking available on date "+check, "warning");
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
                    window.location.href = '/advisorlist';
                },1000);  
            })
        } else {
            localStorage.setItem('advisorFavlist', id);
            navigate('/client-login')
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
                   window.location.href = '/advisorlist';
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
    <div>
    <FrontHeader />

    <section className='md:mb-5 mb-3 mt-6 Our-Advisors'>
            <div className='container'>
                <h2 className='text-center'>Our <span>Advisors</span></h2>
                <div className='row Advisors-category'>
                <div className='col-sm-4 col-xs-6'>
                <div className='sortorder searchbycategory'>
                    {/* <div className="input-group">
                        <label htmlFor="input-sort" className="input-group-text">Sort by Advisor Rate</label> 
                        <select style={{background: "#f8d56f42", border: "1px solid #ddd !important", borderRadius: "0.5rem !important"}} id="input-sort" defaultValue={sortRate} onChange={(e) => setSortRate(e.target.value)} className="form-control">
                            <option value="">Select Rate Order</option>
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
                <div className='col-sm-4 col-xs-6'>
                    <div className='searchbycategory'>
                    <select id="countries" defaultValue={filerCategory} onChange={(e) => setFilerCategory(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                        <option value="">Select Category</option>
                        {categories && categories.map((category, index) => (
                        <option value={category._id} key={index}>{category.name}</option>
                        ))}
                    </select>
                    </div>
                </div>
                    <div className='col-sm-4 col-xs-12'>
                        <div className="searchuser filter_advisor">
                            <input type="text" name="filter_advisor" placeholder="Search by advisor name or service" value={filterSearch}  onChange={(e) => setFilterSearch(e.target.value)} className="form-control py-2 border-0 rounded-1" />
                        </div>
                    </div>
                </div>
                <div className='row p-0 m-auto'>
                    {advisorList && advisorList.map((usr, index) => (
                        <div className='col-md-3 col-sm-6 px-1 text-center' key={index}>
                            <div className='rounded-sm border border-slate-300 py-4 Advisors-Grid'>
                                <div className='row'>
                                    <div className='col-sm-6 col-6'>
                                    {usr.chat_status ? <img src='assets/images/frontend/chat-green.svg' className='relative -top-3 left-3' alt="We chat" /> :
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
                                

                                <a href={`/advisorprofile/${usr._id}`}>

                                    {usr.avatar
                                        ? <img src={`${process.env.REACT_APP_BASE_URL}/${usr.avatar}`} alt={usr.name} className='avatar-img w-28 h-28' />
                                        : <img src='/assets/images/frontend/user-profile.png' alt={usr.name} className='avatar-img w-28 h-28' />}

                                </a>
                                <a href={`/advisorprofile/${usr._id}`} className='block px-3'><h3 className='ad-name'>
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
                                {/* <ul className='d-flex justify-center mb-0 pl-0'>
                                    <li><p>${usr.rate_per_min}/min </p></li>
                                    <li className='mx-2'>
                                        <div className="flex justify-center">

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
                                    </li>
                                    <li><p>{usr.total_reviews} Reviews {usr.total_chats} Chats</p></li>
                                </ul> */}
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
                                            <li><p>{usr.total_chats} Chats</p></li>
                                        </ul>
                        
                                {/* <p className='fsp-14 mb-2 text-justify px-3'>{usr.description}</p> */}
                                {
                                    usr.chat_status ?
                                        <button onClick={() => HandleChatProceed(usr._id, usr.username, usr.rate_per_min, usr.disconted_rate, usr.min_chat_minutes)} className="btn btn-primary bold-button px-3 py-2 ffp rounded-1 mt-3 fsp-15">
                                        {/* <button onClick={() => HandleChatProceed(usr._id, usr.username, usr.rate_per_min)} className="btn btn-primary bold-button px-3 py-2 ffp rounded-1 mt-3 fsp-15"> */}
                                            Online - Chat Now
                                        </button>
                                        :
                                        <button onClick={() => HandleScheduleChat(usr._id,usr.rate_per_min, usr.disconted_rate, usr.min_chat_minutes)} className="btn btn-secondary bold-button px-3 py-2 ffp rounded-1 mt-3 fsp-15">Offline - Schedule a Chat</button>
                                }
                            </div>
                        </div>
                    ))}
                </div>
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
        </section>
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

                        <div className='col-sm-12 col-12'>
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
                                </div>))}
                            {slots && 
                                <button onClick={bookSlot} className='btn btn-light'>Book Slot</button>
                            }
                        </div>
                        
                    </div>
                    </div>
                </Modal>
            </div>
        </>
    </div>

  )
}
