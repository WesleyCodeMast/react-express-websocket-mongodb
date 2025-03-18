import React, { useState, useEffect } from 'react'
import { useNavigate , useLocation } from 'react-router-dom';
import FrontFooter from '../Frontend/FrontFooter';
import FrontHeader from '../Frontend/FrontHeader';
import axios from 'axios';
import swal from 'sweetalert';


export default function Contact() {

  const navigate = useNavigate();

  const [name, setName] = useState();
  const [phone, setPhone] = useState();
  const [email, setEmail] = useState();
  const [issue, setIssue] = useState();
  const [banner, setBanner] = useState();
   const [contactTitle, setContactTitle] = useState('');
    const [supportEmail, setSupportEmail] = useState('');

  const { pathname } = useLocation();

  useEffect(() => {
    const body = document.querySelector('#root');
    body.scrollIntoView({
        behavior: 'smooth'
    }, 500)

 }, [pathname]);


useEffect(() => {

        axios.get(`${process.env.REACT_APP_BASE_URL}/admin/upload-banners/contactus`).then(result => {
            if (result.status === 200) {
                setBanner(result.data.data.image);
                setContactTitle(result.data.data.contact_title);
            setSupportEmail(result.data.data.support_email);
            }
        }).catch(err => {
            console.log(err);
        })

    }, []);


  const handleSubmit = (e) => {
    e.preventDefault();

    let userType = 'contact';

    if (localStorage.getItem('advisorToken')) {
      userType = 'advisor';
    }

    if (localStorage.getItem('clientToken')) {
      userType = 'customer';
    }




    const formData = {
      name: name,
      phone: phone,
      email: email,
      user_type: userType,
      issue: issue,
    }

    axios.post(`${process.env.REACT_APP_BASE_URL}/frontend/tickets`, formData, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    }).then(res => {
      if (res.data.success === true) {
        swal("Enquiry is successfully sent to the admin", "success");
        navigate(`/`);

      } else if (res.data.error) {
        swal(res.data.error.message, "error");

      }
    });

  }


  return (
    <div>
      <FrontHeader />
      <section className='mt-0 p-3 p-lg-5 contact' style={{ background: '#F3F5F7' }}>
      <div className='container bg-white p-0'>
          <div className='w-full h-auto'>
          {banner ?
          <img src={`${process.env.REACT_APP_BASE_URL}/${banner}`} alt="User Profile" />
          :
          <img src='assets/images/frontend/contact-bg.jpg' className='mx-auto' alt="Contact Us" />
        }
          </div>
      </div>
      <div className='container bg-white p-0'>
          <div className='row'>
              <div className='col-sm-12 col-12'>
                <div className='grid-box text-center p-2 p-lg-4'>
                  <i className="bi bi-envelope"></i>
                  <h3 className='text-xl pt-1 pb-2 font-medium'>Support</h3>
                  <a href='mailto:contact@gmail.com' className='text-base font-normal text-black'>{supportEmail}</a>
                </div>
              </div>
          </div>
      </div>
        <div className='container bg-white p-3 p-lg-5'>
          <h1 className='text-pink text-3xl text-center font-bold mb-4'>{contactTitle}</h1>
          <div className='row'>
            <div className='col-lg-12 col-12'>
              <div className='contactform'>
                <form method='post' className='profileinfo' onSubmit={handleSubmit}>
                  <div className="form-group mb-3">
                    <label className="col-form-label text-black font-medium text-base">Name</label>
                    <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} name='name' />
                  </div>
                  <div className="form-group mb-3">
                    <label className="col-form-label text-black font-medium text-base">Email</label>
                    <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} name='email' />
                  </div>
                  <div className="form-group mb-3">
                    <label className="col-form-label text-black font-medium text-base">Mobile Number</label>
                    <input type="number" className="form-control" required value={phone} onChange={(e) => setPhone(e.target.value)} name='number' />

                  </div>
                  <div className="form-group mb-3">
                    <label className="col-form-label text-black font-medium text-base">Message</label>
                    <textarea className="form-control" value={issue} required onChange={(e) => setIssue(e.target.value)} cols={5} rows={5}></textarea>
                  </div>
                  <div className='fonm-group mt-3 mb-3 text-center'>
                    <button type="submit" className="px-4 px-md-4 py-1.5 btn btn-light rounded-1 mt-2 mb-2 ffp fsp-17">Submit</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

      </section>
      <FrontFooter />
    </div>
  )
}
