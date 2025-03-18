import React, { useEffect } from 'react'
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom'

export default function StripeConnectSuccess() {

  let { id } = useParams();

    const navigate = useNavigate();

    useEffect(() => {

      const params = {
        stripe_customer_id: id
      }

      axios.post(`${process.env.REACT_APP_BASE_URL}/advisor/save-stripe-connect`, params, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      }).then(result => {
        navigate('/advisor/dashboard')
      })
    }, [id, navigate]);

  return (
    <div>
      updating data........
    </div>
  )
}
