import React , { useState , useEffect } from 'react'
import FrontFooter from '../Frontend/FrontFooter';
import FrontHeader from '../Frontend/FrontHeader';
import axios from 'axios';

export default function Datacollection() {

  const [datac,setDatac] = useState('');

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/client-agreement`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    }).then(result => {
         setDatac(result.data.data.agreement);
    }).catch(err => {
      
    })
  },[]);

  return (
    <div>
      <FrontHeader/>
      <section className='mt-6 termsofuse'>
            <div className='container'>
                <h1 className='text-3xl'>Data Collection Policy for Advisors</h1>
                <div className='container' dangerouslySetInnerHTML={{ __html: datac }} />
            </div>
        </section>
      <FrontFooter/>
    </div>
  )
}
