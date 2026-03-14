// ==========================================
// 战场幸存者 - 后端服务器
// 功能：Express服务器 + WebSocket + 房间管理 + 玩家同步 + 游戏逻辑
// ==========================================

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const GameLogic = require('./gameLogic');

// ==========================================
// 1. 创建Express服务器
// ==========================================
const app = express();
const PORT = process.env.PORT || 2567;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// 创建HTTP服务器
const server = http.createServer(app);

// ==========================================
// 2. 集成WebSocket服务器
// ==========================================
const wss = new WebSocket.Server({ server });

console.log('🎮 WebSocket服务器已创建');

// ==========================================
// 3. 房间管理系统
// ==========================================
const rooms = new Map(); // 房间列表 { roomId: Room }
const playerRooms = new Map(); // 玩家所在房间 { playerId: roomId }

// 房间类
class Room {
    constructor(id) {
        this.id = id;
        this.players = new Map(); // 玩家列表 { playerId: Player }
        this.maxPlayers = 4; // 最多4人
        this.minPlayers = 2; // 最少2人
        this.gameState = 'waiting'; // waiting, playing, ended
        this.createdAt = Date.now();
        this.gameLogic = new GameLogic(this); // 游戏逻辑
    }
    
    // 添加玩家
    addPlayer(player) {
        if (this.players.size >= this.maxPlayers) {
            return false; // 房间已满
        }
        
        this.players.set(player.id, player);
        console.log(`👤 玩家 ${player.name} 加入房间 ${this.id}`);
        
        // 如果房间人数达到2人，自动开始游戏
        if (this.players.size >= this.minPlayers && this.gameState === 'waiting') {
            this.startGame();
        }
        
        return true;
    }
    
    // 移除玩家
    removePlayer(playerId) {
        if (this.players.has(playerId)) {
            const player = this.players.get(playerId);
            console.log(`👋 玩家 ${player.name} 离开房间 ${this.id}`);
            this.players.delete(playerId);
            
            // 如果房间没有玩家了，删除房间
            if (this.players.size === 0) {
                console.log(`🏠 房间 ${this.id} 已空，删除房间`);
                // 停止游戏逻辑
                this.gameLogic.stopGame();
                rooms.delete(this.id);
            }
            // 如果房间人数少于2人，回到等待状态
            else if (this.players.size < this.minPlayers && this.gameState === 'playing') {
                this.gameState = 'waiting';
                console.log(`⏸️ 房间 ${this.id} 回到等待状态`);
            }
        }
    }
    
    // 开始游戏
    startGame() {
        this.gameState = 'playing';
        console.log(`🎮 房间 ${this.id} 游戏开始！`);
        
        // 启动游戏逻辑
        this.gameLogic.startGame();
        
        // 通知房间内所有玩家游戏开始
        this.broadcast({
            type: 'gameStarted',
            roomId: this.id,
            players: Array.from(this.players.values())
        });
    }
    
    // 广播消息给房间内所有玩家
    broadcast(message) {
        this.players.forEach(player => {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        });
    }
    
    // 获取房间信息
    getInfo() {
        return {
            id: this.id,
            playerCount: this.players.size,
            maxPlayers: this.maxPlayers,
            gameState: this.gameState,
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                x: p.x,
                y: p.y,
                health: p.health,
                score: p.score
            }))
        };
    }
}

// 玩家类
class Player {
    constructor(id, name, ws) {
        this.id = id;
        this.name = name;
        this.ws = ws;
        this.x = 400; // 初始X位置
        this.y = 300; // 初始Y位置
        this.health = 100; // 血量
        this.score = 0; // 分数
        this.connectedAt = Date.now();
    }
    
    // 更新玩家位置
    updatePosition(x, y) {
        this.x = Math.max(0, Math.min(800, x));
        this.y = Math.max(0, Math.min(600, y));
    }
    
    // 获取玩家信息
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            health: this.health,
            score: this.score
        };
    }
}

// ==========================================
// 4. 玩家连接管理
// ==========================================
let playerIdCounter = 0;

wss.on('connection', (ws) => {
    playerIdCounter++;
    const playerId = 'player_' + playerIdCounter;
    
    console.log(`🔌 新玩家连接: ${playerId}`);
    
    let currentPlayer = null;
    
    // 处理客户端消息
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(ws, playerId, message);
        } catch (error) {
            console.error('❌ 解析消息失败:', error);
        }
    });
    
    // 处理玩家断开连接
    ws.on('close', () => {
        console.log(`🔌 玩家断开连接: ${playerId}`);
        handleDisconnect(playerId);
    });
    
    // 处理错误
    ws.on('error', (error) => {
        console.error(`❌ 玩家 ${playerId} 连接错误:`, error);
    });
});

