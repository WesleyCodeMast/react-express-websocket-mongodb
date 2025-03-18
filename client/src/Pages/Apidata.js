import axios from 'axios';

export async function getChatTopics() {
    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/admin/chat-topics`, {
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json'
        },
    });
    return response.data;
}

// export async function AllAdvisors() {

//     const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/frontend/all-advisors`, {
//         headers: {
//             'Accept': 'application/json, text/plain, */*',
//             'Content-Type': 'application/json'
//         },
//     });

//     return response.data;
// }

export async function homePageBanners() {
    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/admin/upload-banners`, {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
    });

    return response.data;
}

export async function homepageText() {
    const url = process.env.REACT_APP_BASE_URL + "/admin/pages/get-home-text";

    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/admin/pages/get-home-text`, {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
    });

    return response.data;
}


