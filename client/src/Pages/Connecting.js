import React ,{useState,useEffect} from 'react'
import { useNavigate } from 'react-router-dom';
import FrontHeader from '../Frontend/FrontHeader'
import FrontFooter from '../Frontend/FrontFooter'
import axios from 'axios';
import { io } from 'socket.io-client';
import jwtDecode from 'jwt-decode';
import swal from 'sweetalert';
import { getCidFromStorageToken } from '../Utils/storageHelper';
import { ActionButton } from '../Components/Loading';

export default function Connecting() {

    const navigate = useNavigate();
    const [advisorImage,setAdvisorImage] = useState('');
    const [clientImage,setClientImage] = useState('');
    const [advisorName,setAdvisorName] = useState('');
    const [clientName,setClientName] = useState('');
    const [loadingHangUp, setLoadingHangUp] = useState(false);
    const [showPopup,setshowPopup] = useState(false);

    useEffect(() => {
        const img_data = {
          "client_id": localStorage.getItem('cid'),
          "advisor_id": localStorage.getItem('aid')
        }
    
        axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/profile-images`, img_data ).then(result => {
              setAdvisorImage(`${process.env.REACT_APP_BASE_URL}/${result.data.advisor_profile}`);
              setClientImage(`${process.env.REACT_APP_BASE_URL}/${result.data.client_profile}`);
              setAdvisorName(result.data.advisor_username);
              setClientName(result.data.client_username);
        }).catch(err => {})
      },[]);

      const addDefaultSrc = (ev) => {
        ev.target.src = `/assets/images/avtar/user-profile.png`;
      }

      useEffect(() => {
        const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
        var decoded = getCidFromStorageToken();
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
                setTimeout(() => {
                    navigate(`/client/dashboard`);
                },1000);
            }
          
        });
        return () => {
          socket.off('CHAT-CONNECTED');
          socket.off('CLIENT-CHAT-REJECTED-NOTIFYBACK');
        }
      },[]);

   const HangUp = () => {
      setshowPopup(true);
   } 
   
    const chatRejected = async () => {
        setLoadingHangUp(true);
        debugger;
        const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
        socket.emit('CLIENT-CHAT-HANGUP', { advisor: localStorage.getItem('aid') });
        
        await axios.delete(`${process.env.REACT_APP_BASE_URL}/frontend/notification/delete/${localStorage.getItem('notif_id')}`).then(result => {
            
            const data_update = {
                "chat_engage": 0,
                "advisor_id": localStorage.getItem('aid')
            }
            axios.put(`${process.env.REACT_APP_BASE_URL}/client/update-chat-engage-status`, data_update , {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },  
            }).then(result => {  
                setLoadingHangUp(false);
                navigate(`/client/dashboard`);
            })
        });
        
        return () => {
            socket.off('CLIENT-CHAT-REJECTED');
        }

    }

    const ChatAccepted = () => {
        setshowPopup(false);
    }

    
  return (
    <div>
      <FrontHeader/>
        <div className='container'>
            <div className='row'>
                <div className='col-12 col-lg-12'>
                    <div className='connecting shadow-md rounded-xl bg-white'>  

                        <div className='row'>
                            {/* <div className='col-sm-4 col-lg-3 col-12' id='connectprofile'>

                        {/* <div className='row'>
                            <div className='col-sm-4 col-lg-3 col-12' id='connectprofile'>
                                <div className='connectleft'>
                                    <div className='profleft'>
                                        <img src={clientImage} onError={addDefaultSrc} className='img-fluid' />
                                        <h3>{clientName}</h3>
                                        <p>Fee/Minute ${localStorage.getItem('advisorRate')}</p>
                                    </div>
                                </div>
                            </div> */}
                            <div className='col-sm-12 col-lg-12 col-12' id='connectprofileright'>
                                <div className='connectright'>
                                    <div className='connecttime flex justify-end'>
                                        {/* <p><i className="fa fa-period"></i> Connecting <span>00.00</span></p> */}
                                        <button type="button" onClick={HangUp}><i className="fa fa-circle-xmark"></i> Hang up</button>
                                    </div>
                                    <div className='profright'>
                                        {
                                            advisorImage && <img src={advisorImage} onError={addDefaultSrc} className='img-fluid' />
                                        }
                                        
                                        <span>Connecting</span>
                                        <h3>{advisorName}</h3>
                                        <p>Please hold when we are connecting your call</p>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                     {/* <div className='connectright'>
                            <div className='connecttime'>
                                <p><i className="fa fa-period"></i> Connecting <span>00.00</span></p>
                                <button type="button" onClick={HangUp} style={{color: "#70329a"}}><i className="fa fa-circle-xmark"></i> Hang up</button>
                            </div>
                            <div className='profright'>
                                <img src={advisorImage} onError={addDefaultSrc} className='img-fluid' />
                                <span>Connecting</span>
                                <h3>{advisorName}</h3>
                                <p>Please hold when we are connecting your call</p>
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>

                { showPopup === true && 
                    <div className="modal"  style={{ "display": "block" }} id="notificationPopup">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <ActionButton loading={loadingHangUp}>
                                    <div className="modal-body">
                                        <div className='Notification'>
                                            <div className='text-center p-3'>
                                                <img src='/assets/images/frontend/check.png' alt='right' className='inline-block' />
                                            </div>
                                        <div className='Notification text-gray-800 text-3xl mb-2 font-semibold text-center'>Chat</div>
                                        <div className=' text-gray-400 text-base text-center'>Are you sure you would like to hang up?</div>
                                            <div className="text-right pt-2">
                                                <button type="button" onClick={() => ChatAccepted()} className="px-4 px-md-4 py-1.5 btn btn-primary rounded-1 mt-3 mb-2 ffp fsp-12 mr-2">Cancel</button>
                                                <button type="button" onClick={() => chatRejected()}  className="px-4 px-md-4 py-1.5 btn btn-light rounded-1 mt-2 ffp fsp-17">Hang Up</button>
                                            </div>
                                        </div>
                                    </div>
                                </ActionButton>
                            </div>
                        </div>
                    </div>
                } 

      
    </div>
  )
}
