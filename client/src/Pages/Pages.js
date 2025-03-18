import React, { useState, useEffect } from 'react'
import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'
import axios from 'axios';
import Faq from "react-faq-component";

export default function Pages() { 

const styles = {
    bgColor: 'white',
    titleTextColor: "blue",
    rowTitleColor: "blue",
    rowContentColor: 'grey',
    // arrowColor: "red",
};

const config = {
    animate: true,
    // arrowIcon: "V",
    tabFocus: true
};

    const [data,setData] = useState({}) 

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BASE_URL}/admin/faqs/all`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
            },
        }).then(result => {
            setData({
                title: "FAQ (How it works)",
                rows: result.data.data
            });

        });
    }, []);

  return (
    <div>
        <FrontHeader/>
            <section className="mt-0 privacypage"  >
                <div className="container">
                    <div className="row">
                        <div className="col-12 col-md-6 px-4">
                            <div className="py-lg-5 pe-lg-5">
                                <h1 className="fw-400 fs-re-55"><span className="fw-bold text-pink">Faqs</span></h1>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container" >
                {data &&
                    <Faq
                    data={data}
                    styles={styles}
                    config={config}
                    />
                }
                </div>
            </section>
        <FrontFooter/>      
    </div>
  )
}
