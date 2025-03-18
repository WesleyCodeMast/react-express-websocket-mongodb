import axios from 'axios';
import swal from 'sweetalert';
import { Link } from 'react-router-dom'
import PhoneInput from 'react-phone-number-input'
import React, { useState, useEffect } from 'react'
import AdvisorHeader from '../Frontend/AdvisorHeader';
import ClientSignupStepFour from '../Components/ClientSignupStepFour';
import { CountryDropdown, RegionDropdown, CountryRegionData } from 'react-country-region-selector';

export default function ClientSignupStep() {
    const countryList = require('country-list');
    const [activeStep, setActiveStep] = useState(1);
    const [dob, setDob] = useState('');
    const [address, setAddress] = useState('');
    const [address2, setAddress2] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedFile, setSelectedFile] = useState()
    const [agreement, setAgreement] = useState();
    const [country,setCountry] = useState('');
    const [state,setState] = useState('');
    const [name,setName] = useState('');
    const [zipcode , setZipCode] = useState('');
    // const [password , setPassword] = useState('');
    // const [confirmPassword , setConfirmPassword] = useState('');
    const [userName , setUserName] = useState('');
    const [RatePerMinute , setRateMinute] = useState(0);
    const [categories,setCategories] = useState([]);
    const [category,setCategory] = useState('');
    
    const [checkTerms,setCheckTerm] = useState('');


    let curr = new Date();
    curr.setDate(curr.getDate());
    let date = curr.toISOString().substring(0, 10);
  

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/advisor-agreement`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem('accessToken')
            },
        }).then(result => {
            setAgreement(result.data.data.agreement);

        });
        axios.get(`${process.env.REACT_APP_BASE_URL}/admin/categories`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem('accessToken')
            },
        }).then(result => {
            if(result.data.data.length > 0) {
              setCategories(result.data.data);
            } else {
              setCategories([]);
            }
        });
    }, []);

    const onSelectFile = e => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    }

    const removeSelectedImage = () => {
      setSelectedFile();
    };

    const HandleSignup = () => {

        let formData = new FormData();
        formData.append("avatar", selectedFile);
        formData.append("name", localStorage.getItem('ad_name'));
        formData.append("displayname", localStorage.getItem('ad_userName'));
        formData.append("username", localStorage.getItem('ad_userName'));
        formData.append("email", localStorage.getItem('ad_email'));
        formData.append("password", localStorage.getItem('ad_p'));
        formData.append("phone", phone);
        formData.append("dob", dob);
        formData.append("address", address);
        formData.append("address2", address2);
        formData.append("zipcode", zipcode);
        formData.append("country", country);
        formData.append("password_confirmation", localStorage.getItem('ad_pc'));
        formData.append("rate_per_min", localStorage.getItem('ad_rpm'));
        formData.append("category", 1);

        if(checkTerms != '') {
            axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/auth/register`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }).then(result => {
                if (result.data.status === 200) {
                    localStorage.set('guest_advisor_id',result.data.id);
                    setActiveStep(4);

                        // const data = {
                        //     "email": localStorage.getItem('ad_email'),
                        // }
                 
                        // axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/auth/validate-email` , data , {
                        //   headers: {
                        //     'Accept': 'application/json, text/plain, */*',
                        //     'Content-Type': 'application/json'
                        //   },
                        // }).then(result => {
                        //     if(result.status === 201) {
                        //       swal("Oops", result.data.data, "error");     
                        //     } else {
                        //       setActiveStep(4);
                        //     }
                        //     else {
                        //         localStorage.removeItem('ad_name');
                        //         localStorage.removeItem('ad_userName');
                        //         localStorage.removeItem('ad_email');
                        //         localStorage.removeItem('ad_p');
                        //         localStorage.removeItem('ad_pc');
                        //         localStorage.removeItem('ad_rpm');
                        //         window.location.href = '/confirm-email';
                        //     }
                        // })
                        
                    // swal("success", "Registration Successfull", "success");
                    // setTimeout(() => {
                    //     window.location.href = '/thank-you';
                    // }, 1000);
                } else if (result.status === 203) {
                    if (result.data.data.errors) {
                        if (result.data.data.errors.dob) {
                            swal("Oops", "The dob field is required", "error");
                        }
                    }
                } else if (result.status === 201) {
                    if (result.data.error) {
                        swal("Oops", result.data.message, "error");
                    } else if (result.data.data) {
                        swal("Oops", result.data.data, "error");
                    }
                }
            }).catch(err => {
                if (err.response.data.error) {
                    swal("Oops", err.response.data.message, "error");
                } else if (err.response.data.message.errors) {
                    if (err.response.data.message.errors.email) {
                        swal("Oops", "Email is required", "error");
                    } else if (err.response.data.message.errors.name) {
                        swal("Oops", "Name is required", "error");
                    } else if (err.response.data.message.errors.username) {
                        swal("Oops", "UserName is required", "error");
                    }
                } else if (err.response.data.message.code === 11000) {
                    swal("Oops", "This email address is already registered", "error");
                }
    
            })
        } else {
            swal("Oops", "Please click on terms and conditions checkbox", "error");
        }
    }

    const HandleStep2 = () => {
        if(userName === '') {
            swal("Oops", "Username is required", "error");
        } else {

                const data = {
                    "email": localStorage.getItem('ad_email'),
                    "username": userName
                }
                    axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/auth/validate` , data , {
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    },
                    }).then(result => {
                        if(result.status === 201) {
                            swal("Oops", result.data.data, "error");     
                        } else {
                            localStorage.setItem('ad_name', userName);
                            localStorage.setItem('ad_userName', userName);
                            localStorage.setItem('ad_rpm', RatePerMinute);
                            setActiveStep(2);
                        }
                    });
        }
    }

    const onChangeAlphaNumericInput = (e) => {
       if (/[^0-9a-zA-Z]/.test(e.target.value)) {
            swal("oops","Only alphanumeric value accepted",'error');
            setUserName('');
       } else {
          setUserName(e.target.value);
       }
    }

    return (
        <div>
            <AdvisorHeader />
            <>
                <main>
                    <section className='my-4 signup-step'>
                        <div className='container'>
                            <div className='row p-0'>

                                 <div className={`col-12 col-md-8 offset-md-2 ${activeStep === 1 ? 'd-block' : 'd-none'}`}>
                                 <div className='card shadow border-0'>
                                        <div className='card-body p-0 py-3'>
                                            <div className='text-center'>
                                                <span className='text-secondary fsp-13'>STEP 1 OF 4</span>
                                            </div>
                                            <hr />
                                            <div className='form-group px-4 pt-3 pb-1'>
                                                <label className='fw-700 d-block'>Username <span className='text-red text-base'>*</span></label>
                                                <input type="text" value={userName} onChange={onChangeAlphaNumericInput} className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm" placeholder='Enter username' />
                                            </div>
                                            <div className='form-group px-4 row pb-1'>
                                                <div className='col-12 col-md-12 mb-2'>
                                                <label className='fw-700 d-block'>Legal Name <span className='text-red text-base'>*</span></label>
                                                <input type="text" onChange={(e) => setName(e.target.value)} className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm" placeholder='Enter display Name' />
                                                </div>
                                                {/* <div className='col-12 col-md-6'>
                                                <label className='fw-700 d-block'>Minute Rate (USD) <span className='text-red text-base'>*</span></label>
                                                <input type="number"  onChange={(e) => setRateMinute(e.target.value)} className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm" placeholder='Enter minute rate in USD' />
                                                </div> */}
                                            </div>
                                            {/* <div className='form-group px-4 row pb-1'>
                                                <div className='col-12 col-md-6 mb-2'>
                                                <label className='fw-700 d-block'>Password <span className='text-red text-base'>*</span></label>
                                                <input type="password"  onChange={(e) => setPassword(e.target.value)} className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm" placeholder='Password' />
                                                </div>
                                                <div className='col-12 col-md-6'>
                                                <label className='fw-700 d-block'>Confirm Password <span className='text-red text-base'>*</span></label>
                                                <input type="password"  onChange={(e) => setConfirmPassword(e.target.value)} className="relative block w-full appearance-none border-none bg-light-dark h-12 py-2 text-gray-900 placeholder-gray-500 text-sm" placeholder='Confirm Password' />
                                                </div>
                                            </div> */}
                                            <hr />
                                                <div className='d-flex justify-content-center align-items-center py-2'>
                                                    <button onClick={HandleStep2} className='group relative flex justify-center rounded-1 bg-purple-900 py-2 px-4 text-sm text-white hover:btn-light'>Continue</button>
                                                </div>
                                            </div>
                                     </div>  
                                </div>

                                {/* step one */}
                                <div className={`col-12 col-md-8 offset-md-2 ${activeStep === 2 ? 'd-block' : 'd-none'}`}>
                                    <div className='card shadow border-0'>
                                        <div className='card-body p-0 py-3'>
                                            <div className='text-center'>
                                                <span className='text-secondary fsp-13'>STEP 2 OF 4</span>
                                                <span className='d-block text-success fw-800 mt-2 mb-2'>Read the user agreement below</span>
                                            </div>
                                            <hr />
                                            <div className='px-3 overflow-scroll scrollbar-sm' style={{ height: '350px' }}>
                                                <div className='agreement-disc'>
                                                    <p className='fsp-13' dangerouslySetInnerHTML={{ __html: agreement}}></p>
                                                </div>
                                            </div>
                                            <hr />
                                            <div className='d-flex justify-content-center align-items-center py-2'>
                                                <button onClick={() => setActiveStep(1)} className='btn btn-secondary mx-2 px-3'><i className="bi bi-arrow-left"></i></button>
                                                <button onClick={() => setActiveStep(3)} className='group relative flex justify-center rounded-1 bg-purple-900 py-2 px-4 text-sm text-white hover:btn-light'>I accepted the agreement</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Step two */}
                                <div className={`col-12 col-md-8 offset-md-2 ${activeStep === 3 ? 'd-block' : 'd-none'}`}>
                                    <div className='card shadow border-0'>
                                        {/* <div className='card-body p-0 py-2'>
                                            <div className='text-center'>
                                                <span className='text-secondary fsp-13'>STEP 3 OF 4</span>
                                                <span className='d-block text-success fw-800 mt-2 mb-2'>Upload Proile Picture</span>
                                            </div>
                                            <hr />
                                            <div className='px-md-3 pt-2 pb-4'>
                                                <div className='text-center px-md-5 mb-5'>
                                                    <p className='px-4'>Client wants to know who you are. Upload your photo where your face is clearly visible. Say Cheese!</p>
                                                </div>
                                                <div className='d-flex justify-content-center align-items-center position-relative'>
                                                    <input
                                                        type="file"
                                                        name="avatar"
                                                        multiple="false"
                                                        onChange={onSelectFile}
                                                    />
                                                    {selectedFile && (
                                                        <div className='uploadimg'>
                                                            <img
                                                                src={URL.createObjectURL(selectedFile)}
                                                                alt="Thumb"
                                                                
                                                            />
                                                            <button onClick={removeSelectedImage}>
                                                                Remove This Image
                                                            </button>
                                                        </div>
                                                    )}
                                                    {
                                                    userPicture ? <div className='w-75 justify-content-center align-items-center d-flex border p-5 rounded'> <img src={userPicture.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }))[0].preview} alt="..." className='w-50 rounded' /> </div>
                                                        : <img src='/assets/images/avtar/upload_avtar.svg' alt="..." />
                                                }
                                                <div className='position-absolute bottom-0'>
                                                    <DropzoneField designType={1} onDrop={onDrop} text={userPicture ? 'Change Picture' : 'Browse Picture'} className="btn btn-outline-primary bg-white text-hover-primary mb-n2  px-4 rounded-1" />
                                                </div>
                                                </div>
                                            </div>
                                            <hr />
                                            <div className='d-flex justify-content-center align-items-center py-2'>
                                                <button onClick={() => setActiveStep(2)} className='btn btn-secondary mx-2 px-3'><i className="bi bi-arrow-left"></i></button>
                                                <button onClick={() => setActiveStep(4)} className='group relative flex justify-center rounded-1 bg-purple-900 py-2 px-4 text-sm text-white hover:btn-light'>Continue</button>
                                            </div>
                                        </div> */}
                                        <div className='card-body p-0 py-2'>
                                            <div className='text-center'>
                                                <span className='text-secondary fsp-13'>STEP 3 OF 4</span>
                                                {/* <span className='d-block text-success fw-800 mt-2 mb-2'>Upload Proile Picture</span> */}
                                            </div>
                                            <hr />
                                            <div className='px-3 pb-4'>
                                                <div className='text-center px-lg-5 mb-4 mt-3'>
                                                    <p className='px-lg-5 text-left'>Your profile is your business card. So client wants to know about your phone number and date of birth</p>
                                                    {/* <span className='d-block text-left text-success fw-800 mt-1 mb-2'>Phone Number & Date Of Birth</span> */}
                                                </div>
                                                <div className='mt-3 px-lg-5 clientstep3'>
                                                    <form className='px-lg-5'>
                                                    <div className='form-group px-lg-5'>
                                                    <label className='fw-700'>Upload Proile Picture <span className='text-red text-base'>*</span></label>  
                                                    <div className='uploadimg'>
                                                    <input
                                                        type="file"
                                                        className='form-control bg-light-dark h-12 border-0 rounded-1'
                                                        name="avatar"
                                                        multiple="false"
                                                        onChange={onSelectFile}
                                                    />
                                                    {selectedFile && (
                                                        <div className='uploadimg'>
                                                            <img
                                                                src={URL.createObjectURL(selectedFile)}
                                                                alt="Thumb"
                                                                
                                                            />
                                                            <button onClick={removeSelectedImage}>
                                                                Remove This Image
                                                            </button>
                                                        </div>
                                                    )}
                                                    {/* {
                                                    userPicture ? <div className='w-75 justify-content-center align-items-center d-flex border p-5 rounded'> <img src={userPicture.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }))[0].preview} alt="..." className='w-50 rounded' /> </div>
                                                        : <img src='/assets/images/avtar/upload_avtar.svg' alt="..." />
                                                }
                                                <div className='position-absolute bottom-0'>
                                                    <DropzoneField designType={1} onDrop={onDrop} text={userPicture ? 'Change Picture' : 'Browse Picture'} className="btn btn-outline-primary bg-white text-hover-primary mb-n2  px-4 rounded-1" />
                                                </div> */}
                                                </div>
                                                        </div>
                                                        <div className='form-group px-lg-5'>
                                                            <label className='fw-700'>Phone Number <span className='text-red text-base'>*</span></label>
                                                            <PhoneInput
                                                                  placeholder="Enter phone number"
                                                                  value={phone}
                                                                  className='form-control py-2 bg-light-dark border-0 h-12 rounded-1 mt-2' 
                                                                  onChange={setPhone} />
                        
                                                        </div>
                                                        <div className='form-group mt-4 px-lg-5'>
                                                            <label className='fw-700'>Date of Birth <span className='text-red text-base'>*</span></label>
                                                            <input type="date" name='dob' onChange={(e) => setDob(e.target.value)} max={date} className='form-control h-12 py-2 bg-light-dark border-0 rounded-1 mt-2' />
                                                        </div>
                                                        <div className='form-group mt-4 px-lg-5'>
                                                            <label className='fw-700'>Address <span className='text-red text-base'>*</span></label>
                                                            <textarea name='address' onChange={(e) => setAddress(e.target.value)} className="form-control text-sm mb-4 bg-light-dark" cols={2} rows={2} placeholder="Address" required></textarea>
                                                            <label className='fw-700'>Address Line 2</label>
                                                            <textarea name='address2' onChange={(e) => setAddress2(e.target.value)} className="form-control text-sm mb-4 bg-light-dark" cols={2} rows={2} placeholder="Address" required></textarea>
                                                            <div className='form-group mt-4 px-lg-5'>
                                                            
                                                        </div>
                                                       
                                                                <label className='fw-700'>Country</label>
                                                                <CountryDropdown
                                                                    className='form-control'
                                                                    value={country}
                                                                    onChange={(val) => setCountry(val)} 
                                                                    style={{ width: "100%" }}
                                                                />
                                                          
                                                                <label className='fw-700'>State</label>
                                                                <RegionDropdown
                                                                    className='form-control'
                                                                    country={country}
                                                                    value={state}
                                                                    onChange={(val) => setState(val)} 
                                                                    style={{ width: "100%" }}
                                                                />  
                                                            
                                                           
                                                            <label className='fw-700'>City</label>
                                                            <input type="text" name='city' onChange={(e) => setZipCode(e.target.value)} className='form-control py-2 bg-light-dark h-12 border-0 rounded-1 mb-4 mt-2' />
                                                            
                                                            {/* <select className="form-control text-sm mb-4 bg-light-dark h-12 rounded-0" onChange={(e) => setCountry(e.target.value)}>
                                                                <option>Select Country</option> 
                                                                {
                                                                     countryList.getData().map((cont,index) => (
                                                                        cont.code === country ?
                                                                        <option value={cont.code} key={index} selected>{cont.name}</option>
                                                                        :
                                                                        <option value={cont.code} key={index}>{cont.name}</option>
                                                                    ))
                                                                }
                                                            </select>  */}
                                                            
                                                            <label className='fw-700'>Zip Code</label>
                                                            <input type="text" name='zipcode' onChange={(e) => setZipCode(e.target.value)} className='form-control py-2 bg-light-dark h-12 border-0 rounded-1 mt-2' />
                                                       
                                                        </div>

                                                        <div className='text-left'>
                                                            <label className="font-semibold inline-flex">
                                                                <input
                                                                id="customCheckLogin"
                                                                type="checkbox"
                                                                onChange={(e) => setCheckTerm(e.target.value)}
                                                                className="form-checkbox border-1 rounded text-blueGray-700 ml-1 w-5 h-5 ease-linear transition-all duration-150"
                                                                />
                                                                <span className="ml-2 text-sm font-semibold text-blue Gray-600 ">
                                                                I have read and agree to disclaimer {" "}
                                                                <a
                                                                    target="_blank"
                                                                    href="/pages/member-terms-and-conditions"
                                                                    className="text-regal-blue"
    
                                                                >
                                                                    member terms of use
                                                                </a>
                                                                </span>
                                                            </label>
                                                        </div>

                                                    </form>
                                                </div>
                                            </div>
                                            <hr />
                                            <div className='d-flex justify-content-center align-items-center py-2'>
                                                <div className='d-flex'>
                                                    <button onClick={() => setActiveStep(2)} className='btn btn-secondary mx-2 px-3'><i className="bi bi-arrow-left"></i></button>
                                                    <button onClick={HandleSignup} className='group relative flex justify-center rounded-1 bg-purple-900 py-2 px-4 text-sm text-white hover:btn-light'>Continue</button>
                                                    {/* <Link onClick={HandleSignup} className='group relative flex justify-center rounded-1 bg-purple-900 py-2 px-4 text-sm text-white hover:btn-light'>Submit</Link> */}
                                                </div>
                                            </div>
                                            
                                        </div>

                                        
                                    </div>
                                </div>
                                {/* Step three */}
                                <div className={`col-12 col-md-8 offset-md-2 ${activeStep === 4 ? 'd-block' : 'd-none'}`}>
                                    <div className='card shadow border-0'>
                                        <div className='card-body p-0 py-2'>
                                            <div className='text-center'>
                                                <span className='text-secondary fsp-13'>STEP 4 OF 4</span>
                                                {/* <span className='d-block text-success fw-800 mt-1 mb-2'>Phone Number & Date Of Birth</span> */}
                                            </div>
                                            <hr />
                                            <div className='px-3 pb-4'>
                                                {/* <div className='text-center px-lg-5 mb-4 mt-3'>
                                                    <p className='px-lg-4'>Your profile is your business card. So client wants to know about your phone number and date of birth</p>
                                                </div>
                                                <div className='mt-3 px-lg-5'>
                                                    <form className='px-lg-5'>
                                                        <div className='form-group px-lg-5'>
                                                            <label className='fw-700'>Phone Number <span className='text-red text-base'>*</span></label>
                                                            <PhoneInput
                                                                  placeholder="Enter phone number"
                                                                  value={phone}
                                                                  className='form-control py-2 bg-light-dark border-0 h-12 rounded-1 mt-2' 
                                                                  onChange={setPhone} />
                        
                                                        </div>
                                                        <div className='form-group mt-4 px-lg-5'>
                                                            <label className='fw-700'>Date of Birth <span className='text-red text-base'>*</span></label>
                                                            <input type="date" name='dob' onChange={(e) => setDob(e.target.value)} max={date} className='form-control h-12 py-2 bg-light-dark border-0 rounded-1 mt-2' />
                                                        </div>
                                                        <div className='form-group mt-4 px-lg-5'>
                                                            <label className='fw-700'>Address <span className='text-red text-base'>*</span></label>
                                                            <textarea name='address' onChange={(e) => setAddress(e.target.value)} className="form-control text-sm mb-4 bg-light-dark" cols={2} rows={2} placeholder="Address" required></textarea>
                                                            <label className='fw-700'>Address Line 2</label>
                                                            <textarea name='address2' onChange={(e) => setAddress2(e.target.value)} className="form-control text-sm mb-4 bg-light-dark" cols={2} rows={2} placeholder="Address" required></textarea>
                                                            <label className='fw-700'>Country</label>
                                                            <select className="form-control text-sm mb-4 bg-light-dark h-12 rounded-0" onChange={(e) => setCountry(e.target.value)}>
                                                                <option>Select Country</option> 
                                                                {
                                                                     countryList.getData().map((cont,index) => (
                                                                        cont.code === country ?
                                                                        <option value={cont.code} key={index} selected>{cont.name}</option>
                                                                        :
                                                                        <option value={cont.code} key={index}>{cont.name}</option>
                                                                    ))
                                                                }
                                                            </select> 
                                                            <label className='fw-700'>Zip Code</label>
                                                            <input type="text" name='zipcode' onChange={(e) => setZipCode(e.target.value)} className='form-control py-2 bg-light-dark h-12 border-0 rounded-1 mt-2' />
                                                       
                                                        </div>

                                                        <div>
                                                            <label className="font-semibold inline-flex">
                                                                <input
                                                                id="customCheckLogin"
                                                                type="checkbox"
                                                                onChange={(e) => setCheckTerm(e.target.value)}
                                                                className="form-checkbox border-1 rounded text-blueGray-700 ml-1 w-5 h-5 ease-linear transition-all duration-150"
                                                                />
                                                                <span className="ml-2 text-sm font-semibold text-blue Gray-600 ">
                                                                I have read and agree to disclaimer {" "}
                                                                <a
                                                                    target="_blank"
                                                                    href="/pages/member-terms-and-conditions"
                                                                    className="text-regal-blue"
    
                                                                >
                                                                    member terms of use
                                                                </a>
                                                                </span>
                                                            </label>
                                                        </div>

                                                    </form>
                                                </div> */}
                                                <ClientSignupStepFour />
                                            </div>
                                            <hr />
                                            <div className='d-flex justify-content-center align-items-center py-2'>
                                                <div className='d-flex'>
                                                    <button onClick={() => setActiveStep(3)} className='btn btn-secondary mx-2 px-3'><i className="bi bi-arrow-left"></i></button>
                                                    <Link onClick={HandleSignup} className='group relative flex justify-center rounded-1 bg-purple-900 py-2 px-4 text-sm text-white hover:btn-light'>Submit</Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Step four */}
                                {/* <div className={`col-12 col-md-8 offset-md-2 ${activeStep === 4 ? 'd-block' : 'd-none'}`}>
                                <div className='card shadow border-0'>
                                    <div className='card-body p-0 py-2'>
                                        <div className='text-center'>
                                            <span className='text-secondary fsp-13'>STEP 4 OF 5</span>
                                            <span className='d-block text-success fw-800 mt-1'>ID Verification</span>
                                        </div>
                                        <hr />
                                        <div className='text-center px-2 px-lg-5 my-4'>
                                            <span className='text-primary fw-700 fs-6'>Select the documents you want to upload</span>
                                            <p className='px-lg-4 fsp-13'>We will use this to verify your account</p>
                                        </div>
                                        <hr />
                                        <div className='px-3 pb-4'>
                                            <div className='container px-lg-5'>
                                                <div className='row mb-4'>
                                                    <div className='col-12 col-md-6 ps-lg-4 pe-4'>
                                                        <div className='row border rounded-1 p-3'>
                                                            <div className='col-2 justify-content-center align-items-center d-flex'>
                                                                <img src='assets/images/icons/awesome-passport.svg' alt="..." />
                                                            </div>
                                                            <div className='col-10'>
                                                                <span className='d-block lh-1'>Passport</span>
                                                                <span className='fsp-11 text-secondary lh-1'>Lorem ipsum dolore</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='col-12 col-md-6 pe-4 pe-lg-5 ps-lg-4 mt-3 mt-md-0'>
                                                        <div className='row border rounded-1 p-3'>
                                                            <div className='col-2 justify-content-center align-items-center d-flex'>
                                                                <img src='assets/images/icons/Subtraction.svg' alt="..." />
                                                            </div>
                                                            <div className='col-10'>
                                                                <span className='d-block lh-1'>ID Card</span>
                                                                <span className='fsp-11 text-secondary lh-1'>Dolore set amet</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Divider className='text-primary fw-700'>Upload ID Card</Divider>
                                                <div className='row mt-3 px-lg-5'>
                                                    <div className='col-12 col-md-6 text-center'>
                                                        <span className='text-secondary fw-500'>FRONT SIDE</span>
                                                        <div className='mt-3'>
                                                            <div className='rounded-3 py-4' style={{ border: '2px dashed #f1f1f1' }}>
                                                                <img src='assets/images/icons/feather-upload-cloud.svg' alt="..." />
                                                                <span className='d-block fsp-13'>Drag and drop your files here or</span>
                                                                <button className='btn border-0 bg-white text-primary'>Upload file</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='col-12 col-md-6 text-center mt-4 mt-md-0'>
                                                        <span className='text-secondary fw-500'>BACK SIDE</span>
                                                        <div className='mt-3'>
                                                            <div className='rounded-3 py-4' style={{ border: '2px dashed #f1f1f1' }}>
                                                                <img src='assets/images/icons/feather-upload-cloud.svg' alt="..." />
                                                                <span className='d-block fsp-13'>Drag and drop your files here or</span>
                                                                <button className='btn border-0 bg-white text-primary'>Upload file</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <hr />
                                        <div className='d-flex justify-content-center align-items-center py-2'>
                                            <div className='d-flex'>
                                                <button onClick={() => setActiveStep(3)} className='btn btn-secondary mx-2 px-3'><i className="bi bi-arrow-left"></i></button>
                                                <button onClick={() => setActiveStep(5)} className='btn btn-primary rounded-1 py-2_5 px-5'>Save and Next</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div> */}
                                {/* Step five */}
                                <div className={`col-12 col-md-8 offset-md-2 ${activeStep === 6 ? 'd-block' : 'd-none'}`}>
                                    <div className='card shadow border-0'>
                                        <div className='card-body p-0 py-2'>
                                            <div className='text-center'>
                                                <span className='text-secondary fsp-13'>STEP 5 OF 5</span>
                                                <span className='d-block text-success fw-800 mt-1'>ID Verification</span>
                                            </div>
                                            <hr />
                                            <div className='px-4'>
                                                <span className='text-primary fw-600'>Add Your Work Experience</span>
                                                <p className='fsp-14'>Adding you work experience increase your chance to be chosen by employers</p>
                                                <form>
                                                    <div className='form-group row'>
                                                        <div className='col-12 col-md-6'>
                                                            <label className='fw-600'>In which industry?</label>
                                                            <select className='form-select border-0 rounded-1 py-2_5 bg-light-dark'>
                                                                <option>Select</option>
                                                            </select>
                                                        </div>
                                                        <div className='col-12 col-md-6'>
                                                            <label className='fw-600'>At which company?</label>
                                                            <select className='form-select border-0 rounded-1 py-2_5 bg-light-dark'>
                                                                <option>Select</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className='form-group mt-3'>
                                                        <label className='fw-600'>Location</label>
                                                        <input type="text" className='form-control border-0 rounded-1 py-2_5 bg-light-dark' />
                                                    </div>
                                                    <div className='form-group row mt-3 mb-5'>
                                                        <div className='col-12 col-md-6'>
                                                            <label className='fw-600'>From</label>
                                                            <input type="date" className="form-control border-0 rounded-1 py-2_5 bg-light-dark" />
                                                        </div>
                                                        <div className='col-12 col-md-6'>
                                                            <label className='fw-600'>To</label>
                                                            <input type="date" className="form-control border-0 rounded-1 py-2_5 bg-light-dark" />
                                                        </div>
                                                    </div>
                                                    <span className='text-primary fw-600'>In which position(s) did you work here?</span>
                                                    <div className='form-group row mt-3 mb-4'>
                                                        <div className='col-4 mt-1'>
                                                            <div className="form-check">
                                                                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                                                                <label className="form-check-label" htmlFor="flexCheckDefault">
                                                                    Delivery Forklift driver
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className='col-4 mt-1'>
                                                            <div className="form-check">
                                                                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                                                                <label className="form-check-label" htmlFor="flexCheckDefault">
                                                                    Mover
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className='col-4 mt-1'>
                                                            <div className="form-check">
                                                                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                                                                <label className="form-check-label" htmlFor="flexCheckDefault">
                                                                    Order Picker
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className='col-4 mt-1'>
                                                            <div className="form-check">
                                                                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                                                                <label className="form-check-label" htmlFor="flexCheckDefault">
                                                                    Forklift driver
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className='col-4 mt-1'>
                                                            <div className="form-check">
                                                                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                                                                <label className="form-check-label" htmlFor="flexCheckDefault">
                                                                    Warehouse Assistant
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                            <hr />
                                            <div className='d-flex justify-content-center align-items-center'>
                                                <button className='btn btn-outline-primary rounded-1 px-5 py-2_5'><i className="bi bi-plus-circle-fill me-2"></i>Add Another Experience</button>
                                            </div>
                                            <hr />
                                            <div className='d-flex justify-content-center align-items-center py-2'>
                                                <div className='d-flex'>
                                                    <button onClick={() => setActiveStep(4)} className='btn btn-secondary mx-2 px-3'><i className="bi bi-arrow-left"></i></button>
                                                    <Link to="/advisor/dashboard" className='btn btn-primary rounded-1 py-2_5 px-5'>Save and Next</Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </>

        </div>
    )
}
