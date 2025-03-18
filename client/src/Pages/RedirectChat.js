import React  , { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'
import jwt_decode from "jwt-decode";
import axios from 'axios';
import swal from 'sweetalert';
import {io} from 'socket.io-client';

export default function RedirectChat() {
    const navigate = useNavigate();
    const params = useParams();


    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BASE_URL}/admin/redirect-to-chat/${params.id}`).then(result1 => {

            if (localStorage.getItem('clientToken')) {
                var decoded = jwt_decode(localStorage.getItem('clientToken'));
                const data = {
                    "advisor_id": result1.data.data.aid,
                    "client_id": decoded.id
                }

                axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisorStatus/${result1.data.data.aid}`).then(result3 => {
                    if(result3.data.data[0].chat_engage === 1) {
                        swal('Hello','Advisor is busy right now! you can wait or schedule chat', 'warning');

                    } else {

                        const min_chat_minutes = result1.data.min_chat_minutes == '0' ? 5 : result1.data.min_chat_minutes;

                        const ratePerminute = result1.data.discontAmt === 0 ? result1.data.rate_per_min : result1.data.discontAmt;

                        const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
                        axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/notification/add`, data).then(result => {
                            socket.emit('NOTIFICATION-SEND', ({advisor:result1.data.data.aid,client:decoded.id, noti_id:result.data.data._id, cl_name:decoded.name, minChat: min_chat_minutes}));
                            setTimeout(() => {
                                localStorage.setItem('cid', decoded.id);
                                localStorage.setItem('aid', result1.data.data.aid);
                                localStorage.setItem('advisorRate', ratePerminute);
                                localStorage.setItem('username', result1.data.data.aname);
                                localStorage.setItem('notif_id', result.data.data._id);
                                localStorage.setItem('minChatMinutes', min_chat_minutes);
                                // window.location.href = result1.data.link;
                                window.location.href = '/connecting';
                            }, 1000);
                        })
                    }
                })

            } else {


                const min_chat_minutes = result1.data.min_chat_minutes == '0' ? 5 : result1.data.min_chat_minutes;
                const ratePerminute = result1.data.discontAmt === 0 ? result1.data.rate_per_min : result1.data.discontAmt;

                localStorage.setItem('chatInitiate', true);
                localStorage.setItem('aid', result1.data.data.aid);
                localStorage.setItem('username', result1.data.data.aname);
                localStorage.setItem('advisorRate', ratePerminute);
                localStorage.setItem('minChatMinutes', min_chat_minutes);
                window.location.href = '/client-login'
            }

        }).catch(err => {
            swal('Hello', err.response.data.message, 'error');
        });
    }, [params.id, navigate]);



    return (
        <div>
            <FrontHeader />
            <>
                <div>
                    validating..........
                </div>


            </>
            <FrontFooter />
        </div>
    )
}
