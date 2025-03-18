import React, { useState } from 'react';
import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'

export default function Client() {
  const [askUsFormData, setAskUsFormData] = useState({ firstName: '', lastName: '', company: '', email: '', phoneNumber: '', sector: '', workforce: '' });
  const inputsValueHandel = (e) => {
    setAskUsFormData({ ...askUsFormData, [e.target.name]: e.target.value })
  }
  return (
    <div>
      <FrontHeader/>
      <>
      <section className="mt-0 mt-lg-4">
        <div className='container'>
          <div className='row'>
            <div className='col-12 col-lg-7 pt-6 px-3 px-lg-0'>
              <div className="py-lg-5">
                <h1 className="fw-500 fs-re-55 mt-0 mt-lg-2"><span className="fw-bold text-primary-dark">Get advisors</span> for your gigs</h1>
                <p className="fsp-18 text-black">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut finibus nisi eu risus consectetur maximus. Maecenas consectetur nisl a arcu aliquam, convallis varius augue. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut finibus nisi eu risus Consectetur.</p>
                <div className='mt-5 mb-5 mb-lg-0'>
                  <button className="btn btn-primary px-4 px-lg-4 py-2 rounded-1 me-1 mb-lg-0 fsp-17">Find Advisor</button>
                </div>
              </div>
            </div>
            <div className='col-12 col-lg-5 mt-4 ps-lg-5 ps-lg-3 p-0 '>
              <div className='w-100 h-100 rounded-4' style={{ background: 'url(assets/images/frontend/employers/NoPath.png)', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',backgroundSize:'cover' }}></div>
            </div>
          </div>
        </div>
      </section>

      <section className='py-7' style={{ background: '#f1f1f1' }}>
        <div className='container'>
          <div className='row p-0'>
            <div className='col-12 col-lg-6 px-4 pe-lg-5 pt-3'>
              <img src='assets/images/frontend/employers2.png' className="rounded-4 w-100" alt="home page" />
            </div>
            <div className='col-12 col-lg-6 px-4 px-lg-0'>
              <div className='mt-5'>
                <h2 className='fw-bold fsp-30'>Backup is just one click away</h2>
                <p className='mt-4 fsp-18'>In urgent need of additional staff for you even, retail, logistics, delivery, cleaning or hospitality gig? Find freelancers via Flexworq with just one click.</p>
              </div>
              <div className='mt-5'>
                <h2 className='fw-bold fsp-30'>Select your Advisors</h2>
                <p className='mt-4 fsp-18'>Your online dashboard allows you to carefully select the best advisors without involvement of an employer agency. Our platform never sleeps and you're always in charge. Would you rather have some help. We here for you.</p>
              </div>
              <div className='mt-5'>
                <h2 className='fw-bold fsp-30'>Transparent costs</h2>
                <p className='mt-4 fsp-18'>Find people you need vie Flemvong - motivated end qualified. And the cote? You pay C3.50 per worked hour to Temper, regardless of the hourly rate. Nothing else.</p>
              </div>
              <div className='mt-4 d-block d-md-flex'>
                <button className='btn btn-primary px-4 py-2 rounded-1 fsp-17 fw-500 d-block mb-2'>Find Advisor</button>
                
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className='sectionBg mt-0' style={{ backgroundImage: "url('assets/images/background/Group.jpg')" }} >
        <div className='d-flex'>
          <div className='d-block m-auto pt-5'>
            <h1 className='py-3 fsp-45 text-light fw-600 text-center'>Start finding flexible Advisors</h1>
            <div className='d-flex pb-5 pt-3'>
              <button className='btn btn-light text-pink fw-600 py-2 px-4 m-auto fsp-17'>Get started right away</button>
            </div>
          </div>
        </div>
      </section>
      <section className='pt-7 pb-4 mt-1'>
        <div className='container d-flex'>
          <div className='row p-0 m-auto'>
            <h1 className='text-center fs-re-55 mb-4'>Ask us <span className='text-pink fw-bold'>anything</span></h1>
            <p className='text-center fsp-18 fw-500'>The process? The product or the pricing? We're here to answer any question you might have. Please leave your details, then we will get back to you as soon as possible.</p>
            <div className='d-flex mt-4'>
              <form className='wrv-50 m-auto'>
                <div className='form-group mb-2'>
                  <label className='my-1 fw-bold fsp-13'>Name</label>
                  <div className='row'>
                    <div className='col-12 col-lg-6'>
                      <input type="text" name="firstName" onChange={inputsValueHandel} className='form-control py-2 mt-2' placeholder="Enter your first name" value={askUsFormData.firstName} />
                    </div>
                    <div className='col-12 col-lg-6'>
                      <input type="text" name="lastName" onChange={inputsValueHandel} className='form-control py-2 mt-2' placeholder="Enter your last name" value={askUsFormData.lastName} />
                    </div>
                  </div>
                </div>
                <div className='form-group mb-3'>
                  <label className='fw-bold fsp-13'>Company</label>
                  <input type="text" name="company" onChange={inputsValueHandel} className='form-control py-2' placeholder="Enter your company name" value={askUsFormData.company} />
                </div>
                <div className='form-group mb-3'>
                  <label className='fw-bold fsp-13'>Email Address</label>
                  <input type="text" name="email" onChange={inputsValueHandel} className='form-control py-2' placeholder="Enter your email address" value={askUsFormData.email} />
                </div>
                <div className='form-group mb-3'>
                  <label className='fw-bold fsp-13'>Phone number</label>
                  <input type="text" name="phoneNumber" onChange={inputsValueHandel} className='form-control py-2' placeholder="Enter your phone number" value={askUsFormData.emaphoneNumberil} />
                </div>
                <div className='form-group mb-3'>
                  <label className='fw-bold fsp-13'>Sector</label>
                  <select className='form-select py-2 select-arrow-dark'>
                    <option>Select</option>
                  </select>
                </div>
                <div className='form-group mb-3'>
                  <label className='fw-bold fsp-13'>Size of flexible workforce</label>
                  <select className='form-select py-2 select-arrow-dark'>
                    <option>Select</option>
                  </select>
                </div>
                <div className='form-check'>
                  <input type="checkbox" className="form-check-input" />
                  <label className="form-check-label ms-2 fsp-15">I give Flexworq permission to keep me informed about relevant updates and developments via marketing e-mails. You can always unsubscribe from this.</label>
                </div>
                <div className='d-flex pt-5'>
                  <button className='btn btn-primary px-4 py-2 m-auto rounded-1 fsp-17'>Contact me about Advisor</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      </>
      <FrontFooter/>
    </div>
  )
}
