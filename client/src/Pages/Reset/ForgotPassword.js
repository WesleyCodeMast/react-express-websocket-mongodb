import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios';
import swal from 'sweetalert';

import { LockClosedIcon } from '@heroicons/react/20/solid'
import FrontHeader from '../../Frontend/FrontHeader';


export default function ForgotPassword() {
  const params = useParams();

  console.log('params.user', params.user)

  const [email, setEmail] = useState();

  const handleSubmit = (e) => {

    e.preventDefault();

    const formData = {
      email: email,

    }

    axios.post(`${process.env.REACT_APP_BASE_URL}/${params.user}/auth/password-reset`, formData, {
      headers: {
        'Authorization': `Bearer ` + localStorage.getItem('accessToken')
      },
    }).then(res => {
      if (res.data.success === true) {
        swal("success", "A confirmation link is sent to your email.", "success");
      } else if (res.data.error) {
        swal('error',res.data.message, "error");
      }
    }).catch(error => {
      swal('error', "This email is not registered with Us.", "error");
    });

  }

  return (
<>
  <FrontHeader/>
  <div className="flex min-h-full items-center justify-center login-card">
    <div className="w-full max-w-md space-y-8 bg-white p-4 shadow-2xl rounded-xl">
      <div>
        <h2 className="mt-3 text-center text-xl sm:text-3xl font-bold tracking-tight text-gray-900">Forgot Password</h2>
        <form className="mt-8 space-y-6" action="#" method="POST" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="-space-y-px rounded-md shadow-sm">
            <label htmlFor="email-address">
              Please enter your email address. We will send you a confirmation email to reset your password.
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
          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-1 bg-purple-900 opacity-90 py-2 px-4 text-base font-medium text-white hover:btn-light"
            >
              Reset my password
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
    </>
  )
}