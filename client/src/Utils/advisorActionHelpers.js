export function changeOnlineStatus(status) {
    const data = {
        "chat_status": status
    }
  
    axios.put(`${process.env.REACT_APP_BASE_URL}/advisor/auth/update-chat-status`, data, {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ` + localStorage.getItem('advisorToken')
        },
    }).then(result => {
        const socket = io.connect(`${process.env.REACT_APP_BASE_URL_SOCKET}`);
        const adv = getAidFromStorageToken();
        setChecked(1 - checked);
        socket.emit('ADVISOR-ONLINE-OFFLINE', ({advisor:adv.id , status: status}));
    }).catch(err => {
        console.log(err);
    })
}

