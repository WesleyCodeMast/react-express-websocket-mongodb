import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios';
import swal from 'sweetalert';

import { LockClosedIcon } from '@heroicons/react/20/solid'
import FrontHeader from '../../Frontend/FrontHeader';



export default function ConfirmResetPassword() {

  const params = useParams();
  const navigate = useNavigate();

  console.log('params.user', params.user)

  const [isMatched, setIsMatched] = useState('');
  const [pwd, setPwd] = useState();
  const [pwd_conf, setPwdConf] = useState();

  const handleSubmit = (e) => {

    e.preventDefault();

    if (pwd !== pwd_conf) {
      setIsMatched(false);

      return false;

    } else {
      setIsMatched('');
    }

    const formData = {
      password: pwd,

    }

    axios.post(`${process.env.REACT_APP_BASE_URL}/${params.type}/auth/password-reset/${params.user}/${params.id}/`, formData, {
      headers: {
        'Authorization': `Bearer ` + localStorage.getItem('accessToken')
      },
    }).then(res => {
      if (res.data.success === true) {
        swal("success", "A password reset has been done success fully.", "success");
        if(params.type === 'admin') {
          navigate(`/zenfeel`);
        } else {
          navigate(`/${params.type}-login`);
        }
     

      } else if (res.data.error) {
        swal("error", res.data.error.message, "error");

      }
    });

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
    <div className='flex min-h-full items-center justify-center login-card'>
      <div className="w-full max-w-md space-y-8 bg-white p-4 shadow-2xl rounded-xl">
        <div>
        <h2 className="mt-3 text-center text-xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Reset Password
          </h2>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="-space-y-px rounded-md shadow-sm">
              <div className='mb-3'>
                <label htmlFor="email-address">
                  Please enter your new password
                </label>
                <input
                  id="new-password"
                  name="new-password"
                  type={passwordType}
                  autoComplete="password"
                  onChange={(e) => setPwd(e.target.value)}
                  required
                  className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="New Password"
                />
                 <button type="button" className="btn" onClick={togglePassword} style={{ marginTop: '-74px', zIndex: '10' , float: 'right' }}>
                    { passwordType==="password"? <i className="bi bi-eye-slash"></i> :<i className="bi bi-eye"></i> }
                  </button>  
              </div>
              <div>
                <label htmlFor="email-address">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={passwordType}
                  autoComplete="password"
                  required
                  onChange={(e) => setPwdConf(e.target.value)}
                  className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Confirm Password"
                />
                    <button type="button" className="btn" onClick={toggleCPassword} style={{ marginTop: '-74px', zIndex: '10' , float: 'right' }}>
                      { passwordCType==="password"? <i className="bi bi-eye-slash"></i> :<i className="bi bi-eye"></i> }
                    </button>   
                {isMatched === false && <span className='text-danger'>The confirm Password does not match</span>}
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-1 bg-purple-900 opacity-90 py-2 px-4 text-base font-medium text-white hover:btn-light"
              >
                {/* <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockClosedIcon className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
                </span> */}
                Reset Now
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
    </>
  )
}