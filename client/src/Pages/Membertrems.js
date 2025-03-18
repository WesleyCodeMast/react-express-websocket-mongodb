import React from 'react'
import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'

export default function Membertrems() {
  return (
    <div>
      <FrontHeader/>
      <section className='mt-6 termsofuse'>
            <div className='container'>
                <h1 className='text-3xl'>Member terms and conditions</h1>
            </div>
        </section>
      <FrontFooter/>
    </div>
  )
}
