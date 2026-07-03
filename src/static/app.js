const tg = window.Telegram.WebApp;
tg.expand();

const socket = io();
let currentRoomId = null;
let myPlayer = {
    id: tg.initDataUnsafe.user?.id.toString() || 'test-user-' + Math.floor(Math.random() * 1000),
    firstName: tg.initDataUnsafe.user?.first_name || 'Test User',
    username: tg.initDataUnsafe.user?.username,
};

document.getElementById('user-info').innerText = `Hello, ${myPlayer.firstName}`;

// UI Elements
const lobby = document.getElementById('lobby');
const waitingRoom = document.getElementById('waiting-room');
const gameScreen = document.getElementById('game-screen');

// Navigation
function showScreen(screenId) {
    [lobby, waitingRoom, gameScreen].forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

// Actions
document.getElementById('create-room-btn').addEventListener('click', async () => {
    const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: myPlayer, type: 'BINGO_75' })
    });
    const room = await res.json();
    joinRoom(room.id);
});

document.getElementById('join-room-btn').addEventListener('click', () => {
    const roomId = document.getElementById('room-id-input').value.toUpperCase();
    if (roomId) joinRoom(roomId);
});

async function joinRoom(roomId) {
    currentRoomId = roomId;
    const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: myPlayer })
    });
    const room = await res.json();

    document.getElementById('display-room-id').innerText = room.id;
    updatePlayersList(room.players);

    if (room.hostId === myPlayer.id) {
        document.getElementById('start-game-btn').style.display = 'inline-block';
        document.getElementById('waiting-msg').style.display = 'none';
    }

    socket.emit('join_room', roomId);
    showScreen('waiting-room');
}

function updatePlayersList(players) {
    const list = document.getElementById('players-list');
    list.innerHTML = players.map(p => `<div>${p.firstName}</div>`).join('');
}

document.getElementById('start-game-btn').addEventListener('click', () => {
    socket.emit('start_game', currentRoomId);
});

document.getElementById('draw-btn').addEventListener('click', () => {
    socket.emit('draw_number', currentRoomId);
});

document.getElementById('bingo-btn').addEventListener('click', () => {
    socket.emit('claim_bingo', { roomId: currentRoomId, playerId: myPlayer.id });
});

// Socket Listeners
socket.on('player_joined', ({ player }) => {
    // Refresh room state or just add to list
    console.log('Player joined:', player);
});

socket.on('game_started', async (room) => {
    const res = await fetch(`/api/rooms/${currentRoomId}/cards/${myPlayer.id}`);
    const card = await res.json();
    renderCard(card);

    if (room.hostId === myPlayer.id) {
        document.getElementById('draw-btn').style.display = 'inline-block';
    }

    showScreen('game-screen');
});

socket.on('number_drawn', ({ number }) => {
    const container = document.getElementById('drawn-numbers');
    const ball = document.createElement('div');
    ball.className = 'number-ball';
    ball.innerText = number;
    container.appendChild(ball);

    // Highlight on card
    const cells = document.querySelectorAll(`#card-cell-${number}`);
    cells.forEach(c => c.classList.add('marked'));
});

socket.on('bingo_claimed', ({ playerId, room }) => {
    alert(`BINGO! Player ${playerId} won!`);
    if (room.status === 'FINISHED') {
        tg.showAlert('Game Over!');
    }
});

socket.on('error', (msg) => {
    alert('Error: ' + msg);
});

function renderCard(card) {
    const container = document.getElementById('bingo-card-container');
    let html = '<table>';
    card.numbers.forEach(row => {
        html += '<tr>';
        row.forEach(num => {
            if (num === null) {
                html += '<td class="marked">FREE</td>';
            } else {
                html += `<td id="card-cell-${num}">${num}</td>`;
            }
        });
        html += '</tr>';
    });
    html += '</table>';
    container.innerHTML = html;
}
