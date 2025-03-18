import React , {useEffect} from 'react';
import { useParams }  from 'react-router-dom';

export default function EmailValidation() {

  const params = useParams();  

  useEffect(() => {
      window.location.href = '/thank-you';
  },[]);

  return (
    <div>
          <center>Validating..........</center>
    </div>
  )
}