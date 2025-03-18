import React , {useState,useEffect} from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'
import { getAidFromStorageToken } from '../Utils/storageHelper';

export default function AdvisorNotes() {
    const params = useParams();
    const [notes, setNotes] = useState([]);
    
    function getAdvisorId() {
      var advisor_id = getAidFromStorageToken();
      return advisor_id.id;
   }

    useEffect(() => {
        if(params.id) {
             const data = {
              "id1": params.id,
              "id2": getAdvisorId()
            }
      
            axios.post(`${process.env.REACT_APP_BASE_URL}/chat/getNotes`, data).then(result => {
               if(result.data.length > 0) {
                 setNotes(result.data);
               } else {
                 setNotes([]);
               }
            }).catch(err => {
      
            });
       }  
       },[]);
    
  return (
    <div>
      <FrontHeader/>
      <section className='mt-6 termsofuse Advisor-Notes'>
            <div className='container'>
                <h1 className='text-3xl'>Advisor Notes</h1>
                <div>
                {
                    notes && notes.map((item,index) => (
                      <div key={index}>
                       <center><h4 className='custom-text fsp-14 font-normal text-white text-left' style={{ background: '#c53676' }}>{ moment(item.id).format('MMM DD, YYYY') } </h4></center> 
                                {/* <hr className='font-bold text-purple'/> */}
                        <div className='notesmessage'>        
                  
                        {
                          item.messages.map((item2,index2) => (
                              <p key={index2}>{item2.notes}</p>
                          ))
                        }
                        </div>
                      </div>
                    ))
                  }
                </div>
            </div>
        </section>
      <FrontFooter/>
    </div>
  )
}