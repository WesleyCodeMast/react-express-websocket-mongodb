import axios from 'axios';

export function notifyTerminateChat(socket, room, type, element, exit) {
    const data_val2 = {
      "end_time": element,
      "advisor_rate": localStorage.getItem('advisorRate')
    }
    axios.put(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}` , data_val2).then(result => {
      axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/order-invoices/${localStorage.getItem('cid')}/${localStorage.getItem('aid')}`).then(result1 => {
        localStorage.setItem('advisorRate', result1.data.data.advisor_rate);
        localStorage.setItem('StartTime', result1.data.data.start_time);
        localStorage.setItem('EndTime', element);
        localStorage.setItem('TERMINATE_CHAT_BY_INACTIVITY', type);
        // show alert only when show note is false
        if(!exit) {
          // swal("success", "Chat terminated due to Inactivity", "success");
          socket.current.emit('TERMINATE-CHAT-FOR-INTERNET-DISCONNECT', ({
            room: room,
            advisor: localStorage.getItem('aid'),
            client: localStorage.getItem('cid'),
            action: 'exit'
          }));
        }
      }).catch(err => {})
    }).catch(err => {})
  }
