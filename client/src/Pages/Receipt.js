import React, { useEffect } from 'react'
import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'
import moment from 'moment';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import swal from 'sweetalert';
import { Link  , useParams} from 'react-router-dom';
import {io} from 'socket.io-client';
import { getAidFromStorageToken, getCidFromStorageToken } from '../Utils/storageHelper';


export default function Receipt() {

    const params = useParams();

    useEffect(() => {
        
            if(localStorage.getItem('TERMINATE_CHAT_BY_INACTIVITY') && localStorage.getItem('TERMINATE_CHAT_BY_INACTIVITY') === 'service') {    
                const client = localStorage.getItem('TERMINATE_CHAT_BY_INACTIVITY') === 'client' ? getCLientId() : localStorage.getItem('cid');
                const advisor = localStorage.getItem('TERMINATE_CHAT_BY_INACTIVITY') === 'service' ? getAdvisorId() : localStorage.getItem('aid');
                localStorage.removeItem('WAIT_TIME');
                axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${client}/${advisor}`).then(result => { 
                      const data = {
                        from: client,
                        to: advisor
                      }

                      axios.delete(`${process.env.REACT_APP_BASE_URL}/chat/deletemsg`, {
                        data
                      }).then(result => {
                            const data_data = {
                                "chat_engage": 0,
                                "advisor_id": advisor
                            }
                     
                            axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-engage-status-client`, data_data, {
                                headers: {
                                    'Accept': 'application/json, text/plain, */*',
                                    'Content-Type': 'application/json',
                                },
                            }).then(result => {
                                    axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/timers/${client}/${advisor}`).then(result => {
        
                                    });
        
                            }).catch(err => {
                                
                            });
                      });
                });


                    if(localStorage.getItem('promo_amount') && localStorage.getItem('promo_amount') != 0 && !localStorage.getItem('client_added')) {
                        localStorage.setItem('client_added', true);
                        var res_amot = localStorage.getItem('promo_amount') ? localStorage.getItem('promo_amount') : 0;
                        localStorage.removeItem('timers');
                        var time_start = moment(localStorage.getItem('StartTime'),'HH:mm:ss A');
                        var time_end = moment(localStorage.getItem('EndTime'),'HH:mm:ss A');
                        var duration = Math.abs(time_end.diff(time_start,'seconds') - parseInt(60));

                        var actualMinute = parseFloat((duration / 60)* localStorage.getItem('advisorRate')).toFixed(2);
                        var chatAmount = 0;

                        if(res_amot) {
                            chatAmount = parseFloat(res_amot) - actualMinute;
                        }

                        const data_up_promo = {
                            'client_id': client,
                            'advisor_id': advisor,
                            'chatAmount': Math.sign(chatAmount) === -1 ? 0 : chatAmount,
                            'duration': duration 
                         }
                        localStorage.removeItem('promo_amount');
                        axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/clients/updatePromoAmount` , data_up_promo).then(result => {
                          localStorage.removeItem('promo_amount');
                        }) 
                    }

                      localStorage.removeItem('TERMINATE_CHAT_BY_INACTIVITY');
                      const data_update_chat = {
                        "client_id": client,
                        "chat_status" :0
                      }
                  
                        axios.put(`${process.env.REACT_APP_BASE_URL}/client/update-chat-status`, data_update_chat ).then(result => {
                
                        })
                      
            }

            if(localStorage.getItem('TERMINATE_CHAT_BY_INACTIVITY') && localStorage.getItem('TERMINATE_CHAT_BY_INACTIVITY') === 'client'  && !localStorage.getItem('termiadded')) {   
                const client = localStorage.getItem('TERMINATE_CHAT_BY_INACTIVITY') === 'client' ? getCLientId() : localStorage.getItem('cid');
                const advisor = localStorage.getItem('TERMINATE_CHAT_BY_INACTIVITY') === 'service' ? getAdvisorId() : localStorage.getItem('aid'); 
                var res_amot = localStorage.getItem('promo_amount') ? localStorage.getItem('promo_amount') : 0;
                var time_start = moment(localStorage.getItem('StartTime'),'HH:mm:ss A');
                var time_end = moment(localStorage.getItem('EndTime'),'HH:mm:ss A');
                var duration = Math.abs(time_end.diff(time_start,'seconds') - parseInt(60));
                debugger;
                var actualMinute = parseFloat((duration / 60)* localStorage.getItem('advisorRate')).toFixed(2);
                var chatAmount = 0;
    
                if(res_amot) {
                  chatAmount = actualMinute - parseFloat(res_amot);
                }
    
                const data = {
                    "client_id": client,
                    "advisor_id": advisor,
                    "chat_date": moment().format('L'),
                    "chat_start_time": localStorage.getItem('StartTime'),
                    "chat_end_time":localStorage.getItem('EndTime'),
                    "advisor_rate": localStorage.getItem('advisorRate'),
                    "commission_rate": localStorage.getItem('comm_rate') === "undefined" ? 0 : localStorage.getItem('comm_rate'),
                    "free_minutes": localStorage.getItem('FreeExpire') ? 1 : 0,
                    "chat_time": calculateTotalTime(localStorage.getItem('EndTime'),localStorage.getItem('StartTime')),
                    'chatAmount': res_amot > actualMinute ? 0 : (Math.abs(actualMinute - parseFloat(res_amot)))
                }

                axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/earnings`, data ,{
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json',
                    },
              }).then(result => {
                    localStorage.setItem('termiadded', true);
                    localStorage.removeItem('TERMINATE_CHAT_BY_INACTIVITY');
                    localStorage.removeItem('WAIT_TIME');
                    var res_amot = localStorage.getItem('promo_amount') ? localStorage.getItem('promo_amount') : 0;

                    localStorage.removeItem('timers');
                    var time_start = moment(localStorage.getItem('StartTime'),'HH:mm:ss A');
                    var time_end = moment(localStorage.getItem('EndTime'),'HH:mm:ss A');
                    var duration = time_end.diff(time_start,'seconds');

                    var actualMinute = parseFloat((duration / 60)* localStorage.getItem('advisorRate')).toFixed(2);
                    const payout_data = {
                        'amount': res_amot > actualMinute ? 0 :  (Math.abs(actualMinute - parseFloat(res_amot))),
                        'advisor_id': advisor,
                        "connect_id": localStorage.getItem('stripe_customer_id'),
                        "username": localStorage.getItem('username')
                    }

                    if(res_amot < actualMinute) {
                        localStorage.removeItem('promo_amount');
                        axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/earnings/payout`, payout_data, {
                             headers: {
                              'Accept': 'application/json, text/plain, */*',
                              'Content-Type': 'application/json'
                            },
                        }).then(result => {
                             localStorage.removeItem('WAIT_TIME');
                                               
                             }).catch(err => {
                             });
                     } else {
                            localStorage.removeItem('promo_amount');
                            localStorage.removeItem('WAIT_TIME');
                    }
              });

              const data_update_chat = {
                "client_id": client,
                "chat_status" :0
              }
          
                axios.put(`${process.env.REACT_APP_BASE_URL}/client/update-chat-status`, data_update_chat ).then(result => {
        
                });

            }

        },[]);
      

    function getCLientId() {
        var client_id = getCidFromStorageToken();
        return client_id.id;
    }

    function getAdvisorId() {
        var advisor_id = getAidFromStorageToken();
        return advisor_id.id;
    }

    useEffect(() => {
        localStorage.removeItem('oid');
        localStorage.removeItem('notif_id');
        localStorage.removeItem('prevtimer');
        localStorage.removeItem('newRate');
        localStorage.removeItem('oldbalance');
        localStorage.removeItem('newTimers');
        localStorage.removeItem('advisor_to_chat');
        localStorage.removeItem('continueChat');
        localStorage.removeItem('start-balance');
        localStorage.removeItem('WAIT_TIME');
        if(localStorage.getItem('clientToken')) {
            const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
            socket.emit('NOTIFY-TO-ADVIOR-TIMERS' , ({ advisor: localStorage.getItem('aid'),
            client: getCLientId , startTime: localStorage.getItem('StartTime') , endTime: localStorage.getItem('EndTime') }));

           axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${getCLientId()}/${localStorage.getItem('aid')}`).then(result => { 

            const data = {
                from: getCLientId(),
                to: localStorage.getItem('aid')
              }
              axios.delete(`${process.env.REACT_APP_BASE_URL}/chat/deletemsg`, {
                data
              }).then(result => {
                    const data_data = {
                        "chat_engage": 0,
                        "advisor_id": localStorage.getItem('aid')
                    }
             
                    axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-engage-status-client`, data_data, {
                        headers: {
                            'Accept': 'application/json, text/plain, */*',
                            'Content-Type': 'application/json',
                        },
                    }).then(result => {
                            axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/timers/${getCLientId()}/${localStorage.getItem('aid')}`).then(result => {

                            });

                    }).catch(err => {
                        
                    });
              });
           });

           const data_update_chat = {
            "client_id": getCLientId(),
            "chat_status" :0
          }
      
            axios.put(`${process.env.REACT_APP_BASE_URL}/client/update-chat-status`, data_update_chat ).then(result => {
    
            })

           if(localStorage.getItem('promo_amount') && localStorage.getItem('promo_amount') != 0 && !localStorage.getItem('client_added')) {
            localStorage.setItem('client_added', true);
            var res_amot = localStorage.getItem('promo_amount') ? localStorage.getItem('promo_amount') : 0;
            localStorage.removeItem('timers');
            var time_start = moment(localStorage.getItem('StartTime'),'HH:mm:ss A');
            var time_end = moment(localStorage.getItem('EndTime'),'HH:mm:ss A');
            var duration = time_end.diff(time_start,'seconds');

            var actualMinute = parseFloat((duration / 60)* localStorage.getItem('advisorRate')).toFixed(2);
            var chatAmount = 0;

            if(res_amot) {
              chatAmount = parseFloat(res_amot) - actualMinute;
            }

            const data_up_promo = {
              'client_id': getCLientId(),
              'advisor_id': localStorage.getItem('aid'),
              'chatAmount': Math.sign(chatAmount) === -1 ? 0 : chatAmount,
              'duration': duration 
           }
             localStorage.removeItem('promo_amount');
             axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/clients/updatePromoAmount` , data_up_promo).then(result => {
                localStorage.removeItem('promo_amount');
            }) 
          }

        }

        if(!localStorage.getItem('advisorToken')) {
            localStorage.removeItem('WAIT_TIME');
        }

        if(localStorage.getItem('advisorToken') && !localStorage.getItem('added')) {
            setTimeout(() => {

            window.location.href = '/advisor/dashboard';
            },5000);
            localStorage.removeItem('newTimers');
            localStorage.setItem('added', true);

            var res_amot = localStorage.getItem('promo_amount') ? localStorage.getItem('promo_amount') : 0;
            var time_start = moment(localStorage.getItem('StartTime'),'HH:mm:ss A');
            var time_end = moment(localStorage.getItem('EndTime'),'HH:mm:ss A');
            var duration = time_end.diff(time_start,'seconds');

            var actualMinute = parseFloat((duration / 60)* localStorage.getItem('advisorRate')).toFixed(2);
            var chatAmount = 0;

            if(res_amot) {
              chatAmount = actualMinute - parseFloat(res_amot);
            }

            const data = {
                "client_id": localStorage.getItem('cid'),
                "advisor_id": getAdvisorId(),
                "chat_date": moment().format('L'),
                "chat_start_time": localStorage.getItem('StartTime'),
                "chat_end_time":localStorage.getItem('EndTime'),
                "advisor_rate": localStorage.getItem('advisorRate'),
                "commission_rate": localStorage.getItem('comm_rate'),
                "free_minutes": localStorage.getItem('FreeExpire') ? 1 : 0,
                "chat_time": calculateTotalTime(localStorage.getItem('EndTime'),localStorage.getItem('StartTime')),
                'chatAmount': res_amot > actualMinute ? 0 : (Math.abs(actualMinute - parseFloat(res_amot)))
            }

            axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/earnings`, data ,{
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer `+localStorage.getItem('advisorToken')
                },
          }).then(result => {
             localStorage.setItem('added', true);
             localStorage.removeItem('WAIT_TIME');
                    const data_data = {
                        "chat_engage": 0,
                        "advisor_id": getAdvisorId()
                    }
             
                    axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-engage-status-client`, data_data, {
                        headers: {
                            'Accept': 'application/json, text/plain, */*',
                            'Content-Type': 'application/json',
                        },
                    }).then(result => {
                                        // Payout

                                        var res_amot = localStorage.getItem('promo_amount') ? localStorage.getItem('promo_amount') : 0;

                                        localStorage.removeItem('timers');
                                        var time_start = moment(localStorage.getItem('StartTime'),'HH:mm:ss A');
                                        var time_end = moment(localStorage.getItem('EndTime'),'HH:mm:ss A');
                                        var duration = time_end.diff(time_start,'seconds');

                                        var actualMinute = parseFloat((duration / 60)* localStorage.getItem('advisorRate')).toFixed(2);
                                        const payout_data = {
                                            'amount': res_amot > actualMinute ? 0 :  (Math.abs(actualMinute - parseFloat(res_amot))),
                                            'advisor_id': getAdvisorId(),
                                            "connect_id": localStorage.getItem('stripe_customer_id'),
                                            "username": localStorage.getItem('username')
                                        }

                                        if(res_amot < actualMinute) {
                                            localStorage.removeItem('promo_amount');
                                            axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/earnings/payout`, payout_data, {
                                                headers: {
                                                    'Accept': 'application/json, text/plain, */*',
                                                    'Content-Type': 'application/json'
                                                },
                                            }).then(result => {
                                                const data_update_chat = {
                                                    "client_id": localStorage.getItem('cid'),
                                                    "chat_status" :0
                                                  }
                                              
                                                    axios.put(`${process.env.REACT_APP_BASE_URL}/client/update-chat-status`, data_update_chat ).then(result => {
                                            
                                                    });
                                                localStorage.removeItem('WAIT_TIME');
                                                swal("success",'Payout has been processed',"success");
                                            }).catch(err => {
                                                swal("Hello",err.response.data.error.message,"error");
                                            });
                                            // Payout
                                        } else {
                                            const data_update_chat = {
                                                "client_id": localStorage.getItem('cid'),
                                                "chat_status" :0
                                              }
                                          
                                                axios.put(`${process.env.REACT_APP_BASE_URL}/client/update-chat-status`, data_update_chat ).then(result => {
                                        
                                                });
                                            localStorage.removeItem('promo_amount');
                                            localStorage.removeItem('WAIT_TIME');
                                        }
    
                    }).catch(err => {
                        
                    });

         }).catch(err => {})
      } else {
        localStorage.removeItem('WAIT_TIME');
      }
    },[]);

    function calculateTotalTime(t1,t2) {
        localStorage.removeItem('timers');
        // var time_start = moment(t2,'HH:mm:ss A');
        // var time_end = moment(t1,'HH:mm:ss A');
        var time_start = new Date(t2);
        var time_end = new Date(t1);
        var duration = Math.floor((time_end.getTime() - time_start.getTime()) / 1000);
        // var duration = time_end.diff(time_start,'seconds');
        return duration;
    }

    function calculateTotalTimeIntoWords(t1,t2) {
        localStorage.removeItem('timers');
        var time_start = moment(t2,'HH:mm:ss A');
        var time_end = moment(t1,'HH:mm:ss A');
        var duration = time_end.diff(time_start,'seconds');
        if(duration >= 60) {
            var cl = formatSeconds(duration);
            var co = cl.split(":", 2);
            return co[0] + ' Minute ' + co[1] + " Seconds";
           // return formatSeconds(duration)
        } else {
            return duration+' Seconds';
        }
    }

    function Earning(t1,t2) {
        var duration = calculateTotalTime(t1,t2);
        var actual = 1;
        var promo = 1;
        if(localStorage.getItem('promo_amount') && localStorage.getItem('promo_amount') != 0) {
            actual = parseFloat(localStorage.getItem('promo_amount') * 60 / localStorage.getItem('advisorRate')).toFixed(2) - duration;
            promo = parseFloat(localStorage.getItem('promo_amount') * 60 / localStorage.getItem('advisorRate')).toFixed(2);
            if(promo > duration) {
                actual = 0;
            } else if(Math.sign(actual) === -1) {
                actual = duration - promo;
            } else {
                actual = duration;
            }
        } else {
            actual = duration;
        }
        
        var Income = parseFloat((actual / 60)* localStorage.getItem('advisorRate')).toFixed(2);
        return Income;
    }

    // function Earning(t1,t2) {
    //     var duration = calculateTotalTime(t1,t2);
    //     var actual = 1;
    //     if(localStorage.getItem('FreeExpire')) {
    //         actual = duration - 1800;
    //         if(Math.sign(actual) === -1) {
    //             actual = 0;
    //         } else {
    //             actual = duration;
    //         }
    //     } else if(localStorage.getItem('promo_amount') && localStorage.getItem('promo_amount') != 0) {
    //         actual = duration - parseFloat(localStorage.getItem('promo_amount') * 60 / localStorage.getItem('advisorRate')).toFixed(2);
    //         if(Math.sign(actual) === -1) {
    //             actual = 0;
    //         } else {
    //             actual = duration;
    //         }
    //     } else {
    //         actual = duration;
    //     }

    //     console.log(duration);
    //     return;
        
    //     var Income = parseFloat((actual / 60)* localStorage.getItem('advisorRate')).toFixed(2);
    //     return Income;
    // }

     function formatSeconds(s) {
        let minutes = ~~(s / 60);
        let seconds = ~~(s % 60);
        return minutes + ':' + seconds;
      }

  return (
    <div>
        <FrontHeader/>
        <section className="mt-0 privacypage" >
                <div className="container">
                    <div className="row">
                        <div className='col-12 col-lg-12'>
                            <div className='chatreceipt'>
                                <h1 className="fw-400 fs-re-55 text-center mb-3"><span className=" font-semibold text-pink">SUMMARY</span></h1>
                                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:text-gray-400">
                                            <tr>
                                                <th scope="col" colSpan={2} className="px-6 py-3 text-base font-semibold bg-gray-50 text-black text-left">
                                                    Last Chat
                                                </th>
                                                {/* <th scope="col" className="px-6 py-3 text-base font-semibold bg-gray-50 text-black text-left">
                                                    
                                                </th> */}
                                                <th scope="col" className="px-6 py-3 text-base font-semibold bg-gray-50     text-black text-right">
                                                    Date: {moment().format("MMM DD, YYYY")}
                                                </th>
                                            
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                
                                                <td className="px-6 py-4 text-base text-gray-500">
                                                Start Time: {new Date(localStorage.getItem('StartTime')).toLocaleString()}
                                                </td>
                                                {/* <td className="px-6 py-4 text-right text-base text-gray-500">
                                                    {
                                                        localStorage.getItem('FreeExpire') && 'Free Minutes Applied'
                                                    }
                                                </td> */}
                                                <td className="px-6 py-4 text-right text-base text-gray-500">
                                                    {
                                                        localStorage.getItem('promo_amount') && localStorage.getItem('promo_amount') != 0 && 'Promotion Balance applied'
                                                    }
                                                </td> 
                                                <td className="px-6 py-4 text-right text-base text-gray-500">
                                                    End Time: {new Date(localStorage.getItem('EndTime')).toLocaleString()}
                                                </td>
                                                
                                            </tr>
                                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            
                                                <>
                                                    <td colSpan={2} className="px-6 py-4 text-left text-base text-gray-500">
                                                        Advisor Rate: ${parseInt(localStorage.getItem('advisorRate')).toFixed(2)}
                                                    </td>
                                                    { localStorage.getItem('advisorToken') &&
                                                        <td className="px-6 py-4 text-right text-base text-gray-500">
                                                        Earnings:  ${ Earning(localStorage.getItem('EndTime'),localStorage.getItem('StartTime')) }
                                                         </td>
                                                    }
                                                    { localStorage.getItem('clientToken') &&
                                                        <td className="px-6 py-4 text-right text-base text-gray-500">
                                                        Deduct:  ${ Earning(localStorage.getItem('EndTime'),localStorage.getItem('StartTime')) }
                                                         </td>
                                                    }
                                                    
                                                    {/* <td className="px-6 py-4 text-right text-base text-gray-500">
                                                        Total Time Spent:  { calculateTotalTimeIntoWords(localStorage.getItem('EndTime'),localStorage.getItem('StartTime')) }
                                                    </td> */}
                                                </>
                                            
                                            
                                            </tr>
                                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <td colSpan={3} className="px-3 py-3 text-center">
                                                {
                                                    localStorage.getItem('advisorToken') ?
                                                    <Link to="/advisor/dashboard" className="btn btn-purple bold-button px-5 py-2 ffp rounded-5 fsp-15" type='button' 
                                                    > Back to Dashboard
                                                    </Link>
                                                    :
                                                    <Link to="/client/dashboard" className="btn btn-purple bold-button px-5 py-2 ffp rounded-5 fsp-15" type='button' 
                                                    > Back to Dashboard
                                                    </Link>
                                                }
                                                </td>
                                            </tr>
                                            
                                        </tbody>
                                    </table>
                                </div>
                        </div>   
                        </div>
                        {/* <div className="col-12 col-md-6 px-4">
                            <div className="py-lg-5 pe-lg-5">
                                <h1 className="fw-400 fs-re-55"><span className="fw-bold text-pink">SUMMARY</span><br /> Last Chat</h1>
                                <p className="fsp-18 pe-lg-5">
                                Date: {moment().format("DD/MM/YYYY")}<br/><br/>
                                    Start Time: {localStorage.getItem('StartTime')}<br/>
                                    End Time: {localStorage.getItem('EndTime')}<br/>
                                    <hr />  
                                  
                                    {
                                        localStorage.getItem('FreeExpire') && 'Free Minutes Applied'
                                    }
                                     <br/><br/>
                                    Total Time:  { calculateTotalTimeIntoWords(localStorage.getItem('EndTime'),localStorage.getItem('StartTime')) } <br/><br/>
                                    { localStorage.getItem('advisorToken') &&
                                        <>
                                          Advisor Rate: {localStorage.getItem('advisorRate')}<br/><br/>
                                            Earnings:  ${ Earning(localStorage.getItem('EndTime'),localStorage.getItem('StartTime')) } <br/><br/> 
                                         
                                        </>
                                       
                                    } 
                                    {
                                        localStorage.getItem('advisorToken') ?
                                        <a href="/advisor/dashboard" className="btn btn-purple bold-button mt-4 px-5 py-2 ffp rounded-5 fsp-15" type='button' 
                                        > Back to Dashboard
                                        </a>
                                        :
                                        <a href="/client/dashboard" className="btn btn-purple bold-button mt-4 px-5 py-2 ffp rounded-5 fsp-15" type='button' 
                                        > Back to Dashboard
                                        </a>
                                    }
                                     
                                </p>
                            </div>
                        </div> */}
                    </div>
                </div>
            </section>
        <FrontFooter/>
      
    </div>
  )
}
