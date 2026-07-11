let currentUser = null;
let config = null;
let currentView = 'office';
let selectedPosition = null;
let selectedArea = null;
let selectedGift = null;
let giftTargetUserId = null;
let whiteNoisePlaying = false;
let sidebarOpen = true;

const EMOJI_MAP = {
    '咖啡': '☕',
    '奶茶': '🧋',
    '可乐': '🥤',
    '零食': '🍿',
    '鲜花': '💐',
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
    updateAmbient();
}

function initDarkMode() {
    if (localStorage.getItem('dark_mode') === '1') {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').textContent = '☀️';
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
    document.getElementById('time-display').textContent = `${dateStr} ${timeStr}`;
    updateAmbient();
    updateCountdown();
}

function updateAmbient() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const overlay = document.getElementById('ambient-overlay');
    const sceneContainer = document.getElementById('scene-container');

    let overlayColor = 'transparent';

    if (hour >= 8 && hour < 18) {
        overlayColor = 'transparent';
    } else if (hour >= 18 && hour < 21) {
        overlayColor = 'rgba(30, 41, 59, 0.25)';
    } else {
        overlayColor = 'rgba(15, 23, 42, 0.5)';
    }

    if (day === 1 && hour >= 8 && hour < 12) {
        overlayColor = 'rgba(59, 130, 246, 0.1)';
    }
    if (day === 5 && hour >= 17) {
        overlayColor = 'rgba(251, 191, 36, 0.1)';
    }

    overlay.style.background = overlayColor;
}

function updateCountdown() {
    const offWorkTime = document.getElementById('off-work-time').value;
    const [hours, minutes] = offWorkTime.split(':').map(Number);
    
    const now = new Date();
    const offWork = new Date();
    offWork.setHours(hours, minutes, 0, 0);
    
    if (now > offWork) {
        offWork.setDate(offWork.getDate() + 1);
    }
    
    const diff = offWork - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    document.getElementById('countdown').textContent = 
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

let audioContext = null;
let noiseNode = null;
let gainNode = null;

function createWhiteNoise() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    noiseNode = audioContext.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;
    
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.05;
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    noiseNode.start();
}

function toggleWhiteNoise() {
    const btn = document.getElementById('noise-toggle');
    const toggle = btn.querySelector('span');
    
    if (whiteNoisePlaying) {
        if (gainNode) {
            gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
            setTimeout(() => {
                if (noiseNode) {
                    noiseNode.stop();
                    noiseNode = null;
                }
            }, 500);
        }
        btn.classList.remove('bg-green-500');
        btn.classList.add('bg-slate-300', 'dark:bg-slate-600');
        toggle.style.transform = 'translateX(0)';
        whiteNoisePlaying = false;
    } else {
        try {
            createWhiteNoise();
            btn.classList.add('bg-green-500');
            btn.classList.remove('bg-slate-300', 'dark:bg-slate-600');
            toggle.style.transform = 'translateX(20px)';
            whiteNoisePlaying = true;
        } catch (e) {
            console.error('Failed to play white noise:', e);
            showToast('白噪音播放失败，请先与页面交互', 'warning');
        }
    }
}

const DEFAULT_CONFIG = {
    positions: ["前端", "后端", "产品", "运营", "财务", "人事", "设计师", "测试", "自由职业"],
    areas: ["靠窗黄金区", "普通办公区", "角落摸鱼区", "地下加班区"],
    statuses: ["认真敲代码", "带薪发呆", "偷偷刷短视频", "假装开会", "摸鱼刷论坛", "疯狂内卷加班"],
    gift_types: ["咖啡", "奶茶", "可乐", "零食", "鲜花"],
};

async function loadConfig() {
    try {
        config = await API.getConfig();
    } catch (e) {
        console.error('Failed to load config from API, using default config:', e);
        config = DEFAULT_CONFIG;
    }
    populateOnboardingOptions();
}

