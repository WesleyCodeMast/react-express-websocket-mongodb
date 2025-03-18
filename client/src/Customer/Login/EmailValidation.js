import React from 'react';
import { useParams } from 'react-router-dom';
import swal from 'sweetalert';
import axios from 'axios';

export default function EmailValidation() {

  const params = useParams();

  axios.get(`${process.env.REACT_APP_BASE_URL}/client/auth/confirm-email/${params.id}`).then(result => {
      swal('success', 'Succesfully Validated', 'success');
      window.location = '/client-login';
  }).catch(err => {
     swal('oops', err.response.data.message, 'error');
  })
  
  return (
    <div>
          validating..........
    </div>
  )
}