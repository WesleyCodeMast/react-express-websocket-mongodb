import React from 'react';
import FrontHeader from '../../Frontend/FrontHeader';

export default function ClientConfirmEmail() {

  return (
    <>
    <FrontHeader />
    <div 
    className='bg-center bg-no-repeat bg-cover h-screen commonClass'>
      <div className="flex min-h-full items-center justify-center p-20">
        <div className="w-full max-w-md space-y-8 bg-white p-4 text-center">
          <div>
            {/* <img
              className="mx-auto h-12 w-auto"
              src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
              alt="Client Login"
            /> */}
            <img
              className="mx-auto h-auto w-auto"
              src="/assets/images/frontend/send-mail.png"
              alt="Client Login"
            />
            <h2 className="mt-6 mb-3 text-center text-3xl font-bold tracking-tight text-gray-900">
              Thank you for sign up
            </h2>
            <p>Thank you very much for your interest in joining our wonderful team. Please verify your email and we will notify you once your application is accepted.</p>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}