import React, { useState , useEffect } from 'react';
import { Link, Navigate ,useNavigate } from 'react-router-dom';
import axios from 'axios';
import FrontHeader from '../../Frontend/FrontHeader';
import FrontFooter from '../../Frontend/FrontFooter';
import { useCookies } from 'react-cookie';
import AlertTemp from './../../Components/Chat/AlertforAll';
import { ActionButton } from '../../Components/Loading';

export default function AdvisorLogin() {
  let history = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cookies, setCookie, removeCookie] = useCookies(['advisorEmail', 'advisorPwd', 'advisorisChecked']);
  const [isChecked, setIsChecked] = useState(false);
  const [msg,setMsg] = useState('');
  const [errorType,setErrorType] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  useEffect(() => {
    if(cookies.advisorEmail) {
       setEmail(cookies.advisorEmail);
       setPassword(cookies.advisorPwd);
       setIsChecked(true);
    }
  },[cookies]);

  const Submit = async () => {
    setLoadingLogin(true);
    const data = {
      "email": email,
      "password": password
    }

    await axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/auth/login`, data).then(result => {
      if (result.status === 200) {
        setMsg(result.data.message);
        setErrorType('success');
        localStorage.setItem('advisorToken', result.data.accessToken);
        localStorage.setItem('username', result.data.user.username);
        const data_update = {
          "chat_engage": 0
        }
        axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-engage-status`, data_update , {
          headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json',
              'Authorization': `Bearer `+result.data.accessToken
          },  
        }).then(result1 => {
            setLoadingLogin(false); 
            window.location.href = '/advisor/dashboard';
        });
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
      setLoadingLogin(false);
      console.log(err);
      setMsg(err.response.data.message);
      setErrorType('error');
    })
    
  }

  const HandleRememberMe = (e) => {
    setIsChecked(e.target.checked);
    if(e.target.checked === true) {
      let d = new Date();
      d.setTime(d.getTime() + (86400*6*1000));
      setCookie('advisorEmail', email, { expires: d });
      setCookie('advisorPwd', password, { expires: d });
      setCookie('advisorisChecked', true,{ expires: d });
    } else {
      removeCookie('advisorEmail');
      removeCookie('advisorPwd');
      removeCookie('advisorisChecked');
    }
  }

  const [passwordType, setPasswordType] = useState("password");

  const togglePassword =()=>{
    if(passwordType==="password") {
     setPasswordType("text")
     return;
    }
    setPasswordType("password")
  }

  return (

    localStorage.getItem('advisorToken') ? <Navigate replace to="/advisor/dashboard" /> :
      <>
        <FrontHeader />
        {/* <div className='bg-center bg-no-repeat bg-cover commonClass pb-5' style={{backgroundImage: "url('../image/login-bg.jpeg')"}}> */}
        <div className="flex min-h-full items-center justify-center login-card">
          <div className="w-full max-w-md space-y-8 bg-white p-4 shadow-2xl rounded-xl">
            <div>
              { msg && <AlertTemp action = "true" message = {msg} type = {errorType} revert = {setMsg}/> }
              <h2 className="mt-3 text-center text-xl sm:text-3xl font-bold tracking-tight text-gray-900">Advisor Login</h2>
            </div>
            <form className="mt-8 space-y-6" action="#" method="POST">
              <input type="hidden" name="remember" defaultValue="true" />
              <div className="-space-y-px">
                <div>
                  <label htmlFor="email-address" className='font-semibold'>
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
                      value={email}
                      required
                      className="relative block w-full appearance-none border-none bg-light-dark h-12  px-5 py-2 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Email address" />
                  </div>

                </div>
                <div className='mt-3'>
                  <label htmlFor="password" className='font-semibold'>
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
                      <i className='bi bi-key-fill text-gray-500 text-base'></i>
                    </div>
                    <input
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={passwordType}
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
                  <Link to='/forgot-password/advisor'>Forgot Password?</Link>
                </div>
              </div>

              <div>
                <div>
                  <ActionButton loading={loadingLogin}>
                    <button
                      type="button"
                      onClick={Submit}
                      className="group relative flex w-full justify-center rounded-1 bg-purple-900 opacity-90 py-2 px-4 text-base font-medium text-white hover:btn-light">Login
                    </button>
                  </ActionButton>
                </div>
              </div>
              {/* <p className='backlines'>or login with</p>
              
              <div className='flex items-center justify-between'>
                <FacebookLogin />
                <GoogleLogin type={'advisor'} />
              </div> */}
              {/* <div className='n-account text-center'>
              <p className='text-sm font-bold'>Don't have an account yet? <Link className='text-regal-blue' to='/advisor-signup'>Sign up here</Link></p>
            </div> */}
            </form>
          </div>
        </div>
        {/* </div> */}
        <FrontFooter />
      </>
  )
}