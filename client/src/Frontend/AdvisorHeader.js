import React, { useState,useEffect } from 'react'
import { NavLink } from 'react-router-dom';
import swal from 'sweetalert';
import axios from 'axios';

export default function AdvisorHeader() {

  const [logo,setLogo] = useState('');

  const HandleLogout = () => {
    axios.get(`${process.env.REACT_APP_BASE_URL}/advisor/auth/logout`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
      },
    }).then(result => {
      localStorage.removeItem('accessToken');
      localStorage.clear();
      swal("Success", "Logout Successfully", "success");
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }).catch(error => {
      window.location.href = '/';
      localStorage.clear();
    })
  }

  const HandleDashboard = () => {
    if(localStorage.getItem('advisorToken')) {
      window.location = '/advisor/dashboard';
    } else if(localStorage.getItem('clientToken')) {
      window.location = '/client/dashboard';
    } else {
       window.location = '/';
    }
  }

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/settings/logo`, {
      headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
      },
    }).then(result => {
        setLogo(result.data.data);
    });
  },[]);

  return (
    <div>
      <>
        <header className="bg-white frontend-header fixed w-full top-0" style={{ boxShadow: 'rgb(0 0 0 / 9%) 0px 9px 17px -4px' }}>
          <div className="container">
            <div className="row flex-nowrap justify-content-between align-items-center">
              <div className="col-7 col-md-3 ps-3">
                <NavLink to='/' className="navbar-brand fsp-25 d-lg-block ffq">
                  {
                    logo && <img src='/assets/images/frontend/logo.png' alt='logo' />
                  }
                </NavLink>
              </div>
              <div className="col-4 col-md-7 text-center pb-0 px-0 mx-0">
                <nav className="nav d-lg-flex float-right dropdown">
                  <NavLink className="nav-link py-4 fsp-16 fw-600 position-relative px-3 dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <i className="bi bi-person fsp-22"></i> Hi Advisor Name
                    <span className='position-absolute bg-pink w-100 pt-1 bottom-0 start-0 rounded-top'></span>
                  </NavLink>
                  <div className="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdown">
                      <NavLink className="dropdown-item bg-white text-black" onClick={HandleDashboard}><i className="bi bi-box-arrow-left"></i>Dashboard</NavLink>
                      <NavLink className="dropdown-item bg-white text-black" onClick={HandleLogout}><i className="bi bi-box-arrow-left"></i> Logout</NavLink>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </header>
      </>
    </div>
  )
}
