// ==========================================
// 战场幸存者 - 游戏逻辑
// 功能：房间状态管理、玩家同步、敌人生成、碰撞检测、游戏结束判定
// ==========================================

class GameLogic {
    constructor(room) {
        this.room = room;
        this.gameLoop = null;
        this.enemySpawnLoop = null;
        this.enemies = new Map(); // 敌人列表 { enemyId: Enemy }
        this.enemyIdCounter = 0;
        this.gameRunning = false;
        this.gameStartTime = 0;
    }
    
    // 开始游戏
    startGame() {
        if (this.gameRunning) return;
        
        console.log(`🎮 房间 ${this.room.id} 开始游戏逻辑`);
        
        this.gameRunning = true;
        this.gameStartTime = Date.now();
        
        // 启动游戏主循环（60fps）
        this.gameLoop = setInterval(() => {
            this.update();
        }, 1000 / 60);
        
        // 启动敌人生成循环（每2秒生成一个敌人）
        this.enemySpawnLoop = setInterval(() => {
            this.spawnEnemy();
        }, 2000);
        
        // 通知房间内所有玩家游戏开始
        this.room.broadcast({
            type: 'gameLogicStarted',
            timestamp: this.gameStartTime
        });
    }
    
    // 停止游戏
    stopGame() {
        if (!this.gameRunning) return;
        
        console.log(`⏹️ 房间 ${this.room.id} 停止游戏逻辑`);
        
        this.gameRunning = false;
        
        // 清除定时器
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.enemySpawnLoop) {
            clearInterval(this.enemySpawnLoop);
            this.enemySpawnLoop = null;
        }
        
