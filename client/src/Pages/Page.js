import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'
import { useParams } from 'react-router-dom'

import React ,{useEffect, useState} from 'react';
import axios from 'axios';

export default function Page() {

  const params = useParams();
  const [data, setData] = useState('');

useEffect(() => {
     axios.get(`${process.env.REACT_APP_BASE_URL}/admin/pages/slug/${params.slug}`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    }).then(result => {
      setData(result.data.data);
    });

    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    })

},[params.slug]);

  return (
    <div>
      <FrontHeader/>
      <section className='mt-6 termsofuse'>
            <div className='container'>
                <h1 className='text-3xl'>{data.title}</h1>
            </div>

            <div className='container'>

                <div dangerouslySetInnerHTML={{__html: data.content}} />
            </div>

        </section>
      <FrontFooter/>
    </div>
  )
}
