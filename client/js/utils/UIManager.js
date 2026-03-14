// ==========================================
// 战场幸存者 - UI管理器
// 功能：游戏大厅、游戏内UI、游戏结束、设置界面
// ==========================================

class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.currentUI = null;
        this.uiElements = new Map();
        this.isVisible = true;
        
        console.log('🎨 UI管理器初始化');
        
        // 初始化所有UI
        this.createAllUIs();
    }
    
    // 创建所有UI
    createAllUIs() {
        this.createLobbyUI();
        this.createInGameUI();
        this.createGameEndUI();
        this.createSettingsUI();
        
        // 默认显示大厅UI
        this.showUI('lobby');
    }
    
    // 创建按钮辅助函数
    createButton(x, y, text, color, callback, width = 200, height = 60) {
        const container = this.scene.add.container(0, 0);
        
        // 按钮背景
        const bg = this.scene.add.rectangle(x, y, width, height, color, 0.9);
        bg.setStrokeStyle(3, 0xffffff);
        bg.setInteractive({ useHandCursor: true });
        container.add(bg);
        
        // 按钮文字
        const textObj = this.scene.add.text(x, y, text, {
            fontSize: '20px',
            fill: '#1a1a2e',
            fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
            fontStyle: 'bold'
        });
        textObj.setOrigin(0.5);
        container.add(textObj);
        
        // 按钮效果
        bg.on('pointerover', () => {
            this.scene.tweens.add({
                targets: bg,
                scale: 1.05,
                duration: 100
            });
        });
        
        bg.on('pointerout', () => {
            this.scene.tweens.add({
                targets: bg,
                scale: 1,
                duration: 100
            });
        });
        
        bg.on('pointerdown', callback);
        
        return container;
    }
    
    // ==========================================
    // 1. 游戏大厅界面
    // ==========================================
    createLobbyUI() {
        const container = this.scene.add.container(0, 0);
        container.setScrollFactor(0);
        
        // 半透明背景
        const background = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            1600,
            1216,
            0x1a1a2e,
            0.95
        );
        container.add(background);
        
        // 游戏标题
        const title = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 250,
            '🎮 战场幸存者',
            {
                fontSize: '64px',
                fill: '#4ECDC4',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5);
        title.setShadow(4, 4, '#000000', 4);
        container.add(title);
        
        // 副标题
        const subtitle = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 180,
            '2D多人联机生存游戏',
            {
                fontSize: '24px',
                fill: '#aaaaaa',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        subtitle.setOrigin(0.5);
        container.add(subtitle);
        
        // 房间创建按钮
        const createRoomBtn = this.createButton(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 50,
            '🏠 创建房间',
            0x4ECDC4,
            () => this.onCreateRoomClick()
        );
        container.add(createRoomBtn);
        
        // 房间列表
        this.createRoomList(container);
        
        // 设置按钮
        const settingsBtn = this.createButton(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 200,
            '⚙️ 设置',
            0xFFE66D,
            () => this.showUI('settings')
        );
        container.add(settingsBtn);
        
        container.visible = false;
        this.uiElements.set('lobby', container);
    }
    
    // 创建房间列表
    createRoomList(container) {
        const listY = this.scene.cameras.main.centerY + 50;
        
        // 列表标题
        const listTitle = this.scene.add.text(
            this.scene.cameras.main.centerX,
            listY,
            '📋 房间列表',
            {
                fontSize: '20px',
                fill: '#ffffff',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        listTitle.setOrigin(0.5);
        container.add(listTitle);
        
        // 刷新按钮
        const refreshBtn = this.createButton(
            this.scene.cameras.main.centerX + 150,
            listY,
            '🔄 刷新',
            0x96CEB4,
            () => this.refreshRoomList(),
            100,
            40
        );
        container.add(refreshBtn);
        
        // 房间列表容器
        this.roomListContainer = this.scene.add.container(
            this.scene.cameras.main.centerX,
            listY + 50
        );
        container.add(this.roomListContainer);
        
        // 初始化示例房间
        this.refreshRoomList();
    }
    
    // 刷新房间列表
    refreshRoomList() {
        // 清空列表
        this.roomListContainer.removeAll(true);
        
        // 示例房间数据
        const rooms = [
            { id: 'room1', name: '新手房间', players: 2, maxPlayers: 4 },
            { id: 'room2', name: '高手房间', players: 1, maxPlayers: 4 },
            { id: 'room3', name: '练习房间', players: 3, maxPlayers: 4 }
        ];
        
        rooms.forEach((room, index) => {
            const y = index * 60;
            const roomItem = this.createRoomItem(room, y);
            this.roomListContainer.add(roomItem);
        });
    }
    
    // 创建房间项
    createRoomItem(room, y) {
        const container = this.scene.add.container(0, y);
        
        // 房间背景
        const bg = this.scene.add.rectangle(
            0, 0,
            400,
            50,
            0x16213e,
            0.8
        );
        bg.setStrokeStyle(2, 0x4ECDC4);
        bg.setInteractive();
        bg.on('pointerdown', () => {
            this.onJoinRoomClick(room.id);
        });
        container.add(bg);
        
        // 房间名称
        const nameText = this.scene.add.text(
            -150,
            0,
            room.name,
            {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        nameText.setOrigin(0, 0.5);
        container.add(nameText);
        
        // 玩家数
        const playersText = this.scene.add.text(
            150,
            0,
            `${room.players}/${room.maxPlayers}`,
            {
                fontSize: '16px',
                fill: '#4ECDC4',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        playersText.setOrigin(1, 0.5);
        container.add(playersText);
        
        return container;
    }
    
    // 创建房间点击
    onCreateRoomClick() {
        console.log('🏠 创建房间');
        this.showUI('game');
    }
    
    // 加入房间点击
    onJoinRoomClick(roomId) {
        console.log('🏠 加入房间:', roomId);
        this.showUI('game');
    }
    
    // ==========================================
    // 2. 游戏内UI
    // ==========================================
    createInGameUI() {
        const container = this.scene.add.container(0, 0);
        container.setScrollFactor(0);
        
        // 血量条
        this.createHealthBar(container);
        
        // 能量条
        this.createEnergyBar(container);
        
        // 分数显示
        this.createScoreDisplay(container);
        
        // 倒计时显示
        this.createTimerDisplay(container);
        
        // 小地图
        this.createMinimap(container);
        
        // 雷达
        this.createRadar(container);
        
        // 返回大厅按钮
        const backBtn = this.createButton(
            this.scene.cameras.main.width - 100,
            50,
            '🏠 返回',
            0xFF6B6B,
            () => this.showUI('lobby'),
            120,
            50
        );
        container.add(backBtn);
        
        // 设置按钮
        const settingsBtn = this.createButton(
            this.scene.cameras.main.width - 240,
            50,
            '⚙️',
            0xFFE66D,
            () => this.showUI('settings'),
            50,
            50
        );
        container.add(settingsBtn);
        
        container.visible = false;
        this.uiElements.set('game', container);
    }
    
    // 创建血量条
    createHealthBar(container) {
        const x = 30;
        const y = 30;
        const width = 200;
        const height = 25;
        
        // 背景
        const bg = this.scene.add.rectangle(x, y, width, height, 0x000000, 0.5);
        bg.setOrigin(0, 0.5);
        container.add(bg);
        
        // 边框
        const border = this.scene.add.rectangle(x, y, width, height, 0xFF6B6B, 0);
        border.setOrigin(0, 0.5);
        border.setStrokeStyle(2, 0xFF6B6B);
        container.add(border);
        
        // 血量条
        this.healthBar = this.scene.add.rectangle(x, y, width, height, 0xFF6B6B);
        this.healthBar.setOrigin(0, 0.5);
        container.add(this.healthBar);
        
        // 血量文字
        this.healthText = this.scene.add.text(
            x + width / 2,
            y,
            '❤️ 100/100',
            {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        this.healthText.setOrigin(0.5, 0.5);
        container.add(this.healthText);
    }
    
    // 创建能量条
    createEnergyBar(container) {
        const x = 30;
        const y = 65;
        const width = 200;
        const height = 20;
        
        // 背景
        const bg = this.scene.add.rectangle(x, y, width, height, 0x000000, 0.5);
        bg.setOrigin(0, 0.5);
        container.add(bg);
        
        // 边框
        const border = this.scene.add.rectangle(x, y, width, height, 0x4ECDC4, 0);
        border.setOrigin(0, 0.5);
        border.setStrokeStyle(2, 0x4ECDC4);
        container.add(border);
        
        // 能量条
        this.energyBar = this.scene.add.rectangle(x, y, width, height, 0x4ECDC4);
        this.energyBar.setOrigin(0, 0.5);
        container.add(this.energyBar);
        
        // 能量文字
        this.energyText = this.scene.add.text(
            x + width / 2,
            y,
            '⚡ 100/100',
            {
                fontSize: '12px',
                fill: '#ffffff',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        this.energyText.setOrigin(0.5, 0.5);
        container.add(this.energyText);
    }
    
    // 创建分数显示
    createScoreDisplay(container) {
        this.scoreText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            30,
            '🏆 分数: 0',
            {
                fontSize: '28px',
                fill: '#FFE66D',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
                fontStyle: 'bold'
            }
        );
        this.scoreText.setOrigin(0.5, 0);
        this.scoreText.setShadow(2, 2, '#000000', 2);
        container.add(this.scoreText);
    }
    
    // 创建倒计时显示
    createTimerDisplay(container) {
        this.timerText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            70,
            '⏱️ 00:00',
            {
                fontSize: '24px',
                fill: '#ffffff',
                fontFamily: 'Consolas, monospace'
            }
        );
        this.timerText.setOrigin(0.5, 0);
        container.add(this.timerText);
    }
    
    // 创建小地图
    createMinimap(container) {
        const size = 150;
        const x = this.scene.cameras.main.width - size - 30;
        const y = this.scene.cameras.main.height - size - 30;
        
        // 背景
        const bg = this.scene.add.rectangle(x, y, size, size, 0x000000, 0.6);
        bg.setOrigin(1, 1);
        bg.setStrokeStyle(2, 0x4ECDC4);
        container.add(bg);
        
        // 小地图文字
        const label = this.scene.add.text(
            x - size / 2,
            y - size - 10,
            '📍 小地图',
            {
                fontSize: '14px',
                fill: '#4ECDC4',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        label.setOrigin(0.5, 0);
        container.add(label);
        
        this.minimapContainer = this.scene.add.container(x - size / 2, y - size / 2);
        container.add(this.minimapContainer);
    }
    
    // 创建雷达
    createRadar(container) {
        const size = 100;
        const x = this.scene.cameras.main.width - 200;
        const y = this.scene.cameras.main.height - 30;
        
        // 雷达背景
        const bg = this.scene.add.circle(x, y, size / 2, 0x000000, 0.4);
        bg.setStrokeStyle(2, 0x96CEB4);
        container.add(bg);
        
        // 雷达文字
        const label = this.scene.add.text(
            x,
            y - size / 2 - 15,
            '📡 雷达',
            {
                fontSize: '12px',
                fill: '#96CEB4',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        label.setOrigin(0.5, 0);
        container.add(label);
        
        this.radarContainer = this.scene.add.container(x, y);
        container.add(this.radarContainer);
    }
    
    // 更新血量
    updateHealth(current, max) {
        if (!this.healthBar || !this.healthText) return;
        
        const percentage = current / max;
        this.healthBar.scaleX = percentage;
        this.healthText.setText(`❤️ ${current}/${max}`);
    }
    
    // 更新能量
    updateEnergy(current, max) {
        if (!this.energyBar || !this.energyText) return;
        
        const percentage = current / max;
        this.energyBar.scaleX = percentage;
        this.energyText.setText(`⚡ ${current}/${max}`);
    }
    
    // 更新分数
    updateScore(score) {
        if (!this.scoreText) return;
        this.scoreText.setText(`🏆 分数: ${score}`);
    }
    
    // ==========================================
    // 3. 游戏结束界面
    // ==========================================
    createGameEndUI() {
        const container = this.scene.add.container(0, 0);
        container.setScrollFactor(0);
        container.visible = false;
        
        // 半透明背景
        const background = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            1600,
            1216,
            0x000000,
            0.85
        );
        container.add(background);
        
        // 游戏结束标题
        this.gameEndTitle = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 150,
            '🎮 游戏结束',
            {
                fontSize: '64px',
                fill: '#FF6B6B',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
                fontStyle: 'bold'
            }
        );
        this.gameEndTitle.setOrigin(0.5);
        this.gameEndTitle.setShadow(4, 4, '#000000', 4);
        container.add(this.gameEndTitle);
        
        // 最终分数
        this.finalScoreText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 50,
            '🏆 最终分数: 0',
            {
                fontSize: '36px',
                fill: '#FFE66D',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        this.finalScoreText.setOrigin(0.5);
        this.finalScoreText.setShadow(3, 3, '#000000', 3);
        container.add(this.finalScoreText);
        
        // 排名容器
        this.rankingContainer = this.scene.add.container(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 50
        );
        container.add(this.rankingContainer);
        
        // 返回大厅按钮
        const backBtn = this.createButton(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 200,
            '🏠 返回大厅',
            0x4ECDC4,
            () => this.showUI('lobby')
        );
        container.add(backBtn);
        
        // 重新开始按钮
        const restartBtn = this.createButton(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 280,
            '🔄 重新开始',
            0x96CEB4,
            () => this.restartGame()
        );
        container.add(restartBtn);
        
        this.uiElements.set('gameEnd', container);
    }
    
    // 显示游戏结束
    showGameEnd(score, ranking = []) {
        if (this.finalScoreText) {
            this.finalScoreText.setText(`🏆 最终分数: ${score}`);
        }
        
        // 显示排名
        this.rankingContainer.removeAll(true);
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        
        ranking.forEach((player, index) => {
            const y = index * 45;
            const medal = medals[index] || `${index + 1}.`;
            const color = index === 0 ? '#FFE66D' : (index < 3 ? '#ffffff' : '#aaaaaa');
            
            const rankText = this.scene.add.text(
                0,
                y,
                `${medal} ${player.name} - ${player.score}分`,
                {
                    fontSize: '22px',
                    fill: color,
                    fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
                }
            );
            rankText.setOrigin(0.5, 0);
            this.rankingContainer.add(rankText);
        });
        
        this.showUI('gameEnd');
    }
    
    // 重新开始游戏
    restartGame() {
        console.log('🔄 重新开始游戏');
        this.showUI('game');
    }
    
    // ==========================================
    // 4. 设置界面
    // ==========================================
    createSettingsUI() {
        const container = this.scene.add.container(0, 0);
        container.setScrollFactor(0);
        container.visible = false;
        
        // 半透明背景
        const background = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            1600,
            1216,
            0x000000,
            0.9
        );
        container.add(background);
        
        // 设置标题
        const title = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 200,
            '⚙️ 设置',
            {
                fontSize: '48px',
                fill: '#FFE66D',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5);
        title.setShadow(3, 3, '#000000', 3);
        container.add(title);
        
        // 音量设置
        this.createVolumeSetting(container);
        
        // 画质设置
        this.createQualitySetting(container);
        
        // 返回按钮
        const backBtn = this.createButton(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 200,
            '返回',
            0x4ECDC4,
            () => this.hideSettings(),
            150,
            50
        );
        container.add(backBtn);
        
        this.uiElements.set('settings', container);
    }
    
    // 音量设置
    createVolumeSetting(container) {
        const y = this.scene.cameras.main.centerY - 80;
        
        // 标签
        const label = this.scene.add.text(
            this.scene.cameras.main.centerX - 100,
            y,
            '🔊 音量',
            {
                fontSize: '20px',
                fill: '#ffffff',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        label.setOrigin(1, 0.5);
        container.add(label);
        
        // 音量条背景
        const bg = this.scene.add.rectangle(
            this.scene.cameras.main.centerX + 50,
            y,
            200,
            20,
            0x333333,
            0.8
        );
        bg.setOrigin(0, 0.5);
        container.add(bg);
        
        // 音量条
        this.volumeBar = this.scene.add.rectangle(
            this.scene.cameras.main.centerX + 50,
            y,
            150,
            20,
            0x4ECDC4
        );
        this.volumeBar.setOrigin(0, 0.5);
        container.add(this.volumeBar);
        
        // 音量百分比
        this.volumeText = this.scene.add.text(
            this.scene.cameras.main.centerX + 270,
            y,
            '75%',
            {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Consolas, monospace'
            }
        );
        this.volumeText.setOrigin(0, 0.5);
        container.add(this.volumeText);
        
        // 音量条交互
        bg.setInteractive();
        bg.on('pointerdown', (pointer) => {
            const width = Math.max(0, Math.min(200, pointer.x - (this.scene.cameras.main.centerX + 50)));
            this.volumeBar.width = width;
            const percentage = Math.round((width / 200) * 100);
            this.volumeText.setText(`${percentage}%`);
        });
    }
    
    // 画质设置
    createQualitySetting(container) {
        const y = this.scene.cameras.main.centerY;
        
        // 标签
        const label = this.scene.add.text(
            this.scene.cameras.main.centerX - 100,
            y,
            '🎨 画质',
            {
                fontSize: '20px',
                fill: '#ffffff',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        label.setOrigin(1, 0.5);
        container.add(label);
        
        // 画质选项
        const qualities = [
            { name: '低', color: 0xFF6B6B },
            { name: '中', color: 0xFFE66D },
            { name: '高', color: 0x4ECDC4 }
        ];
        
        this.qualityIndex = 1; // 默认中等
        
        qualities.forEach((quality, index) => {
            const x = this.scene.cameras.main.centerX + (index - 1) * 100;
            const bg = this.scene.add.rectangle(x, y, 80, 40, quality.color, 0.9);
            bg.setStrokeStyle(2, 0xffffff);
            bg.setInteractive({ useHandCursor: true });
            container.add(bg);
            
            const text = this.scene.add.text(x, y, quality.name, {
                fontSize: '18px',
                fill: '#1a1a2e',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
                fontStyle: 'bold'
            });
            text.setOrigin(0.5);
            container.add(text);
            
            bg.on('pointerdown', () => {
                this.qualityIndex = index;
                console.log('🎨 画质设置为:', quality.name);
            });
        });
    }
    
    // 隐藏设置界面
    hideSettings() {
        if (this.currentUI === 'settings') {
            this.showUI('lobby');
        }
    }
    
    // ==========================================
    // UI显示控制
    // ==========================================
    
    // 显示指定UI
    showUI(uiName) {
        // 隐藏所有UI
        this.uiElements.forEach((ui, name) => {
            if (ui) ui.visible = false;
        });
        
        // 显示指定UI
        const ui = this.uiElements.get(uiName);
        if (ui) {
            ui.visible = true;
            this.currentUI = uiName;
        }
        
        console.log('🎨 显示UI:', uiName);
    }
    
    // 获取当前UI
    getCurrentUI() {
        return this.currentUI;
    }
    
    // 销毁
    destroy() {
        this.uiElements.forEach((ui, name) => {
            if (ui) ui.destroy();
        });
        this.uiElements.clear();
        console.log('🎨 UI管理器已销毁');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}