import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import swal from 'sweetalert';

export default function AdminLogin() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const Submit = () => {

    const data = {
      "email": email,
      "password": password
    }

    axios.post(`${process.env.REACT_APP_BASE_URL}/user/auth/login`, data).then(result => {
      if (result.status === 200) {
        swal("Success", result.data.message, "success");
        localStorage.setItem('accessToken', result.data.accessToken);
        window.location.href = '/user/dashboard'
      } else if (result.data.error.message) {
        swal("Hello", result.data.error.message, "error");
      } else if (result.data.error) {
        swal("Hello", result.data.message, "error");
      } else {

      }
    })
  }

  return (

    localStorage.getItem('accessToken') ? <Navigate replace to="/user/dashboard" /> :

      <div className='bg-center bg-no-repeat bg-cover h-screen commonClass'>
        <div className="flex min-h-full items-center justify-center login-card">
          <div className="w-full max-w-md space-y-8 bg-white p-4 shadow-2xl rounded-xl">
            <div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                Admin Login
              </h2>
            </div>
            <form className="mt-8 space-y-6" action="#" method="POST">
              <input type="hidden" name="remember" defaultValue="true" />
              <div className="-space-y-px rounded-md shadow-sm">
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
                      required
                      className="relative block w-full appearance-none border-none bg-light-dark h-12  px-5 py-2 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Email address"
                    />
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
                      type="password"
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="relative block w-full appearance-none border-none bg-light-dark h-12  px-5 py-2 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Password" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 pt-2">
                    Remember me
                  </label>
                </div>
                <div className="flex items-center">
                  <Link to='/forgot-password/user'>Forgot Password?</Link>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={Submit}
                  className="group relative flex w-full justify-center rounded-1 bg-purple-900 opacity-90 py-2 px-4 text-base font-medium text-white hover:btn-light"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  )
}