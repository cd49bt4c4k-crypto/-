let currentUser = null;
let replyMsg = null;
let disguiseTab = 'code';
let musicQueue = [];
let currentSongIndex = -1;
let isPlaying = false;

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

function switchCodeFile(file) {
    document.getElementById('code-main-py').classList.toggle('hidden', file !== 'main.py');
    document.getElementById('code-database-sql').classList.toggle('hidden', file !== 'database.sql');
    document.getElementById('tab-main-py').className = file === 'main.py' 
        ? 'flex items-center gap-1.5 px-3 py-1 bg-[#1e1e1e] text-white rounded-t border-r border-[#3c3c3c]'
        : 'flex items-center gap-1.5 px-3 py-1 text-gray-400 hover:text-white rounded-t';
    document.getElementById('tab-database-sql').className = file === 'database.sql'
        ? 'flex items-center gap-1.5 px-3 py-1 bg-[#1e1e1e] text-white rounded-t border-r border-[#3c3c3c]'
        : 'flex items-center gap-1.5 px-3 py-1 text-gray-400 hover:text-white rounded-t';
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
    const panel = document.getElementById('music-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        initMusicPlayer();
    }
}

let audioPlayer = null;
let progressInterval = null;

function initMusicPlayer() {
    if (!audioPlayer) {
        audioPlayer = document.getElementById('audio-player');
        document.getElementById('progress-bar').addEventListener('input', seekTo);
        document.getElementById('volume-bar').addEventListener('input', adjustVolume);
    }
}

async function searchMusic() {
    const kw = document.getElementById('music-search').value.trim();
    if (!kw) return;

    try {
        const r = await API.searchMusic(kw);
        renderMusicList(r.songs || []);
    } catch (e) {
        showToast('搜索失败，请稍后重试', 'error');
        renderMusicList(getMockSongs());
    }
}

async function loadPlaylist(id) {
    try {
        const r = await API.getPlaylist(id);
        renderMusicList(r.tracks || []);
    } catch (e) {
        renderMusicList(getMockPlaylist(id));
    }
}

function getMockSongs() {
    return [
        { id: 186016, name: '晴天', artist: '周杰伦', album: '叶惠美', cover: 'https://picsum.photos/64/64?random=1' },
        { id: 186155, name: '稻香', artist: '周杰伦', album: '魔杰座', cover: 'https://picsum.photos/64/64?random=2' },
        { id: 186087, name: '七里香', artist: '周杰伦', album: '七里香', cover: 'https://picsum.photos/64/64?random=3' },
        { id: 186038, name: '夜曲', artist: '周杰伦', album: '十一月的萧邦', cover: 'https://picsum.photos/64/64?random=4' },
        { id: 186032, name: '简单爱', artist: '周杰伦', album: '范特西', cover: 'https://picsum.photos/64/64?random=5' },
    ];
}

