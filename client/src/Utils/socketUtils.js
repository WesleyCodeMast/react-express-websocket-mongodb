export function notifyOnlineStatus(socket, room, aid, cid, status, from, to) {
    setTimeout(() => {
        socket.current.emit('Notify-Status-In-Chat-Room-Changed', {
            room: room,
            advisor: aid,
            client: cid,
            status: status,
            from,
            to
        });
    }, 1500);
}