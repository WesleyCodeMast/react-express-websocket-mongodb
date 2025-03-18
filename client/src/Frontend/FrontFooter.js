import React ,{useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import jwt_decode from "jwt-decode";
import axios from 'axios';

export default function FrontFooter() {

const [confideas, setConfideas] = useState('');
const [clientSources, setClientSources] = useState('');
const [advisorSources, setAdvisorSources] = useState('');

useEffect(() => {
    if(localStorage.getItem('advisorToken')) {
      var decoded = jwt_decode(localStorage.getItem('advisorToken'));
      if (decoded.exp * 1000 < Date.now()) {
         localStorage.clear();
         window.location.reload(false);
      } 
    } 

    if(localStorage.getItem('clientToken')) {
      var decoded = jwt_decode(localStorage.getItem('clientToken'));
      if (decoded.exp * 1000 < Date.now()) {
         localStorage.clear();
         window.location.reload(false);
      } 
    } 
     axios.get(`${process.env.REACT_APP_BASE_URL}/admin/pages/all/confideas`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    }).then(result => {
      setConfideas(result.data.data);
    });

    axios.get(`${process.env.REACT_APP_BASE_URL}/admin/pages/all/client_sources`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    }).then(result => {
      setClientSources(result.data.data);
    });

    axios.get(`${process.env.REACT_APP_BASE_URL}/admin/pages/all/advisor_sources`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    }).then(result => {
      setAdvisorSources(result.data.data);
    });
},[]);

  return (
    <div>
      <footer className="bg-white footerhome position-sticky top-5 pt-10">
                <div className="container">
                    <div className="row border-bottom border-light pb-2 ps-2 ps-md-3">
                      <div className='col-sm-4 col-12'>
                        <div className='footer-menu'>
                        <h5 className='text-black text-lg font-semibold mb-3'>Confideas</h5>    
                        <ul className="list-unstyled">
                          
                            {confideas && confideas.map((item, index) => (
                                <li className="my-2" key={index}><Link to={`/pages/${item.slug}`} className="text-decoration-none text-black fsp-15">{item.title}</Link></li>
                            ))}
                            <li className="my-2"><Link to='/contact' className="text-decoration-none text-black fsp-15">Contact Us</Link></li>

                        </ul>
                        </div>
                      </div>
                      <div className='col-sm-4 col-12'>
                        <div className='footer-menu'>
                        <h5 className='text-black text-lg font-semibold mb-3'>User Sources</h5>
                        <ul className="list-unstyled">
                            <li className="my-2"><Link to='/faqs' className="text-decoration-none text-black fsp-15">FAQ</Link></li>
                            <li className="my-2"><Link to='/privacypolicy' className="text-decoration-none text-black fsp-15">Privacy Policy</Link></li>
                            {clientSources && clientSources.map((item, index) => (
                                <li className="my-2" key={index}><Link to={`/pages/${item.slug}`} className="text-decoration-none text-black fsp-15">{item.title}</Link></li>
                            ))}
                        </ul>
                        </div>
                      </div> 
                      <div className='col-sm-4 col-12'>
                        <div className='footer-menu'>
                        <h5 className='text-black text-lg font-semibold mb-3'>Advisor Portal</h5>
                        <ul className="list-unstyled">
                            <li className="my-2"><Link to='/advisor' className="text-decoration-none text-black fsp-15">Become an Advisor</Link></li>
                                {     localStorage.getItem('clientToken') ? ''
                                    : localStorage.getItem('advisorToken') ?  ''
                                    :
                                       <li className="my-2">
                                         <Link to='/advisor-login' className="text-decoration-none text-black fsp-15">Advisor Login</Link>
                                       </li>  
                                }
                            {advisorSources && advisorSources.map((item, index) => (
                              <li className="my-2" key={index}><Link to={`/pages/${item.slug}`} className="text-decoration-none text-black fsp-15">{item.title}</Link></li>
                            ))}
                        </ul>
                        </div>
                      </div>  
                    </div>
                    <hr className='mt-0 pt-0'></hr>
                    <div className="row pt-3 pb-3">
                      <div className="col-12 col-md-12 pt-2">
                        <p className="text-black text-center fsp-13">Copyright<i className="bi bi-c-circle mx-2 "></i>2023  Advisor. All rights reserved.</p>
                      </div>
                    </div>
                </div>
            </footer>    
        </div>
    )
}