function getMockPlaylist(id) {
    const lists = {
        1: [{ id: 101, name: '早安隆回', artist: '袁树雄', album: '早安隆回', cover: 'https://picsum.photos/64/64?r=101' },
            { id: 102, name: '可可托海的牧羊人', artist: '王琪', album: '可可托海的牧羊人', cover: 'https://picsum.photos/64/64?r=102' },
            { id: 103, name: '孤勇者', artist: '陈奕迅', album: '孤勇者', cover: 'https://picsum.photos/64/64?r=103' },
            { id: 104, name: '起风了', artist: '买辣椒也用券', album: '起风了', cover: 'https://picsum.photos/64/64?r=104' },
            { id: 105, name: '这世界那么多人', artist: '莫文蔚', album: '这世界那么多人', cover: 'https://picsum.photos/64/64?r=105' }],
        2: [{ id: 201, name: '最伟大的作品', artist: '周杰伦', album: '最伟大的作品', cover: 'https://picsum.photos/64/64?r=201' },
            { id: 202, name: '告白气球', artist: '周杰伦', album: '周杰伦的床边故事', cover: 'https://picsum.photos/64/64?r=202' },
            { id: 203, name: 'Mojito', artist: '周杰伦', album: 'Mojito', cover: 'https://picsum.photos/64/64?r=203' },
            { id: 204, name: '搁浅', artist: '周杰伦', album: '七里香', cover: 'https://picsum.photos/64/64?r=204' },
            { id: 205, name: '轨迹', artist: '周杰伦', album: '寻找周杰伦', cover: 'https://picsum.photos/64/64?r=205' }],
        3: [{ id: 301, name: '后来', artist: '刘若英', album: '后来', cover: 'https://picsum.photos/64/64?r=301' },
            { id: 302, name: '十年', artist: '陈奕迅', album: '黑白灰', cover: 'https://picsum.photos/64/64?r=302' },
            { id: 303, name: '勇气', artist: '梁静茹', album: '勇气', cover: 'https://picsum.photos/64/64?r=303' },
            { id: 304, name: '可惜不是你', artist: '梁静茹', album: '丝路', cover: 'https://picsum.photos/64/64?r=304' },
            { id: 305, name: '成全', artist: '林宥嘉', album: '成全', cover: 'https://picsum.photos/64/64?r=305' }],
        4: [{ id: 401, name: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', cover: 'https://picsum.photos/64/64?r=401' },
            { id: 402, name: 'Shape of You', artist: 'Ed Sheeran', album: '÷', cover: 'https://picsum.photos/64/64?r=402' },
            { id: 403, name: 'Dance Monkey', artist: 'Tones and I', album: 'The Kids Are Coming', cover: 'https://picsum.photos/64/64?r=403' },
            { id: 404, name: 'Bad Guy', artist: 'Billie Eilish', album: 'WHEN WE ALL FALL ASLEEP', cover: 'https://picsum.photos/64/64?r=404' },
            { id: 405, name: 'Perfect', artist: 'Ed Sheeran', album: '÷', cover: 'https://picsum.photos/64/64?r=405' }]
    };
    return lists[id] || [];
}

function renderMusicList(songs) {
    const box = document.getElementById('music-content');
    if (!songs || songs.length === 0) {
        box.innerHTML = '<div class="text-center text-sm text-slate-400 py-12">没有找到相关歌曲</div>';
        return;
    }

    musicQueue = songs;
    document.getElementById('queue-count').textContent = `${songs.length} 首`;

    box.innerHTML = songs.map((s, i) => `
        <div onclick="playSongAt(${i})"
             class="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors ${currentSongIndex === i ? 'bg-music-100 dark:bg-purple-900/30' : ''}">
            <img src="${s.cover || 'https://picsum.photos/64/64'}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0">
            <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">${s.name}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 truncate">${s.artist} · ${s.album}</div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="event.stopPropagation(); addToQueue(${i})" class="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600">+</button>
                <button onclick="event.stopPropagation(); shareToChat(${i})" class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">分享</button>
            </div>
        </div>
    `).join('');
}

function playSongAt(index) {
    if (index < 0 || index >= musicQueue.length) return;
    
    currentSongIndex = index;
    const song = musicQueue[index];
    
    document.getElementById('player-title').textContent = song.name;
    document.getElementById('player-artist').textContent = song.artist;
    document.getElementById('player-cover').src = song.cover || 'https://picsum.photos/64/64';
    
    loadSongUrl(song.id);
    loadLyrics(song.id);
    renderMusicList(musicQueue);
}

async function loadSongUrl(id) {
    try {
        const r = await API.getMusicUrl(id);
        if (r.url) {
            audioPlayer.src = r.url;
            audioPlayer.play();
            isPlaying = true;
            updatePlayButton();
        } else {
            showToast('无法获取播放链接', 'error');
            audioPlayer.src = '';
        }
    } catch (e) {
        showToast('加载失败，使用示例音频', 'warning');
        audioPlayer.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        audioPlayer.play();
        isPlaying = true;
        updatePlayButton();
    }
}

function togglePlay() {
    if (!audioPlayer) return;
    
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
    } else {
        audioPlayer.play();
        isPlaying = true;
    }
    updatePlayButton();
}

function updatePlayButton() {
    document.getElementById('play-btn').textContent = isPlaying ? '⏸' : '▶';
}

function prevSong() {
    if (musicQueue.length === 0) return;
    const newIndex = currentSongIndex > 0 ? currentSongIndex - 1 : musicQueue.length - 1;
    playSongAt(newIndex);
}

function nextSong() {
    if (musicQueue.length === 0) return;
    const newIndex = currentSongIndex < musicQueue.length - 1 ? currentSongIndex + 1 : 0;
    playSongAt(newIndex);
}

function addToQueue(index) {
    if (index < 0 || index >= musicQueue.length) return;
    const song = musicQueue[index];
    musicQueue.push(song);
    document.getElementById('queue-count').textContent = `${musicQueue.length} 首`;
    showToast('已添加到队列', 'success');
}

