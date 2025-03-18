import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'

import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'
import axios from 'axios';
import swal from 'sweetalert';

export default function ConfirmCredit() {
    const navigate = useNavigate();
    const params = useParams();


    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BASE_URL}/admin/confirm-credit-link/${params.id}`).then(result => {

            swal('success', 'Succesfully Validated', 'success');
            navigate('/client-login')

        }).catch(err => {

            swal('success', 'Succesfully Validated', 'success');
            navigate('/client-login')
            
            // swal('Hello', err.response.data.message, 'error');
        });
    }, [params.id, navigate]);



    return (
        <div>
            <FrontHeader />
            <>
                <div>
                    validating..........
                </div>


            </>
            <FrontFooter />
        </div>
    )
}
