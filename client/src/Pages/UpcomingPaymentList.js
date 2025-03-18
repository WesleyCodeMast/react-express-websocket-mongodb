import React, { useState, useEffect } from 'react'
import FrontFooter from '../Frontend/FrontFooter'
import FrontHeader from '../Frontend/FrontHeader'
import { useNavigate} from 'react-router-dom';
import ReactPaginate from "react-paginate";
import * as moment from 'moment';
import axios from 'axios';

export default function UpcomingPaymentList() {

    let history = useNavigate();

    const [UpcomingDetails , setUpcomingDetails] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [page, setPage] = useState(1);
    let limit = 10;

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BASE_URL}/advisor/earnings?page=${page}&size=${limit}`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
            },
        }).then(result => {
            setUpcomingDetails(result.data.data);
            setPageCount(Math.ceil(parseInt(result.data.total) / parseInt(result.data.perPage)));
            setPage(result.data.page);
        })
    }, [limit, page])

    const paginationData = async (currentPage) => {
        const res = await fetch(
            `${process.env.REACT_APP_BASE_URL}/advisor/earnings?size=${limit}&page=${currentPage}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
            },
        }
        );
        return await res.json();
    };

    const handlePageClick = async (data) => {
        let currentPage = data.selected + 1;
        const result = await paginationData(currentPage);
        setUpcomingDetails(result.data);
    };

    const getFilterData = ({ client, advisor, created_date }) => {

        axios.get(`${process.env.REACT_APP_BASE_URL}/advisor/earnings?page=1&filter_client=${client}&filter_advisor=${advisor}&filter_created_at=${created_date}`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
            },
        }).then(result => {
            setUpcomingDetails(result.data.data);
            setPageCount(Math.ceil(result.data.total / result.data.perPage));
            setPage(result.data.page);
        });
    }

    const showInbox2 = () => {
       history('/advisor/dashboard?tab=9');
    }

  return (
    <div>
      <FrontHeader/>

        <div className='container'>
            <div className='row'>
                <div className='col-sm-12 col-12 Earning-List mt-20'>
                <button onClick={showInbox2} className="px-5 px-md-4 py-2 btn btn-primary rounded-1 ffp fsp-17 float-right"><i className="bi bi-arrow-left"></i> Back</button>
                <span className='text-pink fsp-22 font-bold mb-3 d-block'>Earnings List</span>
                    <div className="panel panel-default rounded-b-md mb-2">
                            <div className="panel-heading purple-background px-3 py-1.5 text-center text-xl rounded-t-md text-white">Revenues</div>
                            <div className="panel-body px-3 py-2.5 border-2 border-gray-200 rounded-b-md">
                            <div className='table-responsive'>
                                <table className="table Earningtable">
                                    <thead>
                                        <tr>
                                        <th scope="col" className='fsp-12'>Date</th>
                                        <th scope="col" className='fsp-12'>Client Paid</th>
                                        <th scope="col" className='fsp-12'>Username</th>
                                        <th scope="col" className='fsp-12'>Description</th>
                                        <th scope="col" className='fsp-12'>Earnings</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            UpcomingDetails && UpcomingDetails.map((itm,inx) => (
                                                <tr key={inx}>
                                                    <td className='fsp-12'>{ moment(itm.chat_date).format('MMM DD, YYYY') }</td>
                                                    <td className='fsp-12'>${itm.amount}</td>
                                                    <td className='fsp-12'>{ itm.client ? itm.client.username : '' }</td>
                                                    <td className='fsp-12'>Live chat</td>
                                                    <td><span className='fsp-12 text-pink font-semibold'>${itm.earning}</span></td>
                                                </tr>
                                            ))
                                        }
                                        
                                    </tbody>
                                </table>
                            </div>
                            </div>
                        </div>
                        <div className='cus-Pagination text-left'>
                                    
                        <ReactPaginate
                            previousLabel={"previous"}
                            nextLabel={"next"}
                            breakLabel={"..."}
                            pageCount={pageCount}
                            marginPagesDisplayed={2}
                            pageRangeDisplayed={3}
                            onPageChange={handlePageClick}
                            containerClassName={"pagination justify-content-center"}
                            pageClassName={"page-item"}
                            pageLinkClassName={"page-link"}
                            previousClassName={"page-item"}
                            previousLinkClassName={"page-link"}
                            nextClassName={"page-item"}
                            nextLinkClassName={"page-link"}
                            breakClassName={"page-item"}
                            breakLinkClassName={"page-link"}
                            activeClassName={"active"}
                        />

                        </div>
                </div>
            </div>
        </div>

      <FrontFooter/>
    </div>
  )
}
