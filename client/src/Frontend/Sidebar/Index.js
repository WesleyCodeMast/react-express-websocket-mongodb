import React from 'react'
import { Link, NavLink } from 'react-router-dom'
function FrontHeader(props) {

  return (
    <>
      <div id="sidebar" className="sidebar position-fixed top-0 d-block d-lg-none pt-md-4 mobile-sidebar">
        <div className={props.display ? 'd-flex flex-column flex-shrink-0 p-3 bg-light overflow-auto' : 'd-none'}>
          <NavLink to='/' className="d-flex text-decoration-none">
            <i className='bi bi-arrow-left'  onClick={props.hideSidebar}></i>
            <span className="ffq text-secondary">Confideas</span>
          </NavLink>
          <br />
          <ul className="nav nav-pills flex-column mb-auto">
            {/* <li className="nav-item">
              <NavLink to='/' className="nav-link" onClick={props.hideSidebar}>
                For Advisor
              </NavLink>
            </li> */}
            {/* <li>
              <NavLink to='/client' className="nav-link" onClick={props.hideSidebar}>
                For Client
              </NavLink>
            </li> */}
            {/* <li>
              <NavLink to='/ourstory' className="nav-link" onClick={props.hideSidebar}>
                Our Story
              </NavLink>
            </li> */}
            <Link to="/client-login" onClick={props.hideSidebar} className='btn btn-outline-dark'>
            Sign In<i className="bi bi-chevron-right float-end"></i>
            </Link>
            <Link to="/client-signup" onClick={props.hideSidebar} className='btn btn-primary'>
            Sign Up<i className="bi bi-chevron-right float-end"></i>
            </Link>
            
            {/* <p>Or sign up : </p>
            <Link to="/advisor-login" onClick={props.hideSidebar} className='btn btn-outline-dark'>
            SignIn for Advisor <i className="bi bi-chevron-right float-end"></i>
            </Link>
            <Link to="/advisor-signup" onClick={props.hideSidebar} className='btn btn-outline-dark'>
            SignUp for Advisor <i className="bi bi-chevron-right float-end"></i>
            </Link> */}
          </ul>
          <div className="dropdown">
            {/* <Link to='/' className="d-flex align-items-center link-dark text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="https://github.com/mdo.png" alt="" width="32" height="32" className="rounded-circle me-2" />
                <strong>Account</strong>
              </Link>
              <ul className="dropdown-menu text-small shadow">
                <li><Link to='/' className="dropdown-item">Sign In</Link></li>
                <li><Link to='/' className="dropdown-item">Sign Up</Link></li>
              </ul> */}
          </div>
          <br />
          <br />
        </div>
      </div>
    </>
  )
}

export default FrontHeader;