let currentUser = null;

const DEFAULT_CONFIG = {
    positions: ["前端", "后端", "产品", "运营", "财务", "人事", "设计师", "测试", "自由职业"],
    areas: ["靠窗黄金区", "普通办公区", "角落摸鱼区", "地下加班区"],
    statuses: ["认真敲代码", "带薪发呆", "偷偷刷短视频", "假装开会", "摸鱼刷论坛", "疯狂内卷加班"],
};

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const colors = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
    };
    toast.classList.add(colors[type] || colors.info);
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('dark_mode', isDark ? '1' : '0');
}

function initDarkMode() {
    if (localStorage.getItem('dark_mode') === '1') {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').textContent = '☀️';
    }
}

function formatTime(dateStr) {
    if (!dateStr) return '';

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const fmt = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = fmt.formatToParts(d);
    const get = (type) => parts.find(p => p.type === type)?.value || '00';

    return `${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

async function checkLogin() {
    try {
        const user = await API.getMe();
        currentUser = user;
        document.getElementById('my-nickname').textContent = user.nickname;
        return true;
    } catch (e) {
        return false;
    }
}

async function autoCreateUser() {
    try {
        const guestNicknames = ['匿名同事', '神秘访客', '职场新人', '实习生小王', '新入职员工'];
        const nickname = guestNicknames[Math.floor(Math.random() * guestNicknames.length)];
        const position = DEFAULT_CONFIG.positions[Math.floor(Math.random() * DEFAULT_CONFIG.positions.length)];
        const area = DEFAULT_CONFIG.areas[Math.floor(Math.random() * DEFAULT_CONFIG.areas.length)];
        const status = DEFAULT_CONFIG.statuses[Math.floor(Math.random() * DEFAULT_CONFIG.statuses.length)];

        const user = await API.register({
            nickname,
            position,
            area,
            status,
            session_id: currentSessionId,
        });

        currentUser = user;
        document.getElementById('my-nickname').textContent = user.nickname;
        return true;
    } catch (e) {
        console.error('Auto create user failed:', e);
        showToast('自动登录失败：' + e.message, 'error');
        return false;
    }
}

async function loadChatMessages() {
    try {
        const messages = await API.getChatMessages(1000);
        renderChatMessages(messages);
    } catch (e) {
        console.error('Failed to load chat messages:', e);
    }
}

function renderChatMessages(messages) {
    const container = document.getElementById('chat-list');

    if (!messages || messages.length === 0) {
        container.innerHTML = '<div class="text-center text-sm text-slate-400 py-8">群里还没人说话，快来第一个发言吧！</div>';
        return;
    }

    container.innerHTML = messages.map(msg => {
        const isMe = currentUser && currentUser.id === msg.user_id;
        return `
            <div class="flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''} animate-slide-up">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 shadow-sm" style="background: ${msg.avatar_color}">
                    ${msg.nickname.charAt(0)}
                </div>
                <div class="max-w-[75%]">
                    <div class="text-xs text-slate-500 dark:text-slate-400 mb-0.5 ${isMe ? 'text-right' : 'text-left'}">
                        ${msg.nickname} · ${formatTime(msg.created_at)}
                    </div>
                    <div class="${isMe ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'} px-3.5 py-2 rounded-2xl text-sm break-words shadow-sm">
                        ${escapeHtml(msg.content)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleChatKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();

    if (!content) return;

    try {
        await API.sendChatMessage({ content });
        input.value = '';
        await loadChatMessages();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function refreshStats() {
    try {
        const stats = await API.getStats();
        document.getElementById('online-count').textContent = stats.online_users;
    } catch (e) {
        console.error('Failed to refresh stats:', e);
    }
}

async function init() {
    initDarkMode();

    const loggedIn = await checkLogin();
    if (!loggedIn) {
        await autoCreateUser();
    }

    await loadChatMessages();
    await refreshStats();

    setInterval(loadChatMessages, 3000);
    setInterval(refreshStats, 10000);
}

init();
