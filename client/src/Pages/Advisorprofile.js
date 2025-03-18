import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as moment from 'moment';
import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import jwt_decode from "jwt-decode";
import swal from 'sweetalert';

export default function Advisorprofile() {
    const params = useParams();
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [values, setValues] = useState({ displayname: null, userName: null , ratingAvg: 3, chatCount: 0, reviews: [],
                                            service: '', ratePerMin: '', avatar: '', chatStatus: '',profileInfo: '',
                                            marketingIntro: '', aboutus: '', minChatMinutes: 0 
                                        });
    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisor/${params.id}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(result => {
            let rpm = result.data.disconted_rate === 0 ?  result.data.data.rate_per_min : result.data.disconted_rate;
            console.log(result);
            setValues({
                displayname: result.data.data.displayname,
                userName: result.data.data.username,
                ratingAvg: result.data.data.rating_avg,
                chatCount: result.data.data.chat_count,
                reviews: result.data.data.reviews,
                service: result.data.data.service,
                ratePerMin: rpm,
                avatar: result.data.data.avatar,
                chatStatus: result.data.data.chat_status,
                profileInfo: result.data.data.description,
                marketingIntro: result.data.data.marketing_intro,
                aboutus: result.data.data.about_us,
                minChatMinutes: result.data.data.min_chat_minutes
            })
        });
        if(localStorage.getItem('clientToken')) {
            axios.get(`${process.env.REACT_APP_BASE_URL}/client/auth/profile`, {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer `+localStorage.getItem('clientToken')
                },  
            }).then(result => {
                setBalance(result.data.data.wallet_balance);
            });
        }  
    }, [params.id]);

    // const [chatRequest, setchatRequest] = useState(false);
    const [chatId, setChatId] = useState(0);

    useEffect(() => {
        if(localStorage.getItem('clientToken')) {
            const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
            var decoded = jwt_decode(localStorage.getItem('clientToken'));
            socket.on('CHAT-CONNECTED', ({ room , user1 , user2 }) => {
            if(user1 === localStorage.getItem('aid') && (user2 === localStorage.getItem('cid'))) {
                navigate(`/chatroom/${decoded.id}/client/${room}`);
                localStorage.setItem('chatstarted',true);
                // setchatRequest(true);
            } else {
                // setchatRequest(false);
            }
            });
            socket.on('CLIENT-CHAT-REJECTED-NOTIFYBACK', ({ client }) => {
                if(client  === localStorage.getItem('cid')) {
                    swal('Hello', "Advisor is busy! Please book time slot to connect with advisor.","error");
                    localStorage.removeItem('timers');
                }
                
            // setchatRequest(false);
            });
            return () => {
            socket.off('CHAT-CONNECTED');
            socket.off('CLIENT-CHAT-REJECTED-NOTIFYBACK');
            }
        }   
    },[]);

    const HandleChatProceed = () => {
        if (localStorage.getItem('clientToken')) {
            var decoded = jwt_decode(localStorage.getItem('clientToken'));
            const data = {
                "advisor_id": params.id,
                "client_id": decoded.id
            }     

            axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisorStatus/${params.id}`).then(result3 => {
                if(result3.data.data[0].chat_engage === 1) {
                    swal('Hello','Advisor is busy right now! you can wait or schedule chat', 'warning');
                } else {
                    setChatId(params.id);
                    // setchatRequest(true);
                  var minChat = values.minChatMinutes === 0 ? 1 : values.minChatMinutes;
                  var minChatAllowed = values.ratePerMin * minChat;

                  if(balance >= minChatAllowed) {
                    const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
                    axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/notification/add`, data).then(result => {
                        socket.emit('NOTIFICATION-SEND', ({advisor:params.id,client:decoded.id, noti_id:result.data.data._id, cl_name:decoded.name, minChat: minChat}));
                        setTimeout(() => {
                            localStorage.setItem('cid', decoded.id);
                            localStorage.setItem('aid', params.id);
                            localStorage.setItem('advisorRate', parseFloat(values.ratePerMin).toFixed(2));
                            localStorage.setItem('username', values.userName);
                            localStorage.setItem('notif_id', result.data.data._id);
                            localStorage.setItem('minChatMinutes', values.minChatMinutes);
                            navigate(`/connecting`);
                        }, 1000);
                    })
                } else {
                    localStorage.setItem('cid', decoded.id);
                    localStorage.setItem('aid', params.id);
                    localStorage.setItem('advisorRate', parseFloat(values.ratePerMin).toFixed(2));
                    localStorage.setItem('username', values.userName);
                    localStorage.setItem('minChatMinutes', values.minChatMinutes);
                    localStorage.setItem("sendrequest", params.id);
                    navigate(`/client/stripe-checkout-chat/5/${decoded.id}/${params.id}`);
                }
              }
            })

        } else {
            localStorage.setItem('chatInitiate', true);
            localStorage.setItem('aid', params.id);
            localStorage.setItem('username', values.userName);
            localStorage.setItem('advisorRate', parseFloat(values.ratePerMin).toFixed(2));
            localStorage.setItem('minChatMinutes', values.minChatMinutes);
            navigate(`/client-signup`);
        }
    }
    
    const addDefaultSrc = (ev) => {
        ev.target.src = `/assets/images/frontend/ad-profile-pic.png`;
    }

    return (
        <div>
            <FrontHeader />
            <div className='Profile pt-6 lg:pt-10 lg:pb-10'>
                <div className='container'>
                    <div className='row'>
                        <div className='col-12 col-lg-9'>
                            <div className='left-section mb-4'>
                                <div className='row'>
                                    <div className='col-12 col-lg-12'>
                                        <div className='advisor-profile-bg'>
                                            <div className='gradient-top'></div>
                                            <div className='advisor-description'>
                                                <div className='row'>
                                                    <div className='col-6 col-lg-4'>
                                                       {
                                                         values.avatar !== '' &&  <img src={`${process.env.REACT_APP_BASE_URL}/${values.avatar}`} onError = {addDefaultSrc} alt='' className='mx-auto ad-profile-pic' />
                                                       }
                                                       
                                                           
                                                    </div>
                                                    <div className='col-6 col-lg-8'>
                                                    
                                                        <div className='p-rating text-right mt-4 mr-4'>
                                                        
                                                            <div className="flex items-center justify-end">
                                                                {[...new Array(5)].map((arr, index) => {
                                                                    return index < parseInt(values.ratingAvg) &&
                                                                        <svg key={index} aria-hidden="true" className="w-4 h-4 m-0 p-0 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>{index + 1} star</title><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                                                })}
                                                                
                                                                {(values.ratingAvg > parseInt(values.ratingAvg)) &&
                                                                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-4 h-4 m-0 p-0 text-gray-900 halfstar" viewBox="0 0 20 20">
                                                                        <path d="M5.354 5.119 7.538.792A.516.516 0 0 1 8 .5c.183 0 .366.097.465.292l2.184 4.327 4.898.696A.537.537 0 0 1 16 6.32a.548.548 0 0 1-.17.445l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256a.52.52 0 0 1-.146.05c-.342.06-.668-.254-.6-.642l.83-4.73L.173 6.765a.55.55 0 0 1-.172-.403.58.58 0 0 1 .085-.302.513.513 0 0 1 .37-.245l4.898-.696zM8 12.027a.5.5 0 0 1 .232.056l3.686 1.894-.694-3.957a.565.565 0 0 1 .162-.505l2.907-2.77-4.052-.576a.525.525 0 0 1-.393-.288L8.001 2.223 8 2.226v9.8z"/>
                                                                    </svg>
                                                                }

                                                                {[...new Array(4)].map((arr, index) => {
                                                                    return index >= parseInt(values.ratingAvg) &&
                                                                        <svg key={index} aria-hidden="true" className="w-4 h-4 m-0 p-0 text-gray-300 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Fifth star</title><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                                                })}
                                                                <p className="mr-2 font-medium text-black mb-0 text-xl" style={{display: 'none'}}>{values.ratingAvg}</p>
                                                                <p>
                                                                {values.chatStatus ? <img src='/assets/images/frontend/chat-green.svg' className='chat-icon' alt="We chat" /> :
                                                                    <img src='/assets/images/frontend/chat-gray.svg' className='chat-icon' alt='chat-icon' />
                                                                }
                                                                    
                                                                </p>
                                                                <span className='text-black fsp-14 font-normal ml-2'>({values.chatCount} Chats Completed)</span>
                                                            </div>

                                                        </div>
                                                        <div className='chatbutton text-right mx-4'>
                                                        {values.chatStatus

                                                        ? <a onClick={HandleChatProceed} className="btn btn-primary px-3 py-2 pt-3 ffp font-bold rounded-2 mt-2 fsp-18 online-button" href='#?'>
                                                            {/* {
                                                      chatRequest && chatId === params.id ?
                                                      
                                                      <>
                                                         <h3>Connecting...</h3>
                                                         <h4>Waiting for advisor to <br/>accept the chat</h4>
                                                      </>
                                                      
                                                      : "Online - Let's Chat"
                                                    } */}
                                                    Online - Let's Chat
                                                            </a>
                                                        : <a href='#?' className="btn btn-default pt-3 ffp font-bold rounded-2 mt-2 fsp-18 online-button">Offline - Chat Later</a>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='col-12 col-lg-12 px-4 mt-4 mb-1'>
                                                    <h1>{values.displayname}</h1>
                                                </div>

                                                <div className='discription px-4 mb-3 admeDiv'>
                                                    <h4 className='adme'>About Me</h4>
                                                    <p className='fsp-14 DP-lineheight'>{values.profileInfo}</p>
                                                </div>

                                                <div className='discription px-4 mb-3'>
                                                    <p className='fsp-14 text-base DP-lineheight'>{values.marketingIntro}</p>
                                                </div>
                                                <div className='discription px-4 mt-4 mb-3'>
                                                    
                                                    <p className='fsp-14 DP-lineheight'>{values.aboutus}</p>
                                                </div>
                                                <div className=' border-b bg-gray-300 mt-4 mb-4'></div>
                                                <div className='profileheadinginfo px-4 mt-3'>
                                                <h3 className='text-pink font-semibold text-lg fsp-24 mb-3'>My Services</h3>
                                                    {values.service && values.service.name1 &&
                                                        
                                                            <div className='column'>
                                                                <h3 className='text-black text-base font-semibold text-left'>{(values.service.name1)}</h3>
                                                                <p className='fsp-14 DP-lineheight mb-0'>{(values.service.description1)}</p>
                                                            </div>
                                                        
                                                    }

                                                    {values.service && values.service.name1 &&
                                                        
                                                            <div className='column'>
                                                                <h3 className='text-black text-base font-semibold text-left'>{(values.service.name2)}</h3>
                                                                <p className='fsp-14 DP-lineheight mb-0'>{(values.service.description2)}</p>
                                                            </div>
                                                        
                                                    }

                                                    {values.service && values.service.name1 &&
                                                        
                                                            <div className='column'>
                                                                <h3 className='text-black text-base font-semibold text-left'>{(values.service.name3)}</h3>
                                                                <p className='fsp-14 DP-lineheight mb-0'>{(values.service.description3)}</p>
                                                            </div>
                                                        
                                                    }
                                                </div>
                                            </div>
                                            <div className='gradient-bottom'></div>
                                        </div>


                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-12 col-lg-3'>
                            <div className='right-section'>
                                <div className='mycard shadow-md rounded-lg mb-4'>
                                    <div className='row pt-3 p-2'>
                                        <div className='col-7 col-lg-7'>
                                            <h6 className='text-black font-bold text-base'>My Rate</h6>
                                            <span className='text-pink font-semibold text-right text-base text-sm font-normal text-gray-400'>${parseFloat(values.ratePerMin).toFixed(2)} /min</span>
                                        </div>
                                        {/* <div className='col-5 col-lg-5 pl-1'>
                                            <h6 className='text-pink font-semibold text-right text-base'>${parseFloat(values.ratePerMin).toFixed(2)} /min</h6>
                                        </div> */}
                                    </div>
                                </div>
                                <div className='mycard shadow-md rounded-lg mb-4 p-1.5 pt-3 pb-3'>
                                    <h6 className='text-black text-base font-bold text-center mb-3'>Reviews</h6>
                                    {values.reviews && values.reviews?.map((item, index) => (
                                        <div key={index}>
                                            <article className='mb-4'>
                                                <div className="flex items-center mb-3 space-x-4 w-auto">

                                                    <div className="space-y-1 font-medium dark:text-white ml-1 w-full">
                                                        <p className='mb-0'>{item.client_name}</p>
                                                        <div className="flex items-center mb-1">
                                                            {[...Array(item.rating)].map((star, index) => {
                                                                return (<svg key={index} aria-hidden="true" className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>{star} star</title><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>)
                                                            })}
                                                        </div>
                                                    </div>
                                                    <p style={{minWidth: "72px"}} className=' text-gray-400 mb-0 text-xs ml-0 mt-0 italic'>{moment(item.createdAt).format("YYYY-MM-DD")}</p>
                                                </div>
                                                <p className="mb-2 font-light text-gray-500 dark:text-gray-400">{item.review}</p>
                                            </article>
                                            <div className='hr'></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FrontFooter />
        </div>
    )
}
