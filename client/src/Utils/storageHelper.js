import jwtDecode from "jwt-decode";

export function getAidFromStorageToken() {
    if(!localStorage.getItem('advisorToken')) {
        localStorage.clear();
        window.location.href = "/advisor-login";
    }
    let adv;
    try {
        adv = jwtDecode(localStorage.getItem('advisorToken'));
    }catch(error) {
        localStorage.clear();
        window.location.href = "/advisor-login";
    }
    return adv;
}


export function getCidFromStorageToken() {
    if(!localStorage.getItem('clientToken')) {
        localStorage.clear();
        window.location.href = "/client-login";
    }
    let cli;
    try {
        cli = jwtDecode(localStorage.getItem('clientToken'));
    }catch(error) {
        localStorage.clear();
        window.location.href = "/client-login";
    }
    return cli;
}

export function getMyIdFromStorageToken() {
    let result = undefined;

    if(localStorage.getItem('advisorToken')) {
        try {
            result = jwtDecode(localStorage.getItem('advisorToken'));
            return result;
        }catch(error) {
            localStorage.clear();
            window.location.href = "/advisor-login";
        }
    }

    if(localStorage.getItem('clientToken')) {
        try {
            result = jwtDecode(localStorage.getItem('clientToken'));
            return result;
        }catch(error) {
            localStorage.clear();
            window.location.href = "/client-login";
        }
    }
    
    if(!localStorage.getItem('clientToken') && !localStorage.getItem('advisorToken')){
        localStorage.clear();
        window.location.href = "/";
    }
    return null;        
}
