const API_BASE = '/api';

let currentSessionId = localStorage.getItem('session_id');
if (!currentSessionId) {
    currentSessionId = 'session_' + Math.random().toString(36).substring(2, 15);
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

        const contentType = response.headers.get('content-type');
        
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 500));
            throw new Error('服务器返回了非JSON响应，请稍后重试');
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
    
    sendMessage: (data) => apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    getMessages: (area, limit = 50) => apiRequest('/messages' + (area ? `?area=${encodeURIComponent(area)}` : '') + `&limit=${limit}`),
    
    sendGift: (data) => apiRequest('/gifts', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    getReceivedGifts: () => apiRequest('/gifts/received'),
    
    sendComplaint: (data) => apiRequest('/complaints', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    getComplaints: (limit = 30) => apiRequest(`/complaints?limit=${limit}`),
    
    likeComplaint: (id) => apiRequest(`/complaints/${id}/like`, {
        method: 'POST',
    }),
    
    sendChatMessage: (data) => apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    getChatMessages: (limit = 200) => apiRequest(`/chat?limit=${limit}`),
    
    enterBossOffice: () => apiRequest('/boss-office/enter', {
        method: 'POST',
    }),
    
    getRanking: () => apiRequest('/ranking/today'),
    
    getStats: () => apiRequest('/stats'),
    
    getRooftopStatus: () => apiRequest('/rooftop/status'),
    
    triggerAIAction: () => apiRequest('/ai/action', {
        method: 'POST',
    }),
    
    health: () => apiRequest('/health'),
    
    searchMusic: (keyword, limit = 20) => apiRequest(`/music/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`),
    
    getMusicUrl: (id) => apiRequest(`/music/url?id=${id}`),
    
    getMusicLyrics: (id) => apiRequest(`/music/lyrics?id=${id}`),
};