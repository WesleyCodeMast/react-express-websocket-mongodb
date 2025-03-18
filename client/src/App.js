import React, { useEffect, useState } from 'react';
import Routesdata from './Routes/index';
import {
  QueryClient,
  QueryClientProvider,
} from 'react-query';
import axios from 'axios';
import {io} from 'socket.io-client';
import swal from 'sweetalert';
import jwtDecode from 'jwt-decode';
import $ from 'jquery';
import { getAidFromStorageToken } from './Utils/storageHelper';
import CAlert from './Components/CAlert';
import { IPhoneContext } from './Context/DeviceContext';
import { ActionButton } from './Components/Loading';

function App() {
  const [isiPhone, setIsiPhone] = useState(false);
  const queryClient = new QueryClient();
  const [showPopup, setshowPopup] = useState(false);
  const [advisor, setAdvisor] = useState('');
  const [client, setClient] = useState('');
  const [noti_id, setnoti_id] = useState('');
  const [cl_name, setClName] = useState('');
  const [audio, setAudio] = useState(null);
  const [loadingAccept, setLoadingAccept] = useState(false);
  useEffect(() => {
    var a = document.getElementById("idAudio");
    setAudio(a);
    // check iphone
        var isiPhone = /iPhone/i.test(navigator.userAgent);
        var isiPad = /iPad/i.test(navigator.userAgent);
        if(isiPhone || isiPad) {
          setIsiPhone(true);
        }
        else 
          setIsiPhone(false);
    
    const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
    if(localStorage.getItem('advisorToken')) {
      // when advisor receive this socket action from client
      socket.on('NOTIFICATION-SEND-TO-ADVISOR', ({ advisor, client, noti_id, cl_name,minChat }) => {
        let adv = getAidFromStorageToken();
        if(adv && !showPopup && advisor === adv.id) {
          // $("#playsound").trigger('click');  
          let aud = document.getElementById("idAudio");
          aud.muted = true;
          if(aud)
            aud.play();
          setshowPopup(true);
          setAdvisor(advisor);
          setClient(client);
          setnoti_id(noti_id);
          setClName(cl_name);
          localStorage.setItem('cid',client);
          localStorage.setItem('notif_id', noti_id);
          localStorage.setItem('clientName',cl_name);
          localStorage.setItem('minChatMinutes', minChat);
        }
      });

      socket.on('CLIENT-CHAT-HANGUP-NOTIFYBACK', ({ advisor })  => {
        const adv = getAidFromStorageToken();

        if(advisor === adv.id) {
            setshowPopup(false);
            localStorage.removeItem('timers');
            swal('warning', "Hello! Client Hangup the chat.","error");
            
            setTimeout(() => {
              window.location.href = window.location.href;
            },2000);
        }
      });
      
      return () => {
        socket.off('NOTIFICATION-SEND-TO-ADVISOR');
        socket.off('CLIENT-CHAT-HANGUP-NOTIFYBACK');
      }
    }
  }, [])
  useEffect(() => {

  },[showPopup, advisor, client, noti_id, cl_name, audio]);
  function playaudio() {
    audio.muted = false;
    audio.play();
  }

  function stopaudio() {
    audio.pause();
    audio.currentTime = 0;
  }

  const ChatAccepted = async (id, cid, noti_id) => {
    setLoadingAccept(true);
    localStorage.setItem('aid', id);
    localStorage.setItem('cid', cid);
    localStorage.setItem('notif_id', noti_id);
    localStorage.setItem('continueChat',true);
    $("#pausesound").trigger('click');
    await axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/get-client-online-status/${cid}`, {
      headers: {
          'Content-Type': 'application/json',
      },
    }).then(async result => {

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
            await axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-engage-status`, data_update , {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer `+localStorage.getItem('advisorToken')
                },  
            }).then(async result => { 
                const data_update_chat = {
                  "client_id": cid,
                  "chat_status" :1
                }
                
                await axios.put(`${process.env.REACT_APP_BASE_URL}/client/update-chat-status`, data_update_chat ).then(result => {
        
                }).catch(error => {});

                await axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/add-clients-advisors`, data).then(result2 => {
                    window.location.href = `/chatroom/${id}/service/${localStorage.getItem('username')}`;
                }).then(async resul => {
                  const datadelete = {
                    from: localStorage.getItem('cid'),
                    to: localStorage.getItem('aid')
                  }
                  await axios.delete(`${process.env.REACT_APP_BASE_URL}/chat/deletemsg`, {
                    datadelete
                  }).then(resultres => { }).catch(error => {});
                }).catch(error => {})
            }).catch(error => {})
            setLoadingAccept(false);
            return () => {
                socket.off('CHAT-INITIATE');
            }
        } else {
            axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/notification/delete/${noti_id}`).then(result => {
              // swal('error', "Hello!, Client is offline now","error");
            }).catch(error => {});
            // swal('error', "Hello!, Client is offline now","error");
        }
    }).catch(error => {});

}

const chatRejected = (noti_id) => {
    localStorage.removeItem('notif_id');
    localStorage.removeItem('continueChat');
    setshowPopup(false);
    const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
    const advisor_id = getAidFromStorageToken();
    socket.emit('CLIENT-CHAT-REJECTED', ({ advisor : advisor_id.id }));
    $("#pausesound").trigger('click');
    axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/notification/delete/${noti_id}`).then(result => {
        const data_update = {
            "chat_engage": 0
        }
        axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-engage-status`, data_update, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
            },  
        }).then(result => {  
            setTimeout(() => {
                swal('success', 'Request is rejected successfully', 'success');
                window.location.reload();
            },1000);
        }).catch(error => {})
    }).catch(error => {})
    return () => {
        socket.off('CLIENT-CHAT-REJECTED');
    }
}

  return (
    <QueryClientProvider client={queryClient}>
      <IPhoneContext.Provider value={isiPhone}>
        <Routesdata />
      </IPhoneContext.Provider>
      <audio id = "idAudio">
        <source src = "../assets/images/incoming_call.mp3" type = "audio/ogg" />
        <source src = "../assets/images/incoming_call.mp3" type ="audio/mpeg" />
      </audio>
      <button type="button" id="playsound" onClick={playaudio} style={{ display: 'none' }}>Play</button>
      <button type="button" id="pausesound" onClick={stopaudio} style={{ display: 'none' }}>Pause</button>
      { showPopup === true && 
        <div className="modal"  style={{ "display": "block" }} id="notificationPopup">

            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body">
                  <ActionButton loading={loadingAccept}>
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
                  </ActionButton>
                </div>
              </div>
            </div>
        </div>
      }  
    </QueryClientProvider>
  );
}

export default App;
