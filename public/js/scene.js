const DESK_POSITIONS = {
    '靠窗黄金区': [
        { x: 80, y: 80 }, { x: 180, y: 80 }, { x: 280, y: 80 },
        { x: 80, y: 160 }, { x: 180, y: 160 }, { x: 280, y: 160 },
    ],
    '普通办公区': [
        { x: 380, y: 80 }, { x: 480, y: 80 }, { x: 580, y: 80 },
        { x: 380, y: 160 }, { x: 480, y: 160 }, { x: 580, y: 160 },
        { x: 380, y: 240 }, { x: 480, y: 240 }, { x: 580, y: 240 },
    ],
    '角落摸鱼区': [
        { x: 600, y: 280 }, { x: 600, y: 340 },
        { x: 520, y: 320 },
    ],
};

const BASEMENT_DESK_POSITIONS = [
    { x: 80, y: 100 }, { x: 180, y: 100 }, { x: 280, y: 100 }, { x: 380, y: 100 },
    { x: 80, y: 180 }, { x: 180, y: 180 }, { x: 280, y: 180 }, { x: 380, y: 180 },
    { x: 80, y: 260 }, { x: 180, y: 260 }, { x: 280, y: 260 }, { x: 380, y: 260 },
];

const PANTRY_POSITIONS = [
    { x: 200, y: 200 }, { x: 280, y: 220 }, { x: 350, y: 200 },
    { x: 200, y: 280 }, { x: 280, y: 300 }, { x: 350, y: 280 },
];

const MEETING_POSITIONS = [
    { x: 180, y: 140 }, { x: 260, y: 120 }, { x: 340, y: 140 },
    { x: 180, y: 220 }, { x: 260, y: 240 }, { x: 340, y: 220 },
];

const ROOFTOP_POSITIONS = [
    { x: 150, y: 180 }, { x: 230, y: 160 }, { x: 310, y: 180 },
    { x: 390, y: 160 }, { x: 470, y: 180 },
    { x: 150, y: 280 }, { x: 230, y: 300 }, { x: 310, y: 280 },
];

let userDeskAssignments = {};

function assignDesk(userId, area) {
    const positions = DESK_POSITIONS[area] || DESK_POSITIONS['普通办公区'];
    const usedPositions = Object.values(userDeskAssignments)
        .filter(a => a.area === area)
        .map(a => a.posIndex);
    
    let posIndex = 0;
    for (let i = 0; i < positions.length; i++) {
        if (!usedPositions.includes(i)) {
            posIndex = i;
            break;
        }
    }
    
    if (usedPositions.includes(posIndex)) {
        posIndex = Math.floor(Math.random() * positions.length);
    }
    
    userDeskAssignments[userId] = { area, posIndex };
    return posIndex;
}

function getPersonPosition(user) {
    const area = user.area;
    
    if (area === '地下加班区') {
        const idx = (user.id % BASEMENT_DESK_POSITIONS.length);
        return {
            x: BASEMENT_DESK_POSITIONS[idx].x,
            y: BASEMENT_DESK_POSITIONS[idx].y,
        };
    }
    
    const positions = DESK_POSITIONS[area] || DESK_POSITIONS['普通办公区'];
    const assignment = userDeskAssignments[user.id];
    let posIndex;
    
    if (assignment && assignment.area === area) {
        posIndex = assignment.posIndex;
    } else {
        posIndex = assignDesk(user.id, area);
    }
    
    return {
        x: positions[posIndex % positions.length].x,
        y: positions[posIndex % positions.length].y,
    };
}

function renderDesks() {
    const container = document.getElementById('desks-container');
    if (!container) return;
    
    let html = '';
    
    Object.entries(DESK_POSITIONS).forEach(([area, positions]) => {
        positions.forEach(pos => {
            html += `
                <div class="desk" style="left: ${pos.x}px; top: ${pos.y}px;"></div>
            `;
        });
    });
    
    container.innerHTML = html;
}

function renderBasementDesks() {
    const container = document.getElementById('basement-desks');
    if (!container) return;
    
    let html = '';
    BASEMENT_DESK_POSITIONS.forEach(pos => {
        html += `
            <div class="desk" style="left: ${pos.x}px; top: ${pos.y}px; background: linear-gradient(135deg, #374151 0%, #1F2937 100%); box-shadow: 2px 2px 0 #111827, 4px 4px 8px rgba(0,0,0,0.3);"></div>
        `;
    });
    
    container.innerHTML = html;
}

function renderPeople(users) {
    renderOfficePeople(users);
    renderPantryPeople(users);
    renderMeetingPeople(users);
    renderRooftopPeople(users);
    renderBasementPeople(users);
}