function shareToChat(index) {
    if (index < 0 || index >= musicQueue.length) return;
    const song = musicQueue[index];
    const msg = `🎵 分享歌曲：${song.name} - ${song.artist}\nhttps://music.163.com/#/song?id=${song.id}`;
    document.getElementById('chat-input').value = msg;
    document.getElementById('music-panel').classList.add('hidden');
    document.getElementById('chat-input').focus();
}

function updateProgress() {
    if (!audioPlayer || !isPlaying) return;
    
    const current = audioPlayer.currentTime;
    const total = audioPlayer.duration;
    
    if (total > 0) {
        const percent = (current / total) * 100;
        document.getElementById('progress-bar').value = percent;
        document.getElementById('current-time').textContent = formatDuration(current * 1000);
        document.getElementById('total-time').textContent = formatDuration(total * 1000);
        updateLyrics(current);
    }
}

function seekTo(e) {
    if (!audioPlayer) return;
    
    const percent = e.target.value;
    const total = audioPlayer.duration;
    if (total > 0) {
        audioPlayer.currentTime = (percent / 100) * total;
    }
}

function adjustVolume(e) {
    if (!audioPlayer) return;
    
    const vol = e.target.value / 100;
    audioPlayer.volume = vol;
    document.getElementById('volume-value').textContent = `${e.target.value}%`;
}

let lyricsData = [];

function toggleLyrics() {
    const panel = document.getElementById('lyrics-panel');
    panel.classList.toggle('hidden');
}

function updateLyrics(time) {
    if (!lyricsData.length) return;
    
    const container = document.getElementById('lyrics-container');
    const lines = container.querySelectorAll('.lyrics-line');
    
    for (let i = 0; i < lyricsData.length; i++) {
        if (time >= lyricsData[i].time) {
            lines.forEach(l => l.classList.remove('active'));
            if (lines[i]) lines[i].classList.add('active');
            container.scrollTop = lines[i]?.offsetTop - 100 || 0;
        }
    }
}

async function loadLyrics(id) {
    if (currentSongIndex < 0) return;
    
    try {
        const r = await API.getMusicLyrics(id);
        if (r.lyrics) {
            lyricsData = parseLyrics(r.lyrics);
            renderLyrics();
            return;
        }
    } catch (e) {}
    
    lyricsData = [
        { time: 0, text: '🎵 正在播放...' },
        { time: 5, text: '前奏响起' },
        { time: 15, text: '这是一段歌词' },
        { time: 25, text: '美妙的旋律' },
        { time: 35, text: '让人沉醉其中' },
        { time: 45, text: '跟随节奏摇摆' },
        { time: 55, text: '感受音乐的魅力' },
        { time: 65, text: '继续播放中...' },
        { time: 75, text: '歌声在耳边回荡' },
        { time: 85, text: '让我们一起唱' },
        { time: 95, text: '🎵 播放结束' },
    ];
    
    renderLyrics();
}

function parseLyrics(lyrics) {
    const lines = lyrics.split('\n');
    const result = [];
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    
    lines.forEach(line => {
        const match = line.match(regex);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const ms = parseInt(match[3].padEnd(3, '0'));
            const text = match[4].trim();
            if (text) {
                result.push({
                    time: minutes * 60 + seconds + ms / 1000,
                    text: text
                });
            }
        }
    });
    
    return result.sort((a, b) => a.time - b.time);
}

function renderLyrics() {
    const container = document.getElementById('lyrics-container');
    container.innerHTML = lyricsData.map(l => `
        <div class="lyrics-line text-sm text-slate-600 dark:text-slate-300">${l.text}</div>
    `).join('');
}

function openMV() {
    if (currentSongIndex < 0 || musicQueue.length === 0) return;
    const song = musicQueue[currentSongIndex];
    const url = `https://music.163.com/#/mv?id=${song.id}`;
    window.open(url, '_blank');
    showToast('正在打开MV...', 'info');
}

function toggleMusicDarkMode() {
    const panel = document.getElementById('music-panel');
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-icon').textContent = '🌙';
        localStorage.setItem('dark', '0');
    } else {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').textContent = '☀️';
        localStorage.setItem('dark', '1');
    }
}

function shareSong() {
    if (currentSongIndex < 0 || musicQueue.length === 0) return;
    shareToChat(currentSongIndex);
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