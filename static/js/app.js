let currentUser = null;
let replyMsg = null;
let disguiseTab = 'code';

function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = 'toast ' + (
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
    );
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = 'opacity 0.3s';
        setTimeout(() => t.remove(), 300);
    }, 2500);
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const d = document.documentElement.classList.contains('dark');
    document.getElementById('theme-icon').textContent = d ? '☀️' : '🌙';
    localStorage.setItem('dark', d ? '1' : '0');
}

function initDarkMode() {
    if (localStorage.getItem('dark') === '1') {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').textContent = '☀️';
    }
}

function startCountdown() {
    function tick() {
        const now = new Date();
        const t = new Date();
        t.setHours(18, 0, 0, 0);
        let diff = t.getTime() - now.getTime();
        if (diff < 0) {
            t.setDate(t.getDate() + 1);
            diff = t.getTime() - now.getTime();
        }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        document.getElementById('countdown-time').textContent =
            `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    tick();
    setInterval(tick, 1000);
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const fmt = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    });
    const parts = fmt.formatToParts(d);
    const get = t => parts.find(p => p.type === t)?.value || '00';
    return `${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

function formatDuration(ms) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')}`;
}

async function doRegister() {
    const nickname = document.getElementById('reg-nickname').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const ageVal = document.getElementById('reg-age').value;
    const age = ageVal ? parseInt(ageVal) : null;
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
            nickname, gender, age, occupation, position, area, status,
            session_id: currentSessionId,
        });
        currentUser = user;
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('my-nickname').textContent = user.nickname;
        showToast('注册成功！', 'success');
        startCountdown();
        await loadMessages();
        await loadUsers();
        await loadStats();
        setInterval(pollMessages, 3000);
        setInterval(loadUsers, 15000);
        setInterval(loadStats, 10000);
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function checkLogin() {
    try {
        const user = await API.getMe();
        currentUser = user;
        return true;
    } catch (e) {
        return false;
    }
}

async function loadMessages() {
    try {
        const msgs = await API.getChatMessages(1000);
        renderMessages(msgs);
    } catch (e) {
        console.error(e);
    }
}

let lastMsgCount = 0;
async function pollMessages() {
    try {
        const msgs = await API.getChatMessages(1000);
        if (msgs.length !== lastMsgCount) {
            lastMsgCount = msgs.length;
            renderMessages(msgs);
        }
    } catch (e) {}
}

function renderMessages(msgs) {
    const box = document.getElementById('chat-messages');
    if (!msgs || msgs.length === 0) {
        box.innerHTML = '<div class="text-center text-sm text-slate-400 py-8">群里还没人说话，快来第一个发言吧！</div>';
        return;
    }

    box.innerHTML = msgs.map(m => {
        const me = currentUser && currentUser.id === m.user_id;
        const content = formatContent(m.content);

        let replyHtml = '';
        if (m.reply_to_nickname) {
            replyHtml = `
                <div class="mb-1.5 p-2 rounded-lg text-xs ${me ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700/50'}">
                    <span class="${me ? 'text-green-100' : 'text-slate-500'}">回复 ${m.reply_to_nickname}:</span>
                    <span class="${me ? 'text-white' : 'text-slate-700 dark:text-slate-200'} ml-1">${escapeHtml(m.reply_to_content || '')}</span>
                </div>
            `;
        }

        return `
            <div class="flex items-start gap-2.5 ${me ? 'flex-row-reverse' : ''} group" data-id="${m.id}">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                     style="background:${m.avatar_color}">
                    ${m.nickname.charAt(0)}
                </div>
                <div class="max-w-[75%]">
                    <div class="text-xs text-slate-500 dark:text-slate-400 mb-0.5 ${me ? 'text-right' : ''}">
                        ${m.nickname} · ${formatTime(m.created_at)}
                    </div>
                    <div class="relative ${me ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'} px-3.5 py-2 rounded-2xl text-sm break-words">
                        ${replyHtml}
                        ${content}
                        <button onclick="setReply(${m.id}, '${m.nickname}')"
                            class="absolute -top-1 -right-1 w-5 h-5 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            ↩
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    box.scrollTop = box.scrollHeight;
}

function formatContent(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    html = html.replace(/@(\S+)/g, '<span class="text-blue-500 dark:text-blue-400 font-medium">@$1</span>');
    if (text.includes('🎵')) {
        html = html.replace(/(https?:\/\/music\.163\.com\/\S+)/g, '<a href="$1" target="_blank" class="underline">$1</a>');
    }
    return html;
}

function setReply(id, nickname) {
    replyMsg = { id, nickname };
    document.getElementById('reply-bar').classList.remove('hidden');
    document.getElementById('reply-bar').classList.add('flex');
    document.getElementById('reply-target').textContent = nickname;
    document.getElementById('chat-input').focus();
}

function cancelReply() {
    replyMsg = null;
    document.getElementById('reply-bar').classList.add('hidden');
    document.getElementById('reply-bar').classList.remove('flex');
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content) return;

    const data = { content };
    if (replyMsg) {
        data.reply_to = replyMsg.id;
    }

    API.sendChatMessage(data)
        .then(() => {
            input.value = '';
            cancelReply();
            loadMessages();
        })
        .catch(e => showToast(e.message, 'error'));
}

async function loadUsers() {
    try {
        const users = await API.getUsers();
        const box = document.getElementById('user-list');
        const regUsers = users.filter(u => u.is_registered);
        const all = [...regUsers];

        box.innerHTML = all.map(u => {
            const me = currentUser && currentUser.id === u.id;
            return `
                <div onclick="mention('${u.nickname}')"
                     class="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${me ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                         style="background:${u.avatar_color}">
                        ${u.nickname.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">${u.nickname}${u.is_ai ? '🤖' : ''}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400 truncate">${u.position}</div>
                    </div>
                    ${!u.is_ai ? '<span class="w-2 h-2 rounded-full bg-green-500"></span>' : ''}
                </div>
            `;
        }).join('');
    } catch (e) {}
}

function mention(nickname) {
    const input = document.getElementById('chat-input');
    const s = input.selectionStart;
    const e = input.selectionEnd;
    const t = input.value;
    input.value = t.substring(0, s) + '@' + nickname + ' ' + t.substring(e);
    input.focus();
    const pos = s + nickname.length + 2;
    input.setSelectionRange(pos, pos);
}

async function loadStats() {
    try {
        const s = await API.getStats();
        document.getElementById('online-count').textContent = s.online_users;
    } catch (e) {}
}

function toggleDisguise() {
    const on = document.body.classList.toggle('disguise-mode');
    if (on) {
        document.body.style.background = '#1e1e1e';
    } else {
        document.body.style.background = '';
    }
}

function switchDisguise(tab) {
    disguiseTab = tab;
    document.getElementById('disguise-code').classList.toggle('hidden', tab !== 'code');
    document.getElementById('disguise-table').classList.toggle('hidden', tab !== 'table');
    document.getElementById('tab-code').className = 'px-3 py-1 text-xs rounded ' + (tab === 'code' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600');
    document.getElementById('tab-table').className = 'px-3 py-1 text-xs rounded ' + (tab === 'table' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600');
}

function showEditProfile() {
    if (!currentUser) return;
    document.getElementById('edit-nickname').value = currentUser.nickname || '';
    document.getElementById('edit-age').value = currentUser.age || '';
    document.getElementById('edit-occupation').value = currentUser.occupation || '';
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEdit() {
    document.getElementById('edit-modal').classList.add('hidden');
}

async function saveProfile() {
    const nickname = document.getElementById('edit-nickname').value.trim();
    const ageVal = document.getElementById('edit-age').value;
    const age = ageVal ? parseInt(ageVal) : null;
    const occupation = document.getElementById('edit-occupation').value.trim() || null;

    const data = {};
    if (nickname && nickname !== currentUser.nickname) data.nickname = nickname;
    if (age !== null && age !== currentUser.age) data.age = age;
    if (occupation !== null && occupation !== currentUser.occupation) data.occupation = occupation;

    if (Object.keys(data).length === 0) {
        closeEdit();
        return;
    }

    try {
        const u = await API.updateMe(data);
        currentUser = u;
        document.getElementById('my-nickname').textContent = u.nickname;
        closeEdit();
        showToast('保存成功', 'success');
        loadUsers();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function toggleMusicPanel() {
    document.getElementById('music-panel').classList.toggle('hidden');
}

async function init() {
    initDarkMode();

    const logged = await checkLogin();
    if (logged && currentUser && currentUser.is_registered) {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('my-nickname').textContent = currentUser.nickname;
        startCountdown();
        await loadMessages();
        await loadUsers();
        await loadStats();
        setInterval(pollMessages, 3000);
        setInterval(loadUsers, 15000);
        setInterval(loadStats, 10000);
    } else {
        document.getElementById('login-page').style.display = 'flex';
    }
}

init();