function createPersonElement(user, pos, extraClass = '') {
    const isAI = user.is_ai;
    const isMe = currentUser && currentUser.id === user.id;
    
    return `
        <div class="person iso-person ${extraClass}" 
             style="left: ${pos.x + 18}px; top: ${pos.y - 20}px; animation: float ${3 + Math.random() * 2}s ease-in-out infinite; animation-delay: ${Math.random() * 2}s;"
             onclick="showGiftModal(${user.id}, '${user.nickname}')"
             title="${user.nickname} - ${user.position}">
            <div class="person-status">
                ${isAI ? '🤖 ' : ''}${user.status}
            </div>
            <div class="person-head" style="background: ${user.avatar_color}; ${isMe ? 'box-shadow: 0 0 0 2px #22C55E, 0 0 8px rgba(34,197,94,0.5);' : ''}"></div>
            <div class="person-body" style="background: ${adjustColor(user.avatar_color, -30)};"></div>
            <div class="person-nickname">${user.nickname}${isAI ? '🤖' : ''}${isMe ? ' (我)' : ''}</div>
        </div>
    `;
}

function renderOfficePeople(users) {
    const container = document.getElementById('people-container');
    if (!container) return;
    
    const officeUsers = users.filter(u => 
        u.area === '靠窗黄金区' || u.area === '普通办公区' || u.area === '角落摸鱼区'
    );
    
    let html = '';
    officeUsers.forEach(user => {
        const pos = getPersonPosition(user);
        html += createPersonElement(user, pos);
    });
    
    container.innerHTML = html;
}

function renderPantryPeople(users) {
    const container = document.getElementById('pantry-people');
    if (!container) return;
    
    const pantryUsers = users.filter(u => u.area === '茶水间');
    const positions = PANTRY_POSITIONS;
    
    let html = '';
    pantryUsers.slice(0, positions.length).forEach((user, idx) => {
        const pos = positions[idx];
        html += createPersonElement(user, pos);
    });
    
    container.innerHTML = html;
}

function renderMeetingPeople(users) {
    const container = document.getElementById('meeting-people');
    if (!container) return;
    
    const meetingUsers = users.filter(u => u.area === '会议室');
    const positions = MEETING_POSITIONS;
    
    let html = '';
    meetingUsers.slice(0, positions.length).forEach((user, idx) => {
        const pos = positions[idx];
        html += createPersonElement(user, pos);
    });
    
    container.innerHTML = html;
}

function renderRooftopPeople(users) {
    const container = document.getElementById('rooftop-people');
    if (!container) return;
    
    const rooftopUsers = users.filter(u => u.area === '天台吸烟区');
    const positions = ROOFTOP_POSITIONS;
    
    let html = '';
    rooftopUsers.slice(0, positions.length).forEach((user, idx) => {
        const pos = positions[idx];
        html += createPersonElement(user, pos);
    });
    
    container.innerHTML = html;
}

function renderBasementPeople(users) {
    const container = document.getElementById('basement-people');
    if (!container) return;
    
    const basementUsers = users.filter(u => u.area === '地下加班区');
    
    let html = '';
    basementUsers.forEach((user, idx) => {
        const pos = {
            x: BASEMENT_DESK_POSITIONS[idx % BASEMENT_DESK_POSITIONS.length].x,
            y: BASEMENT_DESK_POSITIONS[idx % BASEMENT_DESK_POSITIONS.length].y,
        };
        html += createPersonElement(user, pos);
    });
    
    container.innerHTML = html;
}

function renderNotes(messages) {
    const container = document.getElementById('notes-container');
    if (!container) return;
    
    const noteMessages = messages.filter(m => m.message_type === 'note');
    
    let html = '';
    const colors = ['#FEF3C7', '#FCE7F3', '#DBEAFE', '#D1FAE5', '#FED7AA', '#E9D5FF'];
    
    noteMessages.slice(0, 15).forEach((msg, idx) => {
        const areaPositions = DESK_POSITIONS[msg.area] || DESK_POSITIONS['普通办公区'];
        const posIdx = idx % areaPositions.length;
        const pos = areaPositions[posIdx];
        const color = colors[idx % colors.length];
        
        const isDark = document.documentElement.classList.contains('dark');
        const bgStyle = isDark 
            ? `background: ${adjustColorBrightness(color, -40)}; color: ${color};` 
            : `background: ${color};`;
        
        html += `
            <div class="sticky-note" 
                 style="left: ${pos.x + 5}px; top: ${pos.y - 35 - (idx % 3) * 15}px; ${bgStyle} transform: rotate(${(Math.random() - 0.5) * 6}deg); z-index: ${3 + (idx % 3)};"
                 title="${msg.nickname} - ${formatTime(msg.created_at)}">
                <div class="text-[9px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium">${msg.nickname}</div>
                <div>${escapeHtml(msg.content)}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function adjustColor(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function adjustColorBrightness(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function refreshSceneForView(view) {
    if (view === 'basement') {
        renderBasementDesks();
    }
}

function initScene() {
    renderDesks();
    renderBasementDesks();
}

document.addEventListener('DOMContentLoaded', initScene);
