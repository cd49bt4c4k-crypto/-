const API_BASE = '/api';

let currentSessionId = localStorage.getItem('session_id');
if (!currentSessionId) {
    currentSessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('session_id', currentSessionId);
}

async function apiRequest(endpoint, options = {}) {
    const url = API_BASE + endpoint;
    const headers = {
        'Content-Type': 'application/json',
        'session_id': currentSessionId,
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error('服务器错误，请稍后重试');
        }

        if (!response.ok) {
            throw new Error(data.detail || '请求失败');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

const API = {
    getConfig: () => apiRequest('/config'),

    register: (data) => apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getMe: () => apiRequest('/users/me'),

    updateMe: (data) => apiRequest('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    getUsers: (area) => apiRequest('/users' + (area ? `?area=${encodeURIComponent(area)}` : '')),

    sendChatMessage: (data) => apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getChatMessages: (limit = 200) => apiRequest(`/chat?limit=${limit}`),

    getStats: () => apiRequest('/stats'),

    searchMusic: (keyword, limit = 20) => apiRequest(`/music/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`),

    getMusicUrl: (id) => apiRequest(`/music/url?id=${id}`),

    getMusicLyrics: (id) => apiRequest(`/music/lyrics?id=${id}`),

    getPlaylist: (id) => apiRequest(`/music/playlist?id=${id}`),
};