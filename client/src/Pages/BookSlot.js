import React from 'react';

import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'

export default function bookSlot() {
    return (
        <div>
            <FrontHeader />
            <>
            <div className='Stripe-Payment lg:mt-20 w-full inline-block'>
                <div className='container h-screen'>
                    <div className='row mt-10'>
                        <div className='paynowStripe text-center w-full'>
                            <h2 className='text-xl font-bold'>Stripe Payment</h2>
                            <button className='btn btn-light col-4 text-center mt-10'> Pay</button>
                        </div>
                    </div>
                </div>
                </div>

            </>
            <FrontFooter />
        </div>
    )
}