function populateOnboardingOptions() {
    if (!config) return;

    const positionContainer = document.getElementById('position-options');
    positionContainer.innerHTML = config.positions.map(pos => `
        <button onclick="selectPosition('${pos}')" 
            class="position-option px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 transition-all"
            data-position="${pos}">
            ${pos}
        </button>
    `).join('');

    const areaContainer = document.getElementById('area-options');
    areaContainer.innerHTML = config.areas.map(area => {
        let desc = '';
        let icon = '🪑';
        if (area === '靠窗黄金区') { desc = '风景好，需声望≥80'; icon = '🪟'; }
        if (area === '普通办公区') { desc = '中规中矩的工位'; icon = '💻'; }
        if (area === '角落摸鱼区') { desc = '隐蔽性好，适合摸鱼'; icon = '🛋️'; }
        if (area === '地下加班区') { desc = '深夜加班专属'; icon = '🌑'; }
        
        return `
        <button onclick="selectArea('${area}')" 
            class="area-option w-full p-3 text-left border border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all flex items-center gap-3"
            data-area="${area}">
            <span class="text-xl">${icon}</span>
            <div>
                <div class="text-sm font-medium text-slate-800 dark:text-slate-200">${area}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">${desc}</div>
            </div>
        </button>
    `}).join('');

    const statusSelect = document.getElementById('onboard-status');
    statusSelect.innerHTML = config.statuses.map(s => `<option value="${s}">${s}</option>`).join('');

    const editPosition = document.getElementById('edit-position');
    editPosition.innerHTML = config.positions.map(p => `<option value="${p}">${p}</option>`).join('');

    const editArea = document.getElementById('edit-area');
    editArea.innerHTML = config.areas.map(a => `<option value="${a}">${a}</option>`).join('');

    const editStatus = document.getElementById('edit-status');
    editStatus.innerHTML = config.statuses.map(s => `<option value="${s}">${s}</option>`).join('');
}

function selectPosition(pos) {
    selectedPosition = pos;
    document.querySelectorAll('.position-option').forEach(btn => {
        if (btn.dataset.position === pos) {
            btn.classList.add('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/50', 'text-indigo-600', 'dark:text-indigo-400');
        } else {
            btn.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/50', 'text-indigo-600', 'dark:text-indigo-400');
        }
    });
}

function selectArea(area) {
    selectedArea = area;
    document.querySelectorAll('.area-option').forEach(btn => {
        if (btn.dataset.area === area) {
            btn.classList.add('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/50');
        } else {
            btn.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/50');
        }
    });
}

