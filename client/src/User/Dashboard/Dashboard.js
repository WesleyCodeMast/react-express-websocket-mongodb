import React, { useState, useEffect } from 'react'
import AdminNavbar from '../../Components/Admin/Navbar/AdminNavbar'
import HeaderStats from '../../Components/Admin/Cards/HeaderStats'
import FooterAdmin from '../../Components/Admin/Footer/FooterAdmin'
import GeneralUsers from '../../Components/Admin/Cards/GeneralUsers';
import RecentTickets from '../../Components/Admin/Cards/RecentTickets';
import UserSidebar from '../../Components/Admin/Sidebar/UserSidebar';
import axios from 'axios';

export default function Dashboard() {
    const [clientCount, setClientCount] = useState();
    const [advisorCount, setAdvisorCount] = useState();
    const [ticketCount, setTicketCount] = useState();
    const [tickets, setTickets] = useState();
    const [clients, setClients] = useState();
    const [advisors, setAdvisors] = useState();

    function getDashboardInfo() {
        axios.get(`${process.env.REACT_APP_BASE_URL}/admin/dashboard`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ` + localStorage.getItem('accessToken')
            },
        }).then(result => {
            setClients(result.data.data.customers);
            setAdvisors(result.data.data.advisors);
            setClientCount(result.data.data.customers_count);
            setClientCount(result.data.data.customers_count);
            setAdvisorCount(result.data.data.advisors_count);
            setTickets(result.data.data.tickets);
            setTicketCount(result.data.data.tickets_count);

        });

    }

    useEffect(() => {
        getDashboardInfo();
    }, []);

    return (
        <div className="relative md:ml-64 bg-default-skin">
            <UserSidebar />
            <AdminNavbar />
            <HeaderStats clientCount={clientCount} advisorCount={advisorCount} ticketCount={ticketCount} />
            <div className="flex flex-wrap mt-4">
                <div className="w-full mb-12 xl:mb-0 px-4 padLeft3">
                    <GeneralUsers clients={clients} advisors={advisors} />
                    <RecentTickets tickets={tickets} />
                </div>
            </div>
            <FooterAdmin />
        </div>
    );
}
