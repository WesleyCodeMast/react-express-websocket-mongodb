import React , { useState, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import swal from 'sweetalert';
import FacebookLogin from '../../Components/Admin/Auth/FacebookLogins';
import LoginWithGoogle from '../../Components/Admin/Auth/LoginWithGoogle';
import FrontHeader from "../../Frontend/FrontHeader";
import FrontFooter from "../../Frontend/FrontFooter";
import ReCAPTCHA from 'react-google-recaptcha';
import { io } from 'socket.io-client';


export default function ClientSignup() {
  const navigate = useNavigate();
  const [name , setName] = useState('');
  const [email , setEmail] = useState('');
  const [password , setPassword] = useState('');
  const [confirmPassword , setConfirmPassword] = useState('');
  const [dob , setDob] = useState('');
  const [userName , setUserName] = useState('');

  const [message, setMessage] = useState("");
  const [error,setError] = useState("");
  

  const captchaRef = useRef(null);

  const verifyToken = async (token) => {
    try{
      let response = await axios.post(`${process.env.REACT_APP_BASE_URL}/client/auth/verify-token`,{       
        secret:process.env.REACT_APP_SECRET_KEY,
        token
      },console.log(token));
      return response.data;
    }catch(error){
      console.log("error ",error);
    }
  }

  const onChangeAlphaNumericInput = (e) => {
    const value = e.target.value;
    const regex = /^[0-9a-zA-Z(\-)]+$/; 
    if (value.match(regex) || value === "") {
      console.log("success");
      setUserName(e.target.value);
    } else {
      console.log("error");
      setUserName('');
    }
 }

  const HandleSubmit = async () => {

      const data = {
         "name": name,
         "username": userName,
         "email": email,
         "password": password,
         "password_confirmation": confirmPassword,
         "account_created_by": 'self',
         "dob": dob
      }

      setError('');
      setMessage('');

      let token = captchaRef.current.getValue();
      if(userName === '') {
        swal("error", "Special Character not allowed, only alphanumeric value allowed", "error");
      }
      else if(token){
        let valid_token = await verifyToken(token);
        if(valid_token.success){
          setMessage("Hurray!! you have submitted the form");

    axios.post(`${process.env.REACT_APP_BASE_URL}/client/auth/register` , data , {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer `+localStorage.getItem('clientToken')
        },
      }).then(result => {
       if(result.status === 200) {
          swal("success", "Client Registered successfully", "success");

          axios.post(`${process.env.REACT_APP_BASE_URL}/client/auth/login`, data).then(result => {
            localStorage.setItem('clientToken', result.data.accessToken);
             if(localStorage.getItem('newClientSingup')) {
                localStorage.setItem('cid', result.data.user.id);

                axios.get(`${process.env.REACT_APP_BASE_URL}/client/auth/profile`, {
                  headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer `+localStorage.getItem('clientToken')
                  },
                }).then(result2 => {
                    var minChat = localStorage.getItem('minChatMinutes') === 0 ? 1 : localStorage.getItem('minChatMinutes');
                    var minChatAllowed = localStorage.getItem('advisorRate') * minChat;
                    var id = localStorage.getItem('aid');
                      if(result2.data.data.wallet_balance >= minChatAllowed) {
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
                                  navigate(`/connecting`);
                              }, 1000);
                          })
                      } else {
                        localStorage.setItem('cid', result.data.user.id);
                        localStorage.setItem('aid', id);
                        localStorage.setItem('advisorRate', localStorage.getItem('advisorRate'));
                        localStorage.setItem('username', localStorage.getItem('username'));
                        localStorage.setItem('username', localStorage.getItem('username'));
                        localStorage.setItem("sendrequest", id);
                        navigate(`/client/stripe-checkout-chat/5/${localStorage.getItem('cid')}/${id}`);
                      }
                  })
             } else {
                window.location.href = '/client/dashboard';
             }
            
          })
          
        }
      }).catch(err => {
        console.log("err",err);
        if(err.response.data.error) {
          swal("Hello", err.response.data.message, "error");
        } else if(err.response.data.data.errors) {
          if(err.response.data.data.errors.password_confirmation) {
            swal("Hello",err.response.data.data.errors.password_confirmation[0] , "error");
          } else if(err.response.data.data.errors.username) {
            swal("Hello",err.response.data.data.errors.username[0] , "error");
          }
        } else if(err.response.data.data) {
          swal("Hello",err.response.data.data , "error"); 
        } else if(err.response.data.message.code === 11000) {
          swal("Hello", "This email address ia already registered", "error");
        }
      
      })

        } else {
          setError("Sorry!! Token invalid");
        }
      } else {
        setError("You must confirm you are not a robot");
      }
  } 

    const [passwordType, setPasswordType] = useState("password");
    const [passwordCType, setCPasswordType] = useState("password");

    const togglePassword =()=>{
      if(passwordType==="password") {
      setPasswordType("text")
      return;
      }
      setPasswordType("password")
    }

    const toggleCPassword =()=>{
      if(passwordCType==="password") {
        setCPasswordType("text")
      return;
      }
      setCPasswordType("password")
    }



  return (
    <>
    <FrontHeader/>
    {/* <div className='bg-center bg-no-repeat bg-cover commonClass' style={{backgroundImage: "url('../image/login-bg.jpeg')"}}> */}
      <div className="flex min-h-full items-center justify-center login-card">
        <div className="w-full max-w-md space-y-8 bg-white p-4 shadow-2xl rounded-4">
            <h2 className="mt-3 text-center text-xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Client Signup
            </h2>
            <p className='text-sm text-center text-gray-400 font-normal mt-3 mb-0'>Satisfaction 100% Guaranteed</p>
            <div className='flex items-center justify-center'>
              <LoginWithGoogle type={'client'} />
              {/* <div className='facebooklogin'>
                <i className="bi bi-facebook"></i> <FacebookLogin type={'client'} />
              </div> */}
              </div>
                  
              <p className='backlines text-gray-400 font-normal mt-4'>or</p>
              <form>
                <div className="relative w-full mb-3">
                  <label
                    className="font-semibold"
                    htmlFor="grid-password"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    onChange={onChangeAlphaNumericInput}
                    className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm"
                    placeholder="Username"
                  />
                </div>

                <div className="relative w-full mb-3">
                  <label
                    className="font-semibold"
                    htmlFor="grid-password"
                  >
                    Email
                    <span className='text-red text-base absolute top-0 ml-1'>*</span>
                  </label>
                  <input
                    type="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm"
                    placeholder="Email"
                  />
                </div>
                <div className="row">
                  <div className="col-6">
                    <div className="relative w-full mb-1">
                      <label
                        className="font-semibold"
                        htmlFor="grid-password"
                      >
                        Password
                        <span className='text-red text-base absolute top-0 ml-1'>*</span>
                      </label>
                      <input
                        type={passwordType}
                        onChange={(e) => setPassword(e.target.value)}
                        className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm"
                        placeholder="Password"
                      />
                       <button type="button" className="btn" onClick={togglePassword} style={{ marginTop: '-83px', zIndex: '10' , position: 'absolute' , right: '0' }}>
                        { passwordType==="password"? <i className="bi bi-eye-slash"></i> :<i className="bi bi-eye"></i> }
                       </button>  
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="relative w-full mb-1">
                      <label
                        className="font-semibold"
                        htmlFor="grid-password"
                      >
                        Confirm Password
                        <span className='text-red text-base absolute top-0 ml-1'>*</span>
                      </label>
                      <input
                        type={passwordCType}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm"
                        placeholder="Password"
                      />
                       <button type="button" className="btn" onClick={toggleCPassword} style={{ marginTop: '-83px', zIndex: '10' , position: 'absolute' , right: '0' }}>
                        { passwordCType==="password"? <i className="bi bi-eye-slash"></i> :<i className="bi bi-eye"></i> }
                       </button>  
                    </div>
                  </div>
                </div>
                <span className='text-sm text-gray-400 font-medium mb-3 inline-block'>Password must be at least 8 characters</span>
                {/* <div className="row">
                  <div className="col-6">
                    <div className="relative w-full mb-3">
                      <label
                        className="font-semibold"
                        htmlFor="grid-dob"
                      >
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        onChange={(e) => setDob(e.target.value)}
                        className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm"
                        placeholder="Date of Birth"
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="relative w-full mb-3">
                      <label
                        className="font-semibold"
                        htmlFor="grid-username"
                      >
                        Username
                         <span className='text-red text-base absolute top-0 ml-1'>*</span>
                      </label>
                      <input
                        type="text"
                        onChange={(e) => setUserName(e.target.value)}
                        className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm"
                        placeholder="Username"
                      />
                    </div>
                  </div>
                </div> */}
                <div>
                  <label className="font-semibold inline-flex">
                    <input
                      id="customCheckLogin"
                      type="checkbox"
                      className="form-checkbox border-1 rounded text-blueGray-700 ml-1 w-5 h-5 ease-linear transition-all duration-150"
                    />
                    <span className="ml-2 text-sm font-semibold text-blue Gray-600 ">
                    I have read and agree to disclaimer {" "}
                    <a
                        //href="!#"
                        href="pages/member-terms-and-conditions"
                        className="text-regal-blue"
                        //data-toggle="modal" 
                        //data-target="#myModal5"
                        // onClick={(e) => e.preventDefault()}
                      >
                        member terms of use
                      </a>
                      {" "}
                      and
                      {" "}
                      <a 
                        href="/privacypolicy"
                        className="text-regal-blue" 
                        //data-toggle="modal" 
                        //data-target="#myModal4"
                        // onClick={(e) => e.preventDefault()}
                      >
                        privacy policy
                      </a>
                      {" "}
                      here.
                    </span>
                  </label>
                </div>

                <div className='formGroup'>
                  <ReCAPTCHA sitekey={process.env.REACT_APP_SITE_KEY} ref={captchaRef}  />
                </div>

                <div className="App">
                {
                    error && <p className='textError'>Error!! {error}</p>
                }
                {
                    message && <p className='textSuccess'>Success!! {message}</p>
                }
                </div>

                <div className="text-center mt-6">
                  <button
                    onClick={HandleSubmit}
                    className="group relative flex w-full justify-center rounded-1 bg-purple-900 opacity-90 py-2 px-4 text-base font-medium text-white hover:btn-light"
                    type="button"
                  >
                    Create Account
                  </button>
                </div>
              </form>
              <div className='n-account text-center'>
                <p className='text-sm font-bold mt-3'>Already have an account? <Link className='text-regal-blue' to='/client-login'>Login here</Link></p>
              </div>
        </div>
      </div>
    {/* </div> */}
    <FrontFooter/>
    </>
  );
}