        // 清除所有敌人
        this.enemies.clear();
    }
    
    // 游戏主循环（每帧更新）
    update() {
        if (!this.gameRunning) return;
        
        // 更新敌人位置（向玩家移动）
        this.updateEnemies();
        
        // 服务器权威验证碰撞检测
        this.checkCollisions();
        
        // 广播游戏状态
        this.broadcastGameState();
    }
    
    // 生成敌人
    spawnEnemy() {
        if (!this.gameRunning) return;
        
        this.enemyIdCounter++;
        const enemyId = 'enemy_' + this.enemyIdCounter;
        
        // 随机选择一个边缘位置生成敌人
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // 上边
                x = Math.random() * 800;
                y = -30;
                break;
            case 1: // 右边
                x = 830;
                y = Math.random() * 600;
                break;
            case 2: // 下边
                x = Math.random() * 800;
                y = 630;
                break;
            case 3: // 左边
                x = -30;
                y = Math.random() * 600;
                break;
        }
        
        // 创建敌人
        const enemy = {
            id: enemyId,
            x: x,
            y: y,
            speed: 100 + Math.random() * 50, // 随机速度
            size: 28,
            health: 1,
            createdAt: Date.now()
        };
        
        this.enemies.set(enemyId, enemy);
        
        console.log(`👾 房间 ${this.room.id} 生成敌人 ${enemyId} 位置 (${Math.round(x)}, ${Math.round(y)})`);
        
        // 通知房间内所有玩家有新敌人
        this.room.broadcast({
            type: 'enemySpawned',
            enemy: enemy
        });
    }
    
    // 更新敌人位置
    updateEnemies() {
        const players = Array.from(this.room.players.values());
        
        this.enemies.forEach((enemy, enemyId) => {
            // 找到最近的玩家
            let nearestPlayer = null;
            let nearestDistance = Infinity;
            
            players.forEach(player => {
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestPlayer = player;
                }
            });
            
            // 向最近的玩家移动
            if (nearestPlayer) {
                const dx = nearestPlayer.x - enemy.x;
                const dy = nearestPlayer.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const normalizedDx = dx / distance;
                    const normalizedDy = dy / distance;
                    
                    // 服务器权威计算敌人位置
                    enemy.x += normalizedDx * (enemy.speed / 60);
                    enemy.y += normalizedDy * (enemy.speed / 60);
                    
                    // 限制敌人在地图范围内
                    enemy.x = Math.max(-50, Math.min(850, enemy.x));
                    enemy.y = Math.max(-50, Math.min(650, enemy.y));
                }
            }
        });
    }
    
    // 服务器权威验证碰撞检测
    checkCollisions() {
        const players = Array.from(this.room.players.values());
        const enemiesToRemove = [];
        const playersToDamage = [];
        
        // 检查敌人与玩家的碰撞
        players.forEach(player => {
            this.enemies.forEach((enemy, enemyId) => {
                if (this.checkCircleCollision(player, enemy, 30)) {
                    console.log(`💥 敌人 ${enemyId} 与玩家 ${player.name} 碰撞`);
                    
                    // 服务器权威：敌人消失
                    enemiesToRemove.push(enemyId);
                    
                    // 服务器权威：玩家受伤
                    if (!playersToDamage.includes(player.id)) {
                        playersToDamage.push(player.id);
                    }
                }
            });
        });
        
        // 移除被碰撞的敌人
        enemiesToRemove.forEach(enemyId => {
            this.enemies.delete(enemyId);
            this.room.broadcast({
                type: 'enemyDestroyed',
                enemyId: enemyId,
                reason: 'collision'
            });
        });
        
        // 处理玩家受伤（服务器权威）
        playersToDamage.forEach(playerId => {
            const player = this.room.players.get(playerId);
            if (player) {
                player.health = Math.max(0, player.health - 20);
                
                console.log(`💔 玩家 ${player.name} 受伤！血量: ${player.health}`);
                
                this.room.broadcast({
                    type: 'playerDamaged',
                    playerId: playerId,
                    health: player.health,
                    damage: 20
                });
                
                // 检查玩家是否死亡
                if (player.health <= 0) {
                    this.handlePlayerDeath(playerId);
                }
            }
        });
    }
    
    // 检查圆形碰撞（服务器权威）
    checkCircleCollision(obj1, obj2, radius) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < radius;
    }
    
    // 处理玩家死亡
    handlePlayerDeath(playerId) {
        const player = this.room.players.get(playerId);
        if (!player) return;
        
        console.log(`💀 玩家 ${player.name} 死亡！最终分数: ${player.score}`);
        
        // 服务器权威：记录玩家分数
        const finalScore = player.score;
        const survivalTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        
        // 通知房间内所有玩家
        this.room.broadcast({
            type: 'playerDied',
            playerId: playerId,
            playerName: player.name,
            finalScore: finalScore,
            survivalTime: survivalTime
        });
        
        // 3秒后复活玩家
        setTimeout(() => {
            this.respawnPlayer(playerId);
        }, 3000);
    }
    
    // 处理玩家复活
    respawnPlayer(playerId) {
        const player = this.room.players.get(playerId);
        if (!player) return;
        
        // 服务器权威：重置玩家状态
        player.x = 400;
        player.y = 300;
        player.health = 100;
        
        console.log(`🔄 玩家 ${player.name} 复活`);
        
        // 通知房间内所有玩家
        this.room.broadcast({
            type: 'playerRespawned',
            playerId: playerId,
            player: player.getInfo()
        });
    }
    
    // 处理玩家射击（服务器权威验证）
    handlePlayerShoot(playerId, bulletData) {
        const player = this.room.players.get(playerId);
        if (!player) return;
        
        // 服务器权威验证：简单的距离检查
        const enemiesToRemove = [];
        
        this.enemies.forEach((enemy, enemyId) => {
            // 简化的碰撞检测（服务器权威）
            const dx = bulletData.x - enemy.x;
            const dy = bulletData.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50) {
                console.log(`🎯 玩家 ${player.name} 击中敌人 ${enemyId}`);
                
                enemiesToRemove.push(enemyId);
                
                // 服务器权威：玩家加分
                player.score += 10;
            }
        });
        
        // 移除被击中的敌人
        enemiesToRemove.forEach(enemyId => {
            this.enemies.delete(enemyId);
            this.room.broadcast({
                type: 'enemyDestroyed',
                enemyId: enemyId,
                reason: 'shot',
                shotBy: playerId,
                score: player.score
            });
        });
    }
    
    // 广播游戏状态
    broadcastGameState() {
        // 只广播变化的部分，减少网络带宽
        const gameState = {
            type: 'gameState',
            timestamp: Date.now(),
            players: Array.from(this.room.players.values()).map(p => p.getInfo()),
            enemies: Array.from(this.enemies.values())
        };
        
        this.room.broadcast(gameState);
    }
    
    // 获取游戏状态
    getGameState() {
        return {
            gameRunning: this.gameRunning,
            gameStartTime: this.gameStartTime,
            enemyCount: this.enemies.size,
            players: Array.from(this.room.players.values()).map(p => p.getInfo()),
            enemies: Array.from(this.enemies.values())
        };
    }
}

module.exports = GameLogic;
