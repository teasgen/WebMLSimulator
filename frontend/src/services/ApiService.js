const API_BASE_URL = "http://127.0.0.1:8000";

export const getLLMResponse = async (prompt) => {
    const response = await fetch(`${API_BASE_URL}/generate-question/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(prompt)
    });

    return await response.body.getReader();
};

const getAuthToken = () => {
    const authTokens = localStorage.getItem('authTokens');
    if (authTokens) {
        const tokens = JSON.parse(authTokens);
        return tokens.access;
    }
    return null;
};

const fetchWithAuth = async (url, method = 'GET', data = null) => {
    const headers = {
        "Content-Type": "application/json",
    };

    const token = getAuthToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, options);
        
        if (response.status === 401) {
            localStorage.removeItem('authTokens');
            window.location.href = '/login';
            throw new Error('Authentication failed. Please log in again.');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

export const updateLogsDB = async (data) => {
    return fetchWithAuth("/logs-db/", "PATCH", data);
};

export const getLogsDB = async (data) => {
    return fetchWithAuth("/logs-db/", "POST", data);
};

// export const updateLogsDB = async (data) => {
//     const response = await fetch("http://127.0.0.1:8000/logs-db/", {
//         method: "PATCH",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify(data),
//     });
//     return await response.json();
// };

// export const getLogsDB = async (data) => {
//     const response = await fetch("http://127.0.0.1:8000/logs-db/", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify(data),
//     });
//     return await response.json();
// };

export const getThemes = async () => {
    const response = await fetch(`${API_BASE_URL}/interview-themes/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    });

    return await response.json();
};