async function completeOnboarding() {
    const nickname = document.getElementById('onboard-nickname').value.trim();
    const status = document.getElementById('onboard-status').value;

    if (!nickname || nickname.length < 2 || nickname.length > 10) {
        showToast('昵称需要2-10个字符', 'error');
        return;
    }
    if (!selectedPosition) {
        showToast('请选择岗位', 'error');
        return;
    }
    if (!selectedArea) {
        showToast('请选择工位区域', 'error');
        return;
    }

    try {
        const user = await API.register({
            nickname,
            position: selectedPosition,
            area: selectedArea,
            status,
            session_id: currentSessionId,
        });
        
        currentUser = user;
        document.getElementById('onboarding-modal').classList.add('hidden');
        updateUserUI();
        showToast('入职成功！欢迎加入~', 'success');
        
        refreshAllData();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function checkLogin() {
    try {
        const user = await API.getMe();
        currentUser = user;
        document.getElementById('onboarding-modal').classList.add('hidden');
        updateUserUI();
        return true;
    } catch (e) {
        return false;
    }
}

async function autoCreateUser() {
    try {
        const guestNicknames = ['匿名同事', '神秘访客', '职场新人', '实习生小王', '新入职员工'];
        const randomNickname = guestNicknames[Math.floor(Math.random() * guestNicknames.length)];
        const randomPosition = config.positions[Math.floor(Math.random() * config.positions.length)];
        const randomArea = config.areas[Math.floor(Math.random() * config.areas.length)];
        const randomStatus = config.statuses[Math.floor(Math.random() * config.statuses.length)];

        const user = await API.register({
            nickname: randomNickname,
            position: randomPosition,
            area: randomArea,
            status: randomStatus,
            session_id: currentSessionId,
        });

        currentUser = user;
        document.getElementById('onboarding-modal').classList.add('hidden');
        updateUserUI();
        showToast('欢迎加入虚拟职场！', 'success');
        return true;
    } catch (e) {
        console.error('Failed to auto-create user:', e);
        return false;
    }
}

function updateUserUI() {
    if (!currentUser) return;

    document.getElementById('my-nickname').textContent = currentUser.nickname;
    document.getElementById('my-position').textContent = currentUser.position;
    document.getElementById('my-reputation').textContent = currentUser.reputation;
    document.getElementById('reputation-bar').style.width = currentUser.reputation + '%';
    document.getElementById('my-area').textContent = '📍 ' + currentUser.area;
    document.getElementById('my-status').textContent = currentUser.status;

    const avatar = document.getElementById('my-avatar');
    avatar.style.background = currentUser.avatar_color;
    avatar.textContent = currentUser.nickname.charAt(0);
}

function showEditProfile() {
    if (!currentUser) return;
    
    document.getElementById('edit-nickname').value = currentUser.nickname;
    document.getElementById('edit-position').value = currentUser.position;
    document.getElementById('edit-area').value = currentUser.area;
    document.getElementById('edit-status').value = currentUser.status;
    
    document.getElementById('edit-profile-modal').classList.remove('hidden');
}

function closeEditProfile() {
    document.getElementById('edit-profile-modal').classList.add('hidden');
}

async function saveProfile() {
    const nickname = document.getElementById('edit-nickname').value.trim();
    const position = document.getElementById('edit-position').value;
    const area = document.getElementById('edit-area').value;
    const status = document.getElementById('edit-status').value;

    try {
        const user = await API.updateMe({ nickname, position, area, status });
        currentUser = user;
        updateUserUI();
        closeEditProfile();
        showToast('修改成功！', 'success');
        refreshAllData();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function showEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    picker.classList.toggle('hidden');
}

function insertEmoji(emoji) {
    const input = document.getElementById('message-input');
    input.value += emoji;
    updateCharCount();
    input.focus();
    document.getElementById('emoji-picker').classList.add('hidden');
}

function updateCharCount() {
    const input = document.getElementById('message-input');
    document.getElementById('char-count').textContent = `${input.value.length}/80`;
}

function handleMessageKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
    updateCharCount();
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (!content) return;
    if (content.length > 80) {
        showToast('消息不能超过80字', 'error');
        return;
    }

    const area = currentUser ? currentUser.area : '普通办公区';

    try {
        await API.sendMessage({
            content,
            area,
            message_type: 'note',
        });
        
        input.value = '';
        updateCharCount();
        document.getElementById('emoji-picker').classList.add('hidden');
        refreshMessages();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function refreshMessages() {
    if (!currentUser) return;
    
    try {
        const messages = await API.getMessages(currentUser.area, 30);
        renderNotes(messages);
    } catch (e) {
        console.error('Failed to refresh messages:', e);
    }
}

async function refreshUsers() {
    try {
        const users = await API.getUsers();
        renderOnlineList(users);
        renderPeople(users);
    } catch (e) {
        console.error('Failed to refresh users:', e);
    }
}

function renderOnlineList(users) {
    const container = document.getElementById('online-list');
    const realUsers = users.filter(u => !u.is_ai).slice(0, 10);
    const aiUsers = users.filter(u => u.is_ai).slice(0, 5);
    
    let html = '';
    
    if (realUsers.length > 0) {
        html += `<div class="text-xs text-slate-400 mb-2 font-medium">真人 (${realUsers.length})</div>`;
        realUsers.forEach(u => {
            html += `
                <div class="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer" onclick="showGiftModal(${u.id}, '${u.nickname}')">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style="background: ${u.avatar_color}">
                        ${u.nickname.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">${u.nickname}</div>
                        <div class="text-xs text-slate-400 truncate">${u.position} · ${u.status}</div>
                    </div>
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                </div>
            `;
        });
    }
    
    if (aiUsers.length > 0) {
        html += `<div class="text-xs text-slate-400 mb-2 mt-3 font-medium">AI同事 (${users.filter(u=>u.is_ai).length})</div>`;
        aiUsers.forEach(u => {
            html += `
                <div class="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer opacity-80" onclick="showGiftModal(${u.id}, '${u.nickname}')">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style="background: ${u.avatar_color}">
                        ${u.nickname.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                            ${u.nickname} <span class="text-xs text-purple-500">🤖</span>
                        </div>
                        <div class="text-xs text-slate-400 truncate">${u.position} · ${u.status}</div>
                    </div>
                    <span class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                </div>
            `;
        });
    }
    
    if (html === '') {
        html = '<div class="text-center text-sm text-slate-400 py-4">暂无在线同事</div>';
    }
    
    container.innerHTML = html;
}

async function refreshRanking() {
    try {
        const ranking = await API.getRanking();
        renderRanking(ranking);
    } catch (e) {
        console.error('Failed to refresh ranking:', e);
    }
}

function renderRanking(ranking) {
    const container = document.getElementById('ranking-list');
    
    if (!ranking || ranking.length === 0) {
        container.innerHTML = '<div class="text-center text-sm text-slate-400 py-4">暂无排行数据</div>';
        return;
    }
    
    container.innerHTML = ranking.slice(0, 10).map((item, idx) => {
        let medal = '';
        if (idx === 0) medal = '🥇';
        else if (idx === 1) medal = '🥈';
        else if (idx === 2) medal = '🥉';
        else medal = `<span class="text-xs text-slate-400 font-medium">${idx + 1}</span>`;
        
        const isMe = currentUser && currentUser.id === item.user_id;
        
        return `
            <div class="flex items-center gap-2 p-2 rounded-lg ${isMe ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}">
                <div class="w-6 text-center flex-shrink-0">${medal}</div>
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style="background: ${item.avatar_color}">
                    ${item.nickname.charAt(0)}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        ${item.nickname}
                        ${isMe ? '<span class="text-xs text-indigo-500">(我)</span>' : ''}
                    </div>
                </div>
                <div class="text-sm font-semibold text-amber-500">⭐${item.reputation}</div>
            </div>
        `;
    }).join('');
}

async function refreshStats() {
    try {
        const stats = await API.getStats();
        document.getElementById('online-count').textContent = stats.online_users;
        document.getElementById('ai-count').textContent = stats.ai_users;
        document.getElementById('msg-count').textContent = stats.today_messages;
    } catch (e) {
        console.error('Failed to refresh stats:', e);
    }
}

function showGiftModal(userId, userName) {
    giftTargetUserId = userId;
    selectedGift = null;
    document.getElementById('gift-target-name').textContent = userName;
    document.getElementById('gift-message').value = '';
    document.querySelectorAll('.gift-option').forEach(btn => {
        btn.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/50');
    });
    document.getElementById('gift-modal').classList.remove('hidden');
}

function closeGiftModal() {
    document.getElementById('gift-modal').classList.add('hidden');
    giftTargetUserId = null;
    selectedGift = null;
}

function selectGift(giftType) {
    selectedGift = giftType;
    document.querySelectorAll('.gift-option').forEach((btn, idx) => {
        const gifts = ['咖啡', '奶茶', '可乐', '零食', '鲜花'];
        if (gifts[idx] === giftType) {
            btn.classList.add('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/50');
        } else {
            btn.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/50');
        }
    });
}

async function sendGift() {
    if (!selectedGift) {
        showToast('请选择礼物', 'error');
        return;
    }
    if (!giftTargetUserId) return;

    const message = document.getElementById('gift-message').value.trim();

    try {
        await API.sendGift({
            to_user_id: giftTargetUserId,
            gift_type: selectedGift,
            message: message || undefined,
        });
        
        showGiftAnimation(selectedGift);
        closeGiftModal();
        showToast(`成功送出${selectedGift}！`, 'success');
        refreshAllData();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function showGiftAnimation(giftType) {
    const emoji = EMOJI_MAP[giftType] || '🎁';
    const float = document.createElement('div');
    float.className = 'gift-float';
    float.textContent = emoji;
    float.style.left = '50%';
    float.style.top = '50%';
    document.body.appendChild(float);
    setTimeout(() => float.remove(), 2000);
}

async function enterBossOffice() {
    try {
        const event = await API.enterBossOffice();
        
        let eventEmoji = '';
        if (event.reputation_change > 0) eventEmoji = '📈';
        else if (event.reputation_change < 0) eventEmoji = '📉';
        else eventEmoji = '🤷';
        
        const changeText = event.reputation_change > 0 
            ? `+${event.reputation_change}` 
            : event.reputation_change;
        
        const html = `
            <div class="modal-backdrop" id="boss-event-modal" onclick="closeBossEvent()">
                <div class="modal-content bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center" onclick="event.stopPropagation()">
                    <div class="text-5xl mb-4">${eventEmoji}</div>
                    <div class="text-sm text-slate-500 dark:text-slate-400 mb-2">${event.event_type}</div>
                    <div class="text-base font-medium text-slate-800 dark:text-slate-100 mb-4">${event.event_content}</div>
                    <div class="text-sm ${event.reputation_change >= 0 ? 'text-green-500' : 'text-red-500'} font-medium">
                        声望 ${changeText}
                    </div>
                    <button onclick="closeBossEvent()" class="mt-6 w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                        知道了
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        if (currentUser) {
            currentUser.reputation = Math.max(0, Math.min(100, currentUser.reputation + event.reputation_change));
            updateUserUI();
        }
        
        refreshRanking();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function closeBossEvent() {
    const modal = document.getElementById('boss-event-modal');
    if (modal) modal.remove();
}

async function loadComplaints() {
    try {
        const complaints = await API.getComplaints();
        renderComplaints(complaints);
    } catch (e) {
        console.error('Failed to load complaints:', e);
    }
}

function renderComplaints(complaints) {
    const container = document.getElementById('complaint-list');
    
    if (!complaints || complaints.length === 0) {
        container.innerHTML = '<div class="text-center text-sm text-slate-400 py-8">还没有人吐槽，快来第一个！</div>';
        return;
    }
    
    container.innerHTML = complaints.map(c => `
        <div class="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium" style="background: ${c.avatar_color}">
                    ${c.nickname.charAt(0)}
                </div>
                <span class="text-sm font-medium text-slate-700 dark:text-slate-200">${c.nickname}</span>
                <span class="text-xs text-slate-400 ml-auto">${formatTime(c.created_at)}</span>
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${c.content}</p>
            <button onclick="likeComplaint(${c.id})" class="mt-2 text-xs text-slate-400 hover:text-red-500 transition-colors">
                ❤️ ${c.likes}
            </button>
        </div>
    `).join('');
}

async function sendComplaint() {
    const input = document.getElementById('complaint-input');
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
        await API.sendComplaint({ content });
        input.value = '';
        loadComplaints();
        showToast('吐槽成功！', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function likeComplaint(id) {
    try {
        await API.likeComplaint(id);
        loadComplaints();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function openComplaintPanel() {
    document.getElementById('complaint-panel').classList.remove('hidden');
    loadComplaints();
}

function closeComplaintPanel() {
    document.getElementById('complaint-panel').classList.add('hidden');
}

async function loadVotes() {
    try {
        const votes = await API.getVotes();
        renderVotes(votes);
    } catch (e) {
        console.error('Failed to load votes:', e);
    }
}

function renderVotes(votes) {
    const container = document.getElementById('vote-list');
    
    if (!votes || votes.length === 0) {
        container.innerHTML = '<div class="text-center text-sm text-slate-400 py-8">暂无投票，发起一个吧！</div>';
        return;
    }
    
    container.innerHTML = votes.map(v => {
        const maxVotes = Math.max(...v.vote_counts, 1);
        
        return `
            <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">${v.title}</span>
                    <span class="text-xs text-slate-400 ml-auto">${v.total_votes}人参与</span>
                </div>
                <div class="space-y-2">
                    ${v.options.map((opt, idx) => {
                        const percentage = v.total_votes > 0 ? Math.round(v.vote_counts[idx] / v.total_votes * 100) : 0;
                        return `
                            <div onclick="submitVote(${v.id}, ${idx})" class="relative cursor-pointer">
                                <div class="relative z-10 flex items-center justify-between p-2 text-sm">
                                    <span class="text-slate-700 dark:text-slate-200">${opt}</span>
                                    <span class="text-slate-500 dark:text-slate-400">${v.vote_counts[idx]}票 (${percentage}%)</span>
                                </div>
                                <div class="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/30 rounded transition-all" style="width: ${percentage}%"></div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="text-xs text-slate-400 mt-3">发起人：${v.creator_nickname}</div>
            </div>
        `;
    }).join('');
}

async function submitVote(voteId, optionIndex) {
    try {
        await API.submitVote({ vote_id: voteId, option_index: optionIndex });
        loadVotes();
        showToast('投票成功！', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function showCreateVote() {
    document.getElementById('create-vote-modal').classList.remove('hidden');
    document.getElementById('vote-title').value = '';
    document.getElementById('vote-options-container').innerHTML = `
        <input type="text" placeholder="选项1" class="vote-option-input w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        <input type="text" placeholder="选项2" class="vote-option-input w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
    `;
}

function closeCreateVote() {
    document.getElementById('create-vote-modal').classList.add('hidden');
}

function addVoteOption() {
    const container = document.getElementById('vote-options-container');
    const count = container.children.length;
    if (count >= 6) {
        showToast('最多6个选项', 'warning');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `选项${count + 1}`;
    input.className = 'vote-option-input w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm';
    container.appendChild(input);
}

async function createVote() {
    const title = document.getElementById('vote-title').value.trim();
    const optionInputs = document.querySelectorAll('.vote-option-input');
    const options = Array.from(optionInputs).map(i => i.value.trim()).filter(v => v);
    
    if (!title) {
        showToast('请输入投票主题', 'error');
        return;
    }
    if (options.length < 2) {
        showToast('至少需要2个选项', 'error');
        return;
    }
    
    try {
        await API.createVote({ title, options });
        closeCreateVote();
        loadVotes();
        showToast('投票创建成功！', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function openVotePanel() {
    document.getElementById('vote-panel').classList.remove('hidden');
    loadVotes();
}

function closeVotePanel() {
    document.getElementById('vote-panel').classList.add('hidden');
}

function activateDisguise(type) {
    const overlay = document.getElementById('disguise-overlay');
    overlay.classList.add('active');
    
    if (type === 'excel') {
        overlay.innerHTML = generateExcelDisguise();
    } else {
        overlay.innerHTML = generateCodeDisguise();
    }
    
    showToast('伪装模式已开启，按 ESC 或点击退出按钮返回', 'info');
    
    function handleKeydown(e) {
        if (e.key === 'Escape') {
            deactivateDisguise();
            document.removeEventListener('keydown', handleKeydown);
        }
    }
    document.addEventListener('keydown', handleKeydown);
}

function deactivateDisguise() {
    const overlay = document.getElementById('disguise-overlay');
    overlay.classList.remove('active');
    showToast('已恢复正常页面', 'info');
}

function generateExcelDisguise() {
    const rows = 40;
    const cols = 12;
    const colLabels = 'ABCDEFGHIJKL';
    
    const departments = ['研发部', '产品部', '运营部', '财务部', '人事部', '市场部'];
    const positions = ['高级工程师', '工程师', '产品经理', '运营专员', '财务主管', '人事专员'];
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '陈二'];
    
    let tableRows = '';
    for (let i = 0; i < rows; i++) {
        let cells = `<td class="border border-gray-300 bg-gray-100 text-center text-xs text-gray-600 w-10 select-none">${i + 1}</td>`;
        for (let j = 0; j < cols; j++) {
            let val = '';
            if (i === 0) {
                val = ['部门', '姓名', '工号', '职位', '入职日期', '基本工资', '绩效奖金', '餐补', '交通补贴', '扣款', '实发工资', '备注'][j] || '';
            } else if (i <= 15) {
                if (j === 0) val = departments[Math.floor(Math.random() * departments.length)];
                else if (j === 1) val = names[Math.floor(Math.random() * names.length)];
                else if (j === 2) val = 'EMP' + String(i).padStart(4, '0');
                else if (j === 3) val = positions[Math.floor(Math.random() * positions.length)];
                else if (j === 4) val = `${2020 + Math.floor(Math.random() * 4)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`;
                else if (j === 5) val = String(8000 + Math.floor(Math.random() * 12000));
                else if (j === 6) val = String(Math.floor(Math.random() * 5000));
                else if (j === 7) val = String(Math.floor(Math.random() * 500));
                else if (j === 8) val = String(Math.floor(Math.random() * 300));
                else if (j === 9) val = String(Math.floor(Math.random() * 200));
                else if (j === 10) val = String(10000 + Math.floor(Math.random() * 15000));
                else val = '';
            }
            cells += `<td class="border border-gray-300 px-2 py-1 text-xs select-none">${val}</td>`;
        }
        tableRows += `<tr>${cells}</tr>`;
    }
    
    return `
        <div class="w-full h-full bg-white overflow-hidden font-sans select-none">
            <div class="bg-blue-600 text-white px-4 py-2 flex items-center gap-4 text-sm shadow-sm">
                <span class="font-bold">📊 员工薪资核算表.xlsx</span>
                <div class="flex-1"></div>
                <span>文件</span>
                <span>开始</span>
                <span>插入</span>
                <span>页面布局</span>
                <span>公式</span>
                <span>数据</span>
                <span>审阅</span>
                <span>视图</span>
                <div class="flex items-center gap-2 ml-4">
                    <span class="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-xs cursor-pointer hover:bg-red-600" onclick="deactivateDisguise()">✕</span>
                </div>
            </div>
            <div class="bg-gray-100 border-b border-gray-300 px-4 py-1 text-xs text-gray-600 flex items-center gap-2">
                <span>fx</span>
                <span class="bg-white px-2 py-0.5 border border-gray-300 rounded text-gray-700 font-medium">G1</span>
                <span class="bg-white px-2 py-0.5 border border-gray-300 rounded flex-1 text-gray-800">=SUM(E1:F1)</span>
            </div>
            <div class="flex border-b border-gray-300 bg-gray-50">
                <div class="flex gap-1 p-1">
                    <button class="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded">☝️</button>
                    <button class="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded">⬆️</button>
                    <button class="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded">⬇️</button>
                    <button class="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded">✌️</button>
                    <button class="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded">➡️</button>
                </div>
                <div class="flex-1 flex items-center justify-center">
                    <span class="text-xs text-gray-500">Sheet1</span>
                </div>
                <div class="flex items-center gap-4 px-4 text-xs text-gray-500">
                    <span>就绪</span>
                    <span>100%</span>
                    <span>普通</span>
                </div>
            </div>
            <div class="overflow-auto h-[calc(100%-130px)]">
                <table class="w-full border-collapse text-sm">
                    <thead>
                        <tr>
                            <th class="border border-gray-300 bg-gray-100 w-10 select-none"></th>
                            ${Array.from(colLabels).map(c => `<th class="border border-gray-300 bg-gray-100 text-xs font-normal text-gray-600 px-2 py-1 select-none">${c}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            <div class="fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300 px-4 py-1 text-xs text-gray-600 flex items-center gap-4 shadow-inner">
                <span class="bg-white px-3 py-0.5 rounded border border-gray-300 cursor-pointer hover:bg-gray-50">Sheet1</span>
                <span class="text-gray-400">+</span>
                <div class="flex-1"></div>
                <span>就绪</span>
                <span>|</span>
                <span>100%</span>
                <span>|</span>
                <span>普通视图</span>
            </div>
        </div>
    `;
}

function generateCodeDisguise() {
    const codeLines = [
        'const express = require(\'express\');',
        'const mongoose = require(\'mongoose\');',
        'const cors = require(\'cors\');',
        '',
        'const app = express();',
        'const PORT = process.env.PORT || 3000;',
        '',
        'app.use(cors());',
        'app.use(express.json());',
        '',
        'mongoose.connect(process.env.MONGODB_URI, {',
        '  useNewUrlParser: true,',
        '  useUnifiedTopology: true',
        '}).then(() => {',
        '  console.log(\'Connected to MongoDB\');',
        '}).catch(err => {',
        '  console.error(\'MongoDB connection error:\', err);',
        '});',
        '',
        'const employeeRoutes = require(\'./routes/employees\');',
        'const payrollRoutes = require(\'./routes/payroll\');',
        '',
        'app.use(\'/api/employees\', employeeRoutes);',
        'app.use(\'/api/payroll\', payrollRoutes);',
        '',
        'app.get(\'/api/health\', (req, res) => {',
        '  res.json({ status: \'ok\', timestamp: new Date().toISOString() });',
        '});',
        '',
        'app.listen(PORT, () => {',
        '  console.log(`Server running on port ${PORT}`);',
        '});',
        '',
        '// Employee Model',
        'const EmployeeSchema = new mongoose.Schema({',
        '  name: { type: String, required: true },',
        '  department: { type: String, required: true },',
        '  position: { type: String, required: true },',
        '  salary: { type: Number, required: true },',
        '  hireDate: { type: Date, default: Date.now },',
        '  isActive: { type: Boolean, default: true }',
        '});',
        '',
        'module.exports = mongoose.model(\'Employee\', EmployeeSchema);',
    ];
    
    return `
        <div class="w-full h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm overflow-hidden select-none">
            <div class="flex h-full">
                <div class="w-16 bg-[#252526] border-r border-[#3c3c3c] p-2 text-xs">
                    <div class="text-gray-500 mb-1">📁 EXPLORER</div>
                    <div class="text-gray-400 mb-1">📂 src</div>
                    <div class="pl-2 text-gray-300">📄 server.js</div>
                    <div class="pl-2 text-gray-300">📄 app.js</div>
                    <div class="text-gray-400 mb-1">📂 routes</div>
                    <div class="pl-2 text-gray-300">📄 employees.js</div>
                    <div class="pl-2 text-gray-300">📄 payroll.js</div>
                    <div class="text-gray-400 mb-1">📂 models</div>
                    <div class="pl-2 text-gray-300">📄 Employee.js</div>
                    <div class="pl-2 text-gray-300">📄 Payroll.js</div>
                </div>
                <div class="flex-1 flex flex-col">
                    <div class="bg-[#252526] border-b border-[#3c3c3c] px-4 py-1 flex items-center gap-2">
                        <span class="text-xs text-gray-400">server.js</span>
                        <span class="text-xs text-gray-500">●</span>
                        <div class="flex-1"></div>
                        <span class="text-xs text-gray-500">JavaScript</span>
                        <span class="text-xs text-green-500">✓</span>
                        <span class="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-xs cursor-pointer hover:bg-red-600 ml-2" onclick="deactivateDisguise()">✕</span>
                    </div>
                    <div class="flex border-b border-[#3c3c3c] bg-[#323233]">
                        <div class="flex gap-1 p-1">
                            <button class="px-2 py-1 text-xs bg-[#252526] hover:bg-[#3c3c3c] rounded text-gray-400">📝</button>
                            <button class="px-2 py-1 text-xs bg-[#252526] hover:bg-[#3c3c3c] rounded text-gray-400">🔍</button>
                            <button class="px-2 py-1 text-xs bg-[#252526] hover:bg-[#3c3c3c] rounded text-gray-400">⬅️</button>
                            <button class="px-2 py-1 text-xs bg-[#252526] hover:bg-[#3c3c3c] rounded text-gray-400">➡️</button>
                            <button class="px-2 py-1 text-xs bg-[#252526] hover:bg-[#3c3c3c] rounded text-gray-400">⬆️</button>
                            <button class="px-2 py-1 text-xs bg-[#252526] hover:bg-[#3c3c3c] rounded text-gray-400">⬇️</button>
                        </div>
                        <div class="flex-1 flex items-center justify-center">
                            <span class="text-xs text-gray-500">UTF-8</span>
                        </div>
                        <div class="flex items-center gap-4 px-4 text-xs text-gray-500">
                            <span>LF</span>
                            <span>JavaScript</span>
                            <span>Ln 28, Col 12</span>
                        </div>
                    </div>
                    <div class="flex-1 overflow-auto">
                        <div class="flex">
                            <div class="bg-[#252526] w-12 py-4 text-right pr-3 text-gray-600 text-xs">
                                ${codeLines.map((_, i) => `<div>${i + 1}</div>`).join('')}
                            </div>
                            <div class="flex-1 py-4 pl-4">
                                ${codeLines.map(line => {
                                    let colored = line
                                        .replace(/const|require|module\.exports/g, '<span class="text-yellow-400">$&</span>')
                                        .replace(/function|new|class|return/g, '<span class="text-purple-400">$&</span>')
                                        .replace(/mongoose|express|cors/g, '<span class="text-green-400">$&</span>')
                                        .replace(/app\.|mongoose\./g, '<span class="text-green-400">$&</span>')
                                        .replace(/'[^']*'/g, '<span class="text-orange-300">$&</span>')
                                        .replace(/\d+/g, '<span class="text-blue-400">$&</span>')
                                        .replace(/\/\/.*/g, '<span class="text-gray-600 italic">$&</span>')
                                        .replace(/true|false|null|undefined/g, '<span class="text-blue-400">$&</span>');
                                    return `<div>${colored || '&nbsp;'}</div>`;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="bg-[#252526] border-t border-[#3c3c3c] px-4 py-1 text-xs text-gray-500">
                        <span>TERMINAL</span>
                        <span class="ml-2">node server.js</span>
                        <span class="ml-2 text-green-400">Server running on port 3000</span>
                        <span class="ml-2 text-green-400">Connected to MongoDB</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return date.toLocaleDateString('zh-CN');
}

function switchView(view) {
    currentView = view;
    
    document.querySelectorAll('.view-tab').forEach(tab => {
        if (tab.dataset.view === view) {
            tab.classList.remove('bg-white/50', 'dark:bg-slate-700/50', 'text-slate-600', 'dark:text-slate-400');
            tab.classList.add('bg-white', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-200', 'shadow-sm');
        } else {
            tab.classList.add('bg-white/50', 'dark:bg-slate-700/50', 'text-slate-600', 'dark:text-slate-400');
            tab.classList.remove('bg-white', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-200', 'shadow-sm');
        }
    });
    
    document.querySelectorAll('.view-scene').forEach(scene => {
        scene.classList.add('hidden');
    });
    document.getElementById(view + '-scene').classList.remove('hidden');
    
    if (view === 'pantry') {
        openComplaintPanel();
    } else {
        closeComplaintPanel();
    }
    
    if (view === 'meeting') {
        openVotePanel();
    } else {
        closeVotePanel();
    }
    
    if (view === 'rooftop') {
        checkRooftopStatus();
    }
    
    refreshSceneForView(view);
}

async function checkRooftopStatus() {
    try {
        const status = await API.getRooftopStatus();
        const statusEl = document.getElementById('rooftop-status');
        if (!status.is_open) {
            showToast(status.message, 'warning');
        }
    } catch (e) {
        console.error('Failed to check rooftop status:', e);
    }
}

function refreshAllData() {
    refreshUsers();
    refreshMessages();
    refreshRanking();
    refreshStats();
}

async function init() {
    initDarkMode();
    updateTime();
    setInterval(updateTime, 1000);
    
    document.getElementById('message-input').addEventListener('input', updateCharCount);
    
    document.addEventListener('click', (e) => {
        const picker = document.getElementById('emoji-picker');
        if (!picker.contains(e.target) && !e.target.closest('button[onclick="showEmojiPicker()"]')) {
            picker.classList.add('hidden');
        }
    });
    
    await loadConfig();
    
    const loggedIn = await checkLogin();
    if (!loggedIn) {
        await autoCreateUser();
    }
    
    refreshAllData();
    
    setInterval(() => {
        refreshUsers();
        refreshMessages();
        refreshStats();
    }, 10000);
    
    setInterval(() => {
        refreshRanking();
    }, 60000);

    setInterval(() => {
        API.triggerAIAction().catch(() => {});
    }, 15000);
}

init();
