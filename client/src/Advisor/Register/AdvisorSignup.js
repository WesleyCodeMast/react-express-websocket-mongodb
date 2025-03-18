import React , { useState , useEffect } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import swal from 'sweetalert';
import FrontHeaderTwo from "../../Frontend/FrontHeaderTwo";
import FrontFooter from "../../Frontend/FrontFooter";

export default function AdvisorSignup() {

  const [email , setEmail] = useState('');
  const [password , setPassword] = useState('');
  const [confirmPassword , setConfirmPassword] = useState('');

  const [headline,setHeadline] = useState('');
  const [content, setContent] = useState([]);
  const [featureheadline1,setfeatureHeadline1] = useState('');
  const [featuredesc1,setfeatureHDesc1] = useState('');
  const [featureImage1,setFeatureImage1] = useState('');
  const [featureheadline2,setfeatureHeadline2] = useState('');
  const [featuredesc2,setfeatureHDesc2] = useState('');
  const [featureImage2,setFeatureImage2] = useState('');
  const [featureheadline3,setfeatureHeadline3] = useState('');
  const [featuredesc3,setfeatureHDesc3] = useState('');
  const [featureImage3,setFeatureImage3] = useState('');

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BASE_URL}/admin/signupinfo`, {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
        },
    }).then(result => {
        setHeadline(result.data.data.headline);
        setContent(result.data.data.title);
        setfeatureHeadline1(result.data.data.featureheadline1);
        setfeatureHDesc1(result.data.data.featuredesc1);
        setfeatureHeadline2(result.data.data.featureheadline2);
        setfeatureHDesc2(result.data.data.featuredesc2);
        setfeatureHeadline3(result.data.data.featureheadline3);
        setfeatureHDesc3(result.data.data.featuredesc3);
        setFeatureImage1(result.data.data.featureimage1);
        setFeatureImage2(result.data.data.featureimage2);
        setFeatureImage3(result.data.data.featureimage3);
    });
}, []);

  // const HandleSave = () => {

  //    if(email === '' || userName === '' || RatePerMinute === '' || password === '' || confirmPassword === '') {
  //     swal("Warning", "Please fill required fields", "error");    
  //    } else if(password !== confirmPassword) {
  //       swal("Hello", "Password mismatch", "error");     
  //    } else {

  //      const data = {
  //       "email": email,
  //       "username": userName
  //      }

  //       axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/auth/validate` , data , {
  //         headers: {
  //           'Accept': 'application/json, text/plain, */*',
  //           'Content-Type': 'application/json'
  //         },
  //       }).then(result => {
  //         console.log(result);
  //           if(result.status === 201) {
  //             swal("Hello", result.data.data, "error");     
  //           } else {
  //              localStorage.setItem('ad_name', name);
  //              localStorage.setItem('ad_email', email);
  //              localStorage.setItem('ad_p', password);
  //              localStorage.setItem('ad_pc', confirmPassword);
  //              localStorage.setItem('ad_userName', userName);
  //              localStorage.setItem('ad_rpm', RatePerMinute);
  //              window.location.href = '/client-signup-step';
  //           }
  //       })
  //    }

  // }

//   const HandleSave = () => {

//     if(email === '') {
//      swal("Warning", "Please fill email field", "error");    
//     } else {

//       const data = {
//        "email": email,
//       }

//        axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/auth/validate-email` , data , {
//          headers: {
//            'Accept': 'application/json, text/plain, */*',
//            'Content-Type': 'application/json'
//          },
//        }).then(result => {
//          console.log(result);
//            if(result.status === 201) {
//              swal("Hello", result.data.data, "error");     
//            } else {
//               localStorage.setItem('ad_email', email);
//               window.location.href = '/confirm-email';
//            }
//        })
//     }

//  }

    const HandleSave = () => {

      if(email === '' || password === '' || confirmPassword === '') {
        swal("Warning", "Please fill all the field", "error");    
      } else if(password !== confirmPassword) {
        swal("Warning", "Password mismatch", "error");  
      } else {

        const data = {
          "email": email,
        }

        axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/auth/verify-email` , data , {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
        }).then(result => {
            if(result.data.success === false) {
              swal("Warning", "Email is already registered", "error");  
            } else {
               localStorage.setItem('ad_email', email);
               localStorage.setItem('ad_p',password);
               localStorage.setItem('ad_pc',confirmPassword);
               window.location.href = '/advisor-signup-step';
            }
        })
      }
    }

    const [passwordType, setPasswordType] = useState("password");
    const [passwordCType, setCPasswordType] = useState("password");

    const togglePassword =()=>{
      if(passwordType==="password") {
      setPasswordType("text")
      return;
      }
      setPasswordType("password")
    }

    const toggleCPassword =()=>{
      if(passwordCType==="password") {
        setCPasswordType("text")
      return;
      }
      setCPasswordType("password")
    }

  return (
    <>
    <FrontHeaderTwo/>
    <section className="Advisor-signup">
          <div className='container'>
            <div className='row m-0'>
              <div className='col-12 col-lg-6 advisor-signup-content'>
                <h1>{headline}</h1>
                <ul className='list-unstyled ps-2 ps-md-3'>
                   {
                      content.length > 1 && content.map((item, id1) => (
                        <li className='d-flex mt-4' key={id1}>
                            <div className='check-img'>
                              <img src="assets/images/icons/check.png" alt='Check' />
                            </div>
                            {item}
                        </li>
                      ))
                   } 
                </ul>
              </div>
              <div className='col-12 col-lg-6 pt-2 mb-3 px-xs-0'>
                <div className='card shadow rounded-xl border-none'>
                  <div className="card-body pp-30 login-card">
                    <h5>Wanna become an Advisor? <span>Sign up.</span></h5>
                    <form className='form pb-3'>
                      <div className='form-group pb-1'>
                        <label className='fw-700 pt-3'>Email Address <span className='text-red text-base'>*</span></label>
                        <input type="email" onChange={(e) => setEmail(e.target.value)} className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm" placeholder='Enter email address' />
                      </div>

                      <div className='form-group row pb-1'>
                        <div className='col-12 col-md-6 mb-2'>
                          <label className='fw-700 d-block'>Password <span className='text-red text-base'>*</span></label>
                          <input type={passwordType} onChange={(e) => setPassword(e.target.value)} className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm" placeholder='Password' />
                          <button type="button" className="btn" onClick={togglePassword} style={{ marginTop: '-94px', zIndex: '10' , position: 'absolute' , left: '72%' }}>
                            { passwordType==="password"? <i className="bi bi-eye-slash"></i> :<i className="bi bi-eye"></i> }
                          </button>  
                        </div>
                        <div className='col-12 col-md-6'>
                          <label className='fw-700 d-block'>Confirm Password <span className='text-red text-base'>*</span></label>
                          <input type={passwordCType} onChange={(e) => setConfirmPassword(e.target.value)} className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm" placeholder='Confirm Password' />
                          <button type="button" className="btn" onClick={toggleCPassword} style={{ marginTop: '-94px', zIndex: '10' , position: 'absolute' , left: '72%' }}>
                            { passwordCType==="password"? <i className="bi bi-eye-slash"></i> :<i className="bi bi-eye"></i> }
                          </button>  
                        </div>
                      </div>
                      <div className=''>
                        <Link onClick = {HandleSave} className='group relative flex w-full justify-center rounded-1 bg-purple-900 opacity-90 py-2 px-4 text-base font-medium text-white hover:btn-light'>Sign Up</Link>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <div className='container py-4'>
            <div className='row m-0'>
              <div className='col-12 col-md-4 positive-reviw'>
                <div className='d-flex justify-content-center'>
                  {featureImage1 && <img src={`${process.env.REACT_APP_BASE_URL}/${featureImage1}`} className='w-25' alt='Icon Avatar' /> }
                </div>
                <h3 className='text-center font-bold text-4xl mt-3'>{featureheadline1}</h3>
                <p className='text-center fsp-16 text-secondary lh-1'>{featuredesc1}</p>
              </div>
              <div className='col-12 col-md-4 positive-reviw'>
                <div className='d-flex justify-content-center'>
                  {featureImage2 && <img src={`${process.env.REACT_APP_BASE_URL}/${featureImage2}`} className='w-25' alt='Icon Avatar' /> }
                </div>
                <h3 className='text-center font-bold text-4xl mt-3'>{featureheadline2}</h3>
                <p className='text-center fsp-16 text-secondary lh-1'>{featuredesc2}</p>
              </div>
              <div className='col-12 col-md-4 positive-reviw'>
                <div className='d-flex justify-content-center'>
                  {featureImage3 && <img src={`${process.env.REACT_APP_BASE_URL}/${featureImage3}`} className='w-25' alt='Icon Avatar' /> }
                  {/* {!featureImage3 && <img src="assets/images/icons/309042_group_users_people_icon.svg" className='w-25' alt='Icon Avatar' /> } */}
                </div>
                <h3 className='text-center font-bold text-4xl mt-3'>{featureheadline3}</h3>
                <p className='text-center fsp-16 text-secondary lh-1'>{featuredesc3}</p>
              </div>
            </div>
          </div>
        </section>
    <FrontFooter/>
    </>
  );
}
