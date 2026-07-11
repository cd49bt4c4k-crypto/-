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

async function handleRegister() {
    const nickname = document.getElementById('reg-nickname').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const age = parseInt(document.getElementById('reg-age').value) || null;
    const occupation = document.getElementById('reg-occupation').value.trim() || null;
    const position = document.getElementById('reg-position').value;
    const area = document.getElementById('reg-area').value;
    const status = document.getElementById('reg-status').value;

    if (!nickname || nickname.length < 2 || nickname.length > 20) {
        showToast('昵称需要2-20个字符', 'error');
        return;
    }

    try {
        const user = await API.register({
            nickname,
            gender,
            age,
            occupation,
            position,
            area,
            status,
            session_id: currentSessionId,
        });

        currentUser = user;
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('my-nickname').textContent = user.nickname;
        showToast('注册成功！欢迎加入~', 'success');

        await loadChatMessages();
        await refreshStats();
        await loadUsers();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function toggleDisguise() {
    const body = document.body;
    const btn = document.getElementById('disguise-btn');
    const isDisguised = body.classList.contains('disguise-mode');

    if (isDisguised) {
        body.classList.remove('disguise-mode');
        btn.textContent = '🛡️ 伪装工作';
        showToast('已退出伪装模式', 'info');
    } else {
        body.classList.add('disguise-mode');
        btn.textContent = '💬 返回聊天';
        showToast('已切换到伪装模式', 'info');
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
        const content = formatMessageContent(msg.content);
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
                        ${content}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

function formatMessageContent(content) {
    if (!content) return '';
    return content.replace(/@(\S+)/g, '<span class="text-blue-500 dark:text-blue-400 font-medium">@$1</span>');
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

async function loadUsers() {
    try {
        const users = await API.getUsers();
        renderUserList(users);
    } catch (e) {
        console.error('Failed to load users:', e);
    }
}

function renderUserList(users) {
    const container = document.getElementById('user-list');
    
    if (!users || users.length === 0) {
        container.innerHTML = '<div class="text-center text-sm text-slate-400 py-4">暂无成员</div>';
        return;
    }

    const sortedUsers = users.sort((a, b) => {
        if (a.is_ai !== b.is_ai) return a.is_ai ? 1 : -1;
        return 0;
    });

    container.innerHTML = sortedUsers.map(user => {
        const isMe = currentUser && currentUser.id === user.id;
        return `
            <div class="flex items-center gap-2 p-2 rounded-lg ${isMe ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700'} cursor-pointer transition-colors"
                 onclick="insertMention('${user.nickname}')">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                     style="background: ${user.avatar_color}">
                    ${user.nickname.charAt(0)}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">${user.nickname}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 truncate">${user.position}</div>
                </div>
                ${!user.is_ai ? '<span class="w-2 h-2 rounded-full bg-green-500"></span>' : ''}
            </div>
        `;
    }).join('');
}

function insertMention(nickname) {
    const input = document.getElementById('chat-input');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + '@' + nickname + ' ' + text.substring(end);
    input.focus();
    input.setSelectionRange(start + nickname.length + 2, start + nickname.length + 2);
}

function showEditProfile() {
    if (!currentUser) return;

    document.getElementById('edit-nickname').value = currentUser.nickname || '';
    
    const genderRadios = document.querySelectorAll('input[name="edit-gender"]');
    genderRadios.forEach(r => r.checked = r.value === (currentUser.gender || '保密'));
    
    document.getElementById('edit-age').value = currentUser.age || '';
    document.getElementById('edit-occupation').value = currentUser.occupation || '';
    
    document.getElementById('edit-profile-modal').classList.remove('hidden');
}

function closeEditProfile() {
    document.getElementById('edit-profile-modal').classList.add('hidden');
}

async function saveProfile() {
    const nickname = document.getElementById('edit-nickname').value.trim();
    const gender = document.querySelector('input[name="edit-gender"]:checked')?.value;
    const age = parseInt(document.getElementById('edit-age').value) || null;
    const occupation = document.getElementById('edit-occupation').value.trim() || null;

    const updates = {};
    if (nickname && nickname !== currentUser.nickname) updates.nickname = nickname;
    if (gender !== undefined && gender !== currentUser.gender) updates.gender = gender;
    if (age !== null && age !== currentUser.age) updates.age = age;
    if (occupation !== null && occupation !== currentUser.occupation) updates.occupation = occupation;

    if (Object.keys(updates).length === 0) {
        closeEditProfile();
        return;
    }

    try {
        const user = await API.updateMe(updates);
        currentUser = user;
        document.getElementById('my-nickname').textContent = user.nickname;
        closeEditProfile();
        showToast('资料更新成功', 'success');
        await loadUsers();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function init() {
    initDarkMode();

    const loggedIn = await checkLogin();
    if (!loggedIn) {
        document.getElementById('login-modal').classList.remove('hidden');
        return;
    }

    document.getElementById('login-modal').classList.add('hidden');
    await loadChatMessages();
    await refreshStats();
    await loadUsers();

    setInterval(loadChatMessages, 3000);
    setInterval(refreshStats, 10000);
    setInterval(loadUsers, 15000);
}

init();
