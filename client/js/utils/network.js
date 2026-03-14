// ==========================================
// 战场幸存者 - 前端网络通信
// 功能：WebSocket客户端、房间管理、玩家同步
// ==========================================

class NetworkManager {
    constructor(scene) {
        this.scene = scene;
        this.ws = null;
        this.connected = false;
        this.reconnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.playerId = null;
        this.roomId = null;
        this.players = new Map(); // 其他玩家 { playerId: playerData }
        this.messageQueue = []; // 消息队列（断线时缓存）
        this.lastServerTime = 0;
        this.ping = 0;
        this.lastPingTime = 0;
        
        console.log('🌐 网络管理器初始化');
    }
    
    // 连接到服务器
    connect(url = 'ws://localhost:2567') {
        console.log(`🌐 正在连接到服务器: ${url}`);
        
        try {
            this.ws = new WebSocket(url);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket连接已建立');
                this.connected = true;
                this.reconnecting = false;
                this.reconnectAttempts = 0;
                
                // 发送消息队列中的缓存消息
                this.flushMessageQueue();
                
                // 开始心跳
                this.startHeartbeat();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('❌ 解析消息失败:', error);
                }
            };
            
            this.ws.onclose = (event) => {
                console.log(`❌ WebSocket连接已关闭: ${event.code}`);
                this.connected = false;
                
                // 尝试重连
                if (!this.reconnecting) {
                    this.tryReconnect();
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket错误:', error);
            };
            
        } catch (error) {
            console.error('❌ 连接服务器失败:', error);
            this.tryReconnect();
        }
    }
    
    // 尝试重连
    tryReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ 重连失败，已达到最大尝试次数');
            this.reconnecting = false;
            
            // 通知游戏场景
            if (this.scene.onDisconnected) {
                this.scene.onDisconnected();
            }
            return;
        }
        
        this.reconnecting = true;
        this.reconnectAttempts++;
        
        console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
            this.connect(this.getServerUrl());
        }, this.reconnectDelay);
    }
    
    // 获取服务器URL
    getServerUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}`;
    }
    
    // 发送消息
    send(message) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('❌ 发送消息失败:', error);
                this.messageQueue.push(message);
            }
        } else {
            // 未连接时缓存消息
            this.messageQueue.push(message);
            console.log('📨 消息已缓存:', message);
        }
    }
    
    // 刷新消息队列
    flushMessageQueue() {
        if (this.messageQueue.length > 0) {
            console.log(`📨 发送 ${this.messageQueue.length} 条缓存消息`);
            
            const queue = [...this.messageQueue];
            this.messageQueue = [];
            
            queue.forEach((message) => {
                this.send(message);
            });
        }
    }
    
    // 处理服务器消息
    handleMessage(message) {
        // 更新服务器时间
        if (message.timestamp) {
            this.lastServerTime = message.timestamp;
        }
        
        // 处理ping
        if (message.type === 'pong') {
            this.ping = Date.now() - this.lastPingTime;
            console.log(`🏓 延迟: ${this.ping}ms`);
            return;
        }
        
        // 根据消息类型处理
        switch (message.type) {
            case 'welcome':
                this.handleWelcome(message);
                break;
                
            case 'roomCreated':
                this.handleRoomCreated(message);
                break;
                
            case 'roomJoined':
                this.handleRoomJoined(message);
                break;
                
            case 'playerJoined':
                this.handlePlayerJoined(message);
                break;
                
            case 'playerLeft':
                this.handlePlayerLeft(message);
                break;
                
            case 'playerMoved':
                this.handlePlayerMoved(message);
                break;
                
            case 'gameState':
                this.handleGameState(message);
                break;
                
            case 'error':
                this.handleError(message);
                break;
                
            default:
                console.log('📨 收到未知消息:', message);
        }
        
        // 调用场景的消息处理函数
        if (this.scene.onNetworkMessage) {
            this.scene.onNetworkMessage(message);
        }
    }
    
    // 处理欢迎消息
    handleWelcome(message) {
        console.log('👋 收到欢迎消息:', message);
        this.playerId = message.playerId;
        
        if (this.scene.onConnected) {
            this.scene.onConnected(message);
        }
    }
    
    // 处理房间创建
    handleRoomCreated(message) {
        console.log('🏠 房间已创建:', message);
        this.roomId = message.roomId;
        
        if (this.scene.onRoomCreated) {
            this.scene.onRoomCreated(message);
        }
    }
    
    // 处理加入房间
    handleRoomJoined(message) {
        console.log('🏠 已加入房间:', message);
        this.roomId = message.roomId;
        
        // 更新其他玩家列表
        this.players.clear();
        if (message.players) {
            message.players.forEach(player => {
                if (player.id !== this.playerId) {
                    this.players.set(player.id, player);
                }
            });
        }
        
        if (this.scene.onRoomJoined) {
            this.scene.onRoomJoined(message);
        }
    }
    
    // 处理新玩家加入
    handlePlayerJoined(message) {
        console.log('👤 新玩家加入:', message);
        if (message.player.id !== this.playerId) {
            this.players.set(message.player.id, message.player);
        }
        
        if (this.scene.onPlayerJoined) {
            this.scene.onPlayerJoined(message);
        }
    }
    
    // 处理玩家离开
    handlePlayerLeft(message) {
        console.log('👋 玩家离开:', message);
        this.players.delete(message.playerId);
        
        if (this.scene.onPlayerLeft) {
            this.scene.onPlayerLeft(message);
        }
    }
    
    // 处理玩家移动
    handlePlayerMoved(message) {
        if (message.playerId === this.playerId) return;
        
        const player = this.players.get(message.playerId);
        if (player) {
            // 平滑移动（插值）
            player.targetX = message.x;
            player.targetY = message.y;
            player.lastUpdate = Date.now();
        }
        
        if (this.scene.onPlayerMoved) {
            this.scene.onPlayerMoved(message);
        }
    }
    
    // 处理游戏状态同步
    handleGameState(message) {
        console.log('🎮 收到游戏状态:', message);
        
        // 更新其他玩家状态
        if (message.players) {
            message.players.forEach(player => {
                if (player.id !== this.playerId) {
                    this.players.set(player.id, player);
                }
            });
        }
        
        if (this.scene.onGameState) {
            this.scene.onGameState(message);
        }
    }
    
    // 处理错误
    handleError(message) {
        console.error('❌ 服务器错误:', message);
        
        if (this.scene.onNetworkError) {
            this.scene.onNetworkError(message);
        }
    }
    
    // 开始心跳
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.connected) {
                this.lastPingTime = Date.now();
                this.send({ type: 'ping' });
            }
        }, 3000);
    }
    
    // 停止心跳
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    // 创建房间
    createRoom() {
        console.log('🏠 正在创建房间...');
        this.send({ type: 'createRoom' });
    }
    
    // 加入房间
    joinRoom(roomId) {
        console.log(`🏠 正在加入房间: ${roomId}`);
        this.send({ type: 'joinRoom', roomId: roomId });
    }
    
    // 离开房间
    leaveRoom() {
        console.log('🏠 正在离开房间...');
        this.send({ type: 'leaveRoom' });
        this.roomId = null;
        this.players.clear();
    }
    
    // 获取房间列表
    getRooms() {
        console.log('📋 获取房间列表...');
        this.send({ type: 'getRooms' });
    }
    
    // 发送玩家位置
    sendPlayerPosition(x, y) {
        if (!this.connected) return;
        
        this.send({
            type: 'playerMove',
            x: x,
            y: y
        });
    }
    
    // 获取其他玩家
    getOtherPlayers() {
        return Array.from(this.players.values());
    }
    
    // 获取玩家
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    
    // 获取当前延迟
    getPing() {
        return this.ping;
    }
    
    // 检查是否已连接
    isConnected() {
        return this.connected;
    }
    
    // 获取玩家ID
    getPlayerId() {
        return this.playerId;
    }
    
    // 获取房间ID
    getRoomId() {
        return this.roomId;
    }
    
    // 销毁
    destroy() {
        this.stopHeartbeat();
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.connected = false;
        this.players.clear();
        this.messageQueue = [];
        
        console.log('🌐 网络管理器已销毁');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkManager;
}
