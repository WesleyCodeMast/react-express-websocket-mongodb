import React , { useEffect } from 'react';
import 'owl.carousel/dist/assets/owl.carousel.css';
import 'owl.carousel/dist/assets/owl.theme.default.css';
import FrontFooter from '../Frontend/FrontFooter';
import FrontHeader from '../Frontend/FrontHeader';
import { Link } from 'react-router-dom';

function AdvisorPage(props) {

  useEffect(() => {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    })
 }, []);

    return (
        <div>
            <FrontHeader/>
            <>
 
            <section className='mt-2 advisorpage'>
              <div className='container'>
                <div className='row'>
                  <div className='col-12 col-lg-12 text-center'>
                    <h1 className="main-head-color mobile-advisor-card text-pink">Become an Advisor</h1>
                    {/* <div className='pink-border'></div> */}
                    <div className='start-simple'>
                      <div className='container'>
                        <h2 className='text-center'>Start <span>Very Simple</span></h2>
                        <div className='row'>
                          <div className='col-12 col-md-6 px-4 px-lg-2 px-xl-5'>
                            <div className='pt-5'>
                              <h4>Create Your Profile</h4>
                              <p>Discover exciting openings and apply today!</p>
                            </div>
                          </div>
                          {/* <div className='col-12 col-md-4 px-4 px-lg-2 px-xl-5'>
                            <div className='pt-5'>
                              <h4>Claim a shift</h4>
                              <p>Search in the largest offer of jobs. Weekly some 20,000. Choose the one that suits you best.</p>
                            </div>
                          </div> */}
                          <div className="col-12 col-md-6 px-4 px-lg-2 px-xl-5">
                            <div className='pt-5'>
                              <h4>Ready? Set? Go!</h4>
                              <p>Unleash your expertise and make a difference.</p>
                            </div>
                          </div>
                        </div>
                          <div className="text-center advisor-bottom-button">
                            {/* <Link to="/advisor-login" className="btn btn-purple create-account">Advisor Login</Link> */}
                            <Link to="/advisor-signup" className="btn btn-light create-account">Create an Advisor Account</Link>
                          </div>
                        
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* <section>
              <div className='container'>
                <div className='row'>
                  <div className='col-12 col-lg-12 text-center'>
                    <div className='mt-2 card-background' style={{ background: 'url(assets/images/frontend/card-bg.jpg)', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' }}>
                      <img src='assets/images/frontend/fran-card.png' alt='card' className='mx-auto fran-card' /> 
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className='Confidential'>
              <div className='container'>
                <div className='row'>
                  <div className='col-12 col-lg-12 text-center'>
                    <h2 className='main-head-color text-pink'>Confidential! </h2>
                    <h3 className='main-head-color'>Paid Chat - Talk Comfortably!</h3>
                    <img src='assets/images/frontend/chat-panel.png' alt='chat' className='mx-auto chat-panel' />
                  </div>
                </div>
              </div>
            </section>
            <section className='how-work'>
              <div className='container'>
              <h3 className='main-head-color text-center'>How it Works</h3>
              <div className='pink-border'></div>
                <div className='row mt-5'>
                  <div className='col-12 col-lg-6'>
                    <div className='Disc'>
                    <h3>Sign Up</h3>
                    <p>Start by signing up for Chat with client</p>
                    </div>
                  </div>
                  <div className='col-12 col-lg-6'>
                    <img src='assets/images/frontend/signup.png' alt='Sign Up'/>
                  </div>
                </div>
                <div className='row'>
                  <div className='col-12 col-lg-6' id='minut-rate'>
                    <img src='assets/images/frontend/rate-fee.png' alt='Rate Fee' />
                  </div>
                  <div className='col-12 col-lg-6'id='minut-rate-img'>
                    <div className='Disc'>
                      <h3>Set your per-minute rate fees</h3>
                      <p>Curabitur luctus purus tellus, id cursus nulla bibendum id, Aenean quis ullamcorper lacus, eget tincidunt lectus. Vivamus turpis</p>
                    </div>
                  </div>
                </div>
                <div className='row'>
                  <div className='col-12 col-lg-6'>
                    <div className='Disc'>
                    <h3>Set your Availability</h3>
                    <p>You can easily work from everywhere anytime.</p>
                    </div>
                  </div>
                  <div className='col-12 col-lg-6'>
                    <img src='assets/images/frontend/set-time.png' alt='Set Time' />
                  </div>
                </div>
                <div className='row'>
                  <div className='col-12 col-lg-6' id='set-profile'>
                    <img src='assets/images/frontend/set-profile.png' alt='Set Profile' />
                  </div>
                  <div className='col-12 col-lg-6' id='set-profile-img'>
                    <div className='Disc'>
                      <h3>Set Profile Up</h3>
                      <p>Identify your specializations and reach out to your targeted clients.</p>
                    </div>
                  </div>
                </div>
                <div className='row'>
                  <div className='col-12 col-lg-6'>
                    <div className='Disc'>
                    <h3>Get Paid</h3>
                    <p>You are your own boss!</p>
                    </div>
                  </div>
                  <div className='col-12 col-lg-6'>
                    <img src='assets/images/frontend/get-paid.png' alt='Get Paid' />
                  </div>
                </div>
              </div>
            </section>    */}
            </>
            <FrontFooter />
        </div>
    );
}

export default AdvisorPage;