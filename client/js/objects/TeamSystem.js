// ==========================================
// 战场幸存者 - 协作系统
// 功能：玩家协作、道具共享、观战模式、游戏结束排名
// ==========================================

// 协作系统
class TeamSystem {
    constructor(scene) {
        this.scene = scene;
        this.teammates = new Map(); // 队友 { playerId: playerData }
        this.spectating = false; // 是否在观战
        this.spectatingPlayerId = null; // 观战的玩家ID
        this.gameEnded = false; // 游戏是否结束
        this.ranking = []; // 排名
        this.sharedItems = []; // 共享道具
        
        console.log('🤝 协作系统初始化');
    }
    
    // 添加队友
    addTeammate(playerId, playerData) {
        this.teammates.set(playerId, playerData);
        console.log('🤝 添加队友:', playerId);
        
        if (this.scene.onTeammateJoined) {
            this.scene.onTeammateJoined(playerId, playerData);
        }
    }
    
    // 移除队友
    removeTeammate(playerId) {
        this.teammates.delete(playerId);
        console.log('👋 移除队友:', playerId);
        
        if (this.scene.onTeammateLeft) {
            this.scene.onTeammateLeft(playerId);
        }
        
        // 如果在观战这个玩家，切换到其他玩家
        if (this.spectating && this.spectatingPlayerId === playerId) {
            this.switchSpectateTarget();
        }
    }
    
    // 获取队友列表
    getTeammates() {
        return Array.from(this.teammates.values());
    }
    
    // 获取队友
    getTeammate(playerId) {
        return this.teammates.get(playerId);
    }
    
    // 共享道具
    shareItem(item, targetPlayerId) {
        console.log('🎁 共享道具给:', targetPlayerId);
        
        const sharedItem = {
            item: item,
            fromPlayerId: this.scene.networkManager?.getPlayerId(),
            toPlayerId: targetPlayerId,
            timestamp: Date.now()
        };
        
        this.sharedItems.push(sharedItem);
        
        // 通知服务器
        if (this.scene.networkManager) {
            this.scene.networkManager.send({
                type: 'shareItem',
                item: item,
                targetPlayerId: targetPlayerId
            });
        }
        
        // 显示共享提示
        this.showShareNotification(item, targetPlayerId);
    }
    
    // 接收共享道具
    receiveSharedItem(sharedItem) {
        console.log('🎁 收到共享道具:', sharedItem);
        
        if (this.scene.onItemShared) {
            this.scene.onItemShared(sharedItem);
        }
        
        // 显示接收提示
        this.showReceiveNotification(sharedItem);
    }
    
    // 显示共享提示
    showShareNotification(item, targetPlayerId) {
        const targetPlayer = this.teammates.get(targetPlayerId);
        const text = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100,
            `已将道具共享给 ${targetPlayer?.name || '队友'}`,
            {
                fontSize: '20px',
                fill: '#4ECDC4',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        text.setOrigin(0.5);
        text.setShadow(2, 2, '#000000', 2);
        
        // 2秒后消失
        this.scene.tweens.add({
            targets: text,
            y: text.y - 50,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                text.destroy();
            }
        });
    }
    
    // 显示接收提示
    showReceiveNotification(sharedItem) {
        const fromPlayer = this.teammates.get(sharedItem.fromPlayerId);
        const text = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100,
            `${fromPlayer?.name || '队友'} 共享了道具给你！`,
            {
                fontSize: '20px',
                fill: '#FFE66D',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        text.setOrigin(0.5);
        text.setShadow(2, 2, '#000000', 2);
        
        // 2秒后消失
        this.scene.tweens.add({
            targets: text,
            y: text.y - 50,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                text.destroy();
            }
        });
    }
    
    // 玩家死亡，开始观战
    startSpectating() {
        if (this.spectating) return;
        
        this.spectating = true;
        console.log('👀 开始观战模式');
        
        // 找到还活着的玩家
        this.switchSpectateTarget();
        
        // 显示观战界面
        this.showSpectateUI();
        
        if (this.scene.onStartSpectating) {
            this.scene.onStartSpectating();
        }
    }
    
    // 切换观战目标
    switchSpectateTarget() {
        const alivePlayers = Array.from(this.teammates.values()).filter(p => p.health > 0);
        
        if (alivePlayers.length === 0) {
            // 没有活着的玩家了，结束游戏
            this.endGame();
            return;
        }
        
        // 选择第一个活着的玩家
        this.spectatingPlayerId = alivePlayers[0].id;
        
        console.log('👀 切换观战目标:', this.spectatingPlayerId);
        
        // 摄像机跟随观战目标
        if (this.scene.cameras && this.teammates.has(this.spectatingPlayerId)) {
            const target = this.teammates.get(this.spectatingPlayerId);
            if (target && target.sprite) {
                this.scene.cameras.main.startFollow(target.sprite);
            }
        }
    }
    
    // 显示观战界面
    showSpectateUI() {
        // 观战文字
        const spectateText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            60,
            '👀 观战模式',
            {
                fontSize: '28px',
                fill: '#FF6B6B',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        spectateText.setOrigin(0.5);
        spectateText.setShadow(2, 2, '#000000', 2);
        this.spectateText = spectateText;
        
        // 切换按钮提示
        const hintText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            100,
            '按 Tab 键切换观战目标',
            {
                fontSize: '16px',
                fill: '#aaaaaa',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        hintText.setOrigin(0.5);
        this.hintText = hintText;
        
        // 绑定Tab键切换观战目标
        this.scene.input.keyboard.on('keydown_TAB', () => {
            this.switchSpectateTarget();
        });
    }
    
    // 隐藏观战界面
    hideSpectateUI() {
        if (this.spectateText) {
            this.spectateText.destroy();
            this.spectateText = null;
        }
        if (this.hintText) {
            this.hintText.destroy();
            this.hintText = null;
        }
    }
    
    // 结束游戏，显示排名
    endGame() {
        if (this.gameEnded) return;
        
        this.gameEnded = true;
        console.log('🎮 游戏结束！');
        
        // 暂停游戏
        if (this.scene.physics) {
            this.scene.physics.pause();
        }
        
        // 计算排名
        this.calculateRanking();
        
        // 显示游戏结束界面
        this.showGameEndUI();
        
        if (this.scene.onGameEnded) {
            this.scene.onGameEnded(this.ranking);
        }
    }
    
    // 计算排名
    calculateRanking() {
        // 收集所有玩家的分数
        const allPlayers = [
            {
                id: this.scene.networkManager?.getPlayerId(),
                name: '你',
                score: this.scene.score || 0,
                health: this.scene.playerHealth || 0
            },
            ...Array.from(this.teammates.values()).map(p => ({
                id: p.id,
                name: p.name || '玩家',
                score: p.score || 0,
                health: p.health || 0
            }))
        ];
        
        // 按分数排序
        this.ranking = allPlayers.sort((a, b) => b.score - a.score);
        
        console.log('🏆 排名:', this.ranking);
    }
    
    // 显示游戏结束界面
    showGameEndUI() {
        // 半透明背景
        const background = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            1600,
            1216,
            0x000000,
            0.8
        );
        
        // 游戏结束标题
        const title = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 200,
            '🎮 游戏结束！',
            {
                fontSize: '56px',
                fill: '#FF6B6B',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        title.setOrigin(0.5);
        title.setShadow(3, 3, '#000000', 3);
        
        // 排名标题
        const rankingTitle = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100,
            '🏆 最终排名',
            {
                fontSize: '32px',
                fill: '#FFE66D',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        rankingTitle.setOrigin(0.5);
        rankingTitle.setShadow(2, 2, '#000000', 2);
        
        // 显示排名列表
        const startY = this.scene.cameras.main.centerY - 40;
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        
        this.ranking.forEach((player, index) => {
            const y = startY + index * 50;
            const medal = medals[index] || `${index + 1}.`;
            const color = index === 0 ? '#FFE66D' : (index < 3 ? '#ffffff' : '#aaaaaa');
            
            const rankText = this.scene.add.text(
                this.scene.cameras.main.centerX,
                y,
                `${medal} ${player.name} - ${player.score}分`,
                {
                    fontSize: '24px',
                    fill: color,
                    fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
                }
            );
            rankText.setOrigin(0.5);
            rankText.setShadow(2, 2, '#000000', 2);
        });
        
        // 重新开始提示
        const restartText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 200,
            '刷新页面重新开始',
            {
                fontSize: '20px',
                fill: '#4ECDC4',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        restartText.setOrigin(0.5);
    }
    
    // 检查是否在观战
    isSpectating() {
        return this.spectating;
    }
    
    // 检查游戏是否结束
    isGameEnded() {
        return this.gameEnded;
    }
    
    // 获取排名
    getRanking() {
        return this.ranking;
    }
    
    // 重置
    reset() {
        this.teammates.clear();
        this.spectating = false;
        this.spectatingPlayerId = null;
        this.gameEnded = false;
        this.ranking = [];
        this.sharedItems = [];
        
        this.hideSpectateUI();
        
        console.log('🤝 协作系统已重置');
    }
    
    // 销毁
    destroy() {
        this.reset();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamSystem;
}