// 处理客户端消息
function handleMessage(ws, playerId, message) {
    switch (message.type) {
        // 玩家加入
        case 'join':
            handlePlayerJoin(ws, playerId, message);
            break;
            
        // 创建房间
        case 'createRoom':
            handleCreateRoom(ws, playerId, message);
            break;
            
        // 加入房间
        case 'joinRoom':
            handleJoinRoom(ws, playerId, message);
            break;
            
        // 离开房间
        case 'leaveRoom':
            handleLeaveRoom(ws, playerId, message);
            break;
            
        // 玩家移动
        case 'playerMove':
            handlePlayerMove(ws, playerId, message);
            break;
            
        // 玩家射击
        case 'playerShoot':
            handlePlayerShoot(ws, playerId, message);
            break;
            
        // 获取房间列表
        case 'getRooms':
            handleGetRooms(ws, playerId, message);
            break;
            
        default:
            console.log(`⚠️ 未知消息类型: ${message.type}`);
    }
}

// 处理玩家加入
function handlePlayerJoin(ws, playerId, message) {
    const playerName = message.name || '玩家' + playerId;
    const player = new Player(playerId, playerName, ws);
    
    // 保存玩家引用
    currentPlayer = player;
    
    console.log(`✅ 玩家 ${playerName} (${playerId}) 已登录`);
    
    // 发送欢迎消息
    sendMessage(ws, {
        type: 'welcome',
        playerId: playerId,
        playerName: playerName
    });
}

// 处理创建房间
function handleCreateRoom(ws, playerId, message) {
    if (!currentPlayer) return;
    
    // 生成房间ID
    const roomId = 'room_' + Date.now();
    
    // 创建房间
    const room = new Room(roomId);
    rooms.set(roomId, room);
    
    // 玩家加入房间
    if (room.addPlayer(currentPlayer)) {
        playerRooms.set(playerId, roomId);
        
        console.log(`🏠 玩家 ${currentPlayer.name} 创建房间 ${roomId}`);
        
        sendMessage(ws, {
            type: 'roomCreated',
            room: room.getInfo()
        });
    }
}

// 处理加入房间
function handleJoinRoom(ws, playerId, message) {
    if (!currentPlayer) return;
    
    const roomId = message.roomId;
    const room = rooms.get(roomId);
    
    if (!room) {
        sendMessage(ws, {
            type: 'error',
            message: '房间不存在'
        });
        return;
    }
    
    if (room.addPlayer(currentPlayer)) {
        playerRooms.set(playerId, roomId);
        
        console.log(`🏠 玩家 ${currentPlayer.name} 加入房间 ${roomId}`);
        
        sendMessage(ws, {
            type: 'roomJoined',
            room: room.getInfo()
        });
        
        // 通知房间内其他玩家有新玩家加入
        room.broadcast({
            type: 'playerJoined',
            player: currentPlayer.getInfo()
        });
    } else {
        sendMessage(ws, {
            type: 'error',
            message: '房间已满'
        });
    }
}

// 处理离开房间
function handleLeaveRoom(ws, playerId, message) {
    if (!currentPlayer) return;
    
    const roomId = playerRooms.get(playerId);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (room) {
        // 通知房间内其他玩家有玩家离开
        room.broadcast({
            type: 'playerLeft',
            playerId: playerId
        });
        
        room.removePlayer(playerId);
        playerRooms.delete(playerId);
    }
}

// 处理玩家移动
function handlePlayerMove(ws, playerId, message) {
    if (!currentPlayer) return;
    
    const roomId = playerRooms.get(playerId);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    // 更新玩家位置
    currentPlayer.updatePosition(message.x, message.y);
    
    // 广播给房间内其他玩家
    room.broadcast({
        type: 'playerMoved',
        player: currentPlayer.getInfo()
    });
}

// 处理玩家射击
function handlePlayerShoot(ws, playerId, message) {
    if (!currentPlayer) return;
    
    const roomId = playerRooms.get(playerId);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    // 服务器权威验证射击
    room.gameLogic.handlePlayerShoot(playerId, message);
}

// 处理获取房间列表
function handleGetRooms(ws, playerId, message) {
    const roomList = Array.from(rooms.values()).map(room => room.getInfo());
    
    sendMessage(ws, {
        type: 'roomList',
        rooms: roomList
    });
}

// 处理玩家断开连接
function handleDisconnect(playerId) {
    const roomId = playerRooms.get(playerId);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (room) {
        // 通知房间内其他玩家有玩家离开
        room.broadcast({
            type: 'playerLeft',
            playerId: playerId
        });
        
        room.removePlayer(playerId);
        playerRooms.delete(playerId);
    }
}

// 发送消息给客户端
function sendMessage(ws, message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// ==========================================
// 5. 启动服务器
// ==========================================
server.listen(PORT, () => {
    console.log('');
    console.log('=========================================');
    console.log('🎮 战场幸存者 - 服务器已启动！');
    console.log('=========================================');
    console.log('');
    console.log('📱 本地访问地址：');
    console.log(`   http://127.0.0.1:${PORT}`);
    console.log(`   http://localhost:${PORT}`);
    console.log('');
    console.log('👥 功能说明：');
    console.log('   - 支持创建和加入房间');
    console.log('   - 支持2-4人同时游戏');
    console.log('   - 实时同步玩家位置和状态');
    console.log('   - 自动处理玩家断开连接');
    console.log('');
    console.log('=========================================');
    console.log('');
});
