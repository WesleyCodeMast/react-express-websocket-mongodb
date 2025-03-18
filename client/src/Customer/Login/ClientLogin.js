import React, { useState , useEffect } from 'react';
import { Link, Navigate  , useNavigate } from 'react-router-dom';
import {io} from 'socket.io-client';
import FacebookLogin from '../../Components/Admin/Auth/FacebookLogins';
import axios from 'axios';
import swal from 'sweetalert';
import LoginWithGoogle from '../../Components/Admin/Auth/LoginWithGoogle';
import FrontHeader from '../../Frontend/FrontHeader';
import FrontFooter from '../../Frontend/FrontFooter';
import { useCookies } from 'react-cookie';
import AlertTemp from '../../Components/Chat/AlertforAll';
import { ActionButton } from '../../Components/Loading';

export default function ClientLogin() {
  let history = useNavigate();
  const [msg,setMsg] = useState('');
  const [errorType,setErrorType] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [cookies, setCookie, removeCookie] = useCookies(['clientEmail', 'clientPwd', 'clientisChecked']);
  const [isChecked, setIsChecked] = useState(false);

  const [passwordType, setPasswordType] = useState("password");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const togglePassword =()=>{
    if(passwordType==="password") {
     setPasswordType("text")
     return;
    }
    setPasswordType("password")
  }

  useEffect(() => {
    if(cookies.clientEmail) {
       setEmail(cookies.clientEmail);
       setPassword(cookies.clientPwd);
       setIsChecked(true);
    }
  },[]);
  
  const Submit = async () => {
    setLoadingLogin(true);
    const data = {
      "email": email,
      "password": password
    }

    await axios.post(`${process.env.REACT_APP_BASE_URL}/client/auth/login`, data).then(async result => {
      if (result.status === 200) {
        setMsg(result.data.message);
        setErrorType('success')
        localStorage.setItem('clientToken', result.data.accessToken);

        const data_update = {
          "client_id": result.data.user.id,
          "online_status": 1
        }
        await axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/update-client-online-status`, data_update , {
          headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
          },  
        }).then(result14 => { 
            
        })

        
        if (localStorage.getItem('chatInitiate')) {
          // const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
            const data = {
              "advisor_id": localStorage.getItem('aid'),
              "client_id": result.data.user.id
            }

            axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisorStatus/${localStorage.getItem('aid')}`).then(result3 => {
                if(result3.data.data[0].chat_engage === 1) {
                    swal('Hello','Advisor is busy right now! you can wait or schedule chat', 'warning');
                    localStorage.setItem('scheuleId',localStorage.getItem('aid'));
                    history(`/schedule/${localStorage.getItem('aid')}`);
                } else {
                  localStorage.setItem('cid', result.data.user.id);

                  axios.get(`${process.env.REACT_APP_BASE_URL}/client/auth/newprofile/${localStorage.getItem('aid')}`, {
                    headers: {
                      'Accept': 'application/json, text/plain, */*',
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer `+result.data.accessToken
                    },
                  }).then(result2 => {
                     var balance = '';
                     if(result2.data.promotion.length > 0) {
                      balance = parseFloat(result2.data.data.wallet_balance)+parseFloat(result2.data.promotion[0].amount);
                     } else {
                      balance = parseFloat(result2.data.data.wallet_balance);
                     }

                      var minChat = localStorage.getItem('minChatMinutes') === 0 ? 1 : localStorage.getItem('minChatMinutes');
                      var minChatAllowed = localStorage.getItem('advisorRate') * minChat;
                      var id = localStorage.getItem('aid');
                        if(balance >= minChatAllowed) {
                            const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
                            axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/notification/add`, data).then(result1 => {
                                socket.emit('NOTIFICATION-SEND', ({advisor:id,client:result.data.user.id, noti_id:result1.data.data._id, cl_name:result.data.user.username, minChat: minChat}));
                                setTimeout(() => {
                                    localStorage.setItem('cid', result.data.user.id);
                                    localStorage.setItem('aid', id);
                                    localStorage.setItem('advisorRate', localStorage.getItem('advisorRate'));
                                    localStorage.setItem('username', localStorage.getItem('username'));
                                    localStorage.setItem('notif_id', result1.data.data._id);
                                    localStorage.setItem('minChatMinutes', minChat);
                                    history(`/connecting`);
                                }, 1000);
                            })
                        } else {
                          localStorage.setItem('cid', result.data.user.id);
                          localStorage.setItem('aid', id);
                          localStorage.setItem('advisorRate', localStorage.getItem('advisorRate'));
                          localStorage.setItem('username', localStorage.getItem('username'));
                          localStorage.setItem('username', localStorage.getItem('username'));
                          localStorage.setItem("sendrequest", id);
                          history(`/client/stripe-checkout-chat/5/${localStorage.getItem('cid')}/${id}`);
                        }
                    })
                }
              })
        } else if(localStorage.getItem('ScheduleInitiate')) {
          history(`/schedule/${localStorage.getItem('scheuleId')}`);
        } else if(localStorage.getItem('advisorFavlist')) {
              const data = {
                  "advisor_id" : localStorage.getItem('advisorFavlist')
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
                  history('/client/dashboard');
              })
        } else {
          history('/client/dashboard');
        }
      } else if (result.data.error) {
        setMsg(result.data.error.message);
        setErrorType('error');
      } else if (result.data.error) {
        setMsg(result.data.message);
        setErrorType('error');
      } else {
        setMsg(result.data.message);
        setErrorType('error');
      }
      setLoadingLogin(false);
    }).catch(err => {
        setMsg(err.response.data.message);
        setErrorType('error');
    })
  }

  const HandleRememberMe = (e) => {
    setIsChecked(e.target.checked);

    if(e.target.checked === true) {

      let d = new Date();
      d.setTime(d.getTime() + (86400*6*1000));

      setCookie('clientEmail', email, { expires: d });
      setCookie('clientPwd', password, { expires: d });
      setCookie('clientisChecked', true,{ expires: d });
    } else {
      removeCookie('clientEmail');
      removeCookie('clientPwd');
      removeCookie('clientisChecked');
    }
    
  }

  return (
    // localStorage.getItem('clientToken') ? <Navigate replace to="/client/dashboard" /> :
      <>
        <FrontHeader />
        <div className="flex min-h-full items-center justify-center login-card">
          <div className="w-full max-w-md space-y-8 bg-white p-4 shadow-2xl rounded-4">
            <div>
            { msg && <AlertTemp action = "true" message = {msg} type = {errorType} revert = {setMsg}/> }
              <h2 className="mt-3 text-center text-xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Client Login
              </h2>
              
            </div>

              <div className='flex items-center justify-center'>
              <LoginWithGoogle type={'client'} />
              {/* <div className='facebooklogin'>
                <i className="bi bi-facebook"></i> <FacebookLogin type={'client'} />
              </div> */}
              </div>
                  
              <p className='backlines text-gray-400 font-normal mt-4'>or</p>
            <form className="mt-4 space-y-6">
              <input type="hidden" name="remember" defaultValue="true" />
              <div className="-space-y-px">
                <div>
                  <label htmlFor="email-address" className="font-semibold">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
                      <i className='bi bi-envelope-fill text-gray-500 text-base'></i>
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="relative block w-full appearance-none border-none bg-light-dark h-12  px-5 py-2 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Email address" />
                  </div>

                </div>
                <div className='mt-3'>
                  <label htmlFor="password" className="font-semibold">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
                      <i className='bi bi-key-fill text-gray-500 text-base'></i>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={passwordType}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="relative block w-full appearance-none border-none bg-light-dark h-12  px-5 py-2 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Password" />

                    <button type="button" className="btn" onClick={togglePassword} style={{ marginTop: '-83px', zIndex: '10' , position: 'absolute' , left: '90%' }}>
                     { passwordType==="password"? <i className="bi bi-eye-slash"></i> :<i className="bi bi-eye"></i> }
                     </button>
                  </div>
                  

                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={isChecked}
                    onChange = {HandleRememberMe}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 pt-2">
                    Remember me
                  </label>
                </div>
                <div className="flex items-center">
                  <Link to='/forgot-password/client'>Forgot Password?</Link>
                </div>
              </div>

              <div>
                <div>
                  <ActionButton loading={loadingLogin}>
                    <button
                      type="button"
                      onClick={Submit}
                      className="group relative flex w-full justify-center rounded-1 bg-purple-900 opacity-90 py-2 px-4 text-base font-medium text-white hover:btn-light"
                    >
                      Login
                    </button>
                  </ActionButton>
                </div>
              </div>
              
              <div className='n-account text-center'>
                <p className='text-sm font-bold'>Don't have an account yet? <Link className='text-regal-blue' to='/client-signup'>Sign up here</Link></p>
              </div>
            </form>
          </div>
        </div>
        {/* </div> */}
        <FrontFooter />
      </>
  )
}