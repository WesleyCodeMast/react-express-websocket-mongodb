import React from 'react'
import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'

export default function Termsofuse() {
  return (
    <div>
      <FrontHeader/>
      <section className='mt-6 termsofuse'>
            <div className='container'>
                <h1 className='fs-2'>user agreement Advisor BV</h1>
                <button className='btn btn-outline-dark d-block my-3 px-3 py-2_5 fw-500'>Gebruikersovereenkomst opdrachtnemers</button>
                <button className='btn btn-outline-dark d-block my-3 px-3 py-2_5 fw-500'>Gebruikersovereenkomst opdrachtgevers</button>
            </div>
        </section>
      <FrontFooter/>
    </div>
  )
}
