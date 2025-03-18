import moment from 'moment';

export function formatSeconds(s) {
    let minutes = ~~(s / 60);
    let seconds = ~~(s % 60);
    var newDuration =  minutes + ':' + seconds;
    if(s >= 60) {
        var cl = newDuration;
        var co = cl.split(":", 2);
        return co[0] + ' Minute ' + co[1] + " Seconds";
    } else {
        return s+' Seconds';
    }
}

export function calculateRate(timed, rate) {

    if(!!!timed) return '0';
    if(rate === undefined && localStorage.getItem('advisorRate')) {
        rate = localStorage.getItem('advisorRate');
    }
    else {
        rate = 2;
    }
    var totalMinutes = parseFloat(timed/60)
    var totalAmount = parseFloat(totalMinutes * rate).toFixed(2);
    return totalAmount;
}


  /**
   * 
   * @param {*} t1: start time 
   * @param {*} t2: end time
   * @returns duration between start and end time
   */
  export function calculateTotalTime(t1,t2) {
    localStorage.removeItem('timers');
    var time_start = moment(t2,'HH:mm:ss A');
    var time_end = moment(t1,'HH:mm:ss A');
    var duration = time_end.diff(time_start,'seconds');
    return duration;
}

export function convertIntoWords(timed) {
    let ss = parseInt(timed);
    let h = parseInt(ss / 3600);
    let hh = ss - h * 3600;
    let m = parseInt(hh / 60);
    let s = hh - m * 60;
    var result = '';
    if( h > 0 ) {
        let hs = ' Hour '
        if (h > 1)
            hs = ' Hours '
        result = h + hs;
    }
    if(h > 0 || m > 0) {
        let ms = ' Minute '
        if( m > 1)
            ms = ' Minutes '
        result = result + m + ms; 
    }
    let sss = ' Second ';
    if(s > 1)
        sss = ' Seconds '
    result = result + s + sss;
    return result;
}

export const timeFormat1 = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // Use AM/PM
};

export const dateFormat = "YYYY-MM-DD";

export function formatDate2(dateString) {
    const isoDate = new Date(dateString);

    // Get the month abbreviation (e.g., "Sep")
    const monthAbbreviation = isoDate.toLocaleString('en-us', { month: 'short' });

    // Get the day, year, hour, and minute
    const day = isoDate.getDate();
    const year = isoDate.getFullYear();
    const hour = isoDate.getHours();
    const minute = isoDate.getMinutes();

    // Determine whether it's AM or PM
    const amOrPm = hour < 12 ? 'AM' : 'PM';

    // Format the date string
    const formattedDate = `${monthAbbreviation}. ${day} ${year} ${hour}:${minute.toString().padStart(2, '0')} ${amOrPm}`;
    return formattedDate;
}

export function formatDate3(dateString) {
    const isoDate = new Date(dateString);

    // Get the month abbreviation (e.g., "Sep")
    const monthAbbreviation = isoDate.toLocaleString('en-us', { month: 'short' });

    // Get the day, year, hour, and minute
    const day = isoDate.getDate();
    const year = isoDate.getFullYear();
    
    // Format the date string
    const formattedDate = `${monthAbbreviation} ${day}, ${year}`;
    return formattedDate;
}