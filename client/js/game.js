// ==========================================
// 战场幸存者 - 前端游戏主逻辑
// ==========================================

// 游戏配置
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

// 全局变量（用var声明，文件末尾挂载到window）
var game;
var scene;
var player;
var enemies;
var bullets;
var playerHealth = 100;
var maxHealth = 100; // 血量上限
var score = 0;
var healthText;
var scoreText;
var levelText; // 等级显示
var cursors;
var keyA, keyD, keyW, keyS;
var lastShootTime = 0;
var shootCooldown = 200; // 射击冷却（可升级）
var enemySpawnTimer = null;
var isInLobby = true; // 是否在大厅界面
var lobbyElements = []; // 大厅界面元素

// 升级相关
var upgradeManager;
var attackMultiplier = 1; // 攻击力倍数
var moveSpeedMultiplier = 1; // 移动速度倍数
var critChance = 0; // 暴击率
var areaDamageMultiplier = 1; // 范围伤害倍数

// 道具相关
var itemManager;

// 地图相关
var mapGenerator;

// 小地图相关
var minimap;
var minimapPlayer;
var minimapEnemies = [];
var minimapItems = [];

// 网络相关
var networkManager;
var otherPlayers = []; // 其他玩家的游戏对象

// ==========================================
// 1. 预加载资源
// ==========================================
function preload() {
    console.log('📦 资源预加载完成');
}

// ==========================================
// 2. 创建游戏场景
// ==========================================
function create() {
    console.log('🎮 游戏场景已创建');
    scene = this;
    
    // 显示大厅界面
    if (isInLobby) {
        createLobbyUI();
    } else {
        startGame();
    }
}

// ==========================================
// 3. 创建玩家角色
// ==========================================
function createPlayer() {
    // 重置所有变量
    playerHealth = 100;
    maxHealth = 100;
    score = 0;
    lastShootTime = 0;
    shootCooldown = 200;
    attackMultiplier = 1;
    moveSpeedMultiplier = 1;
    critChance = 0;
    areaDamageMultiplier = 1;
    
    // 停止并重新初始化道具系统
    if (itemManager) {
        itemManager.stop();
        itemManager.init();
    }
    
    // 在地图中心创建玩家
    const playerX = mapGenerator.getPixelWidth() / 2;
    const playerY = mapGenerator.getPixelHeight() / 2;
    
    player = scene.add.rectangle(playerX, playerY, 32, 32, '#4ECDC4');
    player.setStrokeStyle(2, 0xffffff);
    scene.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);
    
    // 设置摄像机跟随玩家
    scene.cameras.main.startFollow(player);
    scene.cameras.main.setBounds(0, 0, mapGenerator.getPixelWidth(), mapGenerator.getPixelHeight());
    
    // 更新血量显示
    if (healthText) {
        healthText.setText('血量: ' + playerHealth);
    }
    
    console.log('🎮 玩家角色已创建');
}

// ==========================================
// 4. 生成敌人
// ==========================================
function spawnEnemy() {
    // 如果在大厅界面或mapGenerator未初始化，不生成敌人
    if (isInLobby || !mapGenerator) {
        return;
    }
    
    const mapWidth = mapGenerator.getPixelWidth();
    const mapHeight = mapGenerator.getPixelHeight();
    
    const side = Phaser.Math.Between(0, 3);
    let x, y;
    
    switch(side) {
        case 0: x = Phaser.Math.Between(0, mapWidth); y = -32; break;
        case 1: x = mapWidth + 32; y = Phaser.Math.Between(0, mapHeight); break;
        case 2: x = Phaser.Math.Between(0, mapWidth); y = mapHeight + 32; break;
        case 3: x = -32; y = Phaser.Math.Between(0, mapHeight); break;
    }
    
    const enemy = scene.add.rectangle(x, y, 28, 28, '#FF6B6B');
    enemy.setStrokeStyle(2, 0xffffff);
    scene.physics.add.existing(enemy);
    enemy.body.setCollideWorldBounds(false);
    enemies.add(enemy);
    
    console.log('👾 敌人已生成');
}

// ==========================================
// 5. 创建UI界面
// ==========================================
function createUI() {
    healthText = scene.add.text(16, 16, '血量: 100', {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    healthText.setShadow(2, 2, '#000000', 2);
    healthText.setScrollFactor(0); // 固定在屏幕上
    
    scoreText = scene.add.text(16, 48, '分数: 0', {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    scoreText.setShadow(2, 2, '#000000', 2);
    scoreText.setScrollFactor(0); // 固定在屏幕上
    
    // 等级显示
    levelText = scene.add.text(16, 80, '等级: 1', {
        fontSize: '18px',
        fill: '#FFD700',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    levelText.setShadow(2, 2, '#000000', 2);
    levelText.setScrollFactor(0); // 固定在屏幕上
    
    const helpText = scene.add.text(16, 550, 'WASD/方向键移动 | 鼠标左键射击', {
        fontSize: '14px',
        fill: '#aaaaaa',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    helpText.setScrollFactor(0); // 固定在屏幕上
    
    createMinimap();
    
    console.log('📊 UI界面已创建');
}

// ==========================================
// 5.1 创建小地图
// ==========================================
function createMinimap() {
    const minimapX = 620;
    const minimapY = 30;
    const minimapWidth = 160;
    const minimapHeight = 160;
    
    const minimapTitle = scene.add.text(minimapX + 10, minimapY + 5, '小地图', {
        fontSize: '14px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    minimapTitle.setScrollFactor(0); // 固定在屏幕上
    
    minimap = scene.add.rectangle(
        minimapX + minimapWidth/2,
        minimapY + minimapHeight/2,
        minimapWidth,
        minimapHeight,
        0x0a0a1a
    );
    minimap.setStrokeStyle(2, 0x333355);
    minimap.setScrollFactor(0); // 固定在屏幕上
    
    minimapPlayer = scene.add.circle(0, 0, 5, 0x4ECDC4);
    minimapPlayer.setStrokeStyle(1, 0xffffff);
    minimapPlayer.setScrollFactor(0); // 固定在屏幕上
}

// ==========================================
// 6. 游戏主循环
// ==========================================
function update() {
    // 如果在大厅界面，不更新游戏逻辑
    if (isInLobby) {
        return;
    }
    
    if (!player) return;
    
    // 如果正在显示升级界面，不更新游戏
    if (upgradeManager && upgradeManager.isShowingUpgrade) {
        return;
    }
    
    // 检查道具拾取
    if (itemManager) {
        itemManager.checkPickup();
    }
    
    const mapWidth = mapGenerator.getPixelWidth();
    const mapHeight = mapGenerator.getPixelHeight();
    
    const baseSpeed = 200;
    const speed = baseSpeed * moveSpeedMultiplier;
    
    player.body.setVelocity(0);
    
    if (cursors.left.isDown || keyA.isDown) {
        player.body.setVelocityX(-speed);
    } else if (cursors.right.isDown || keyD.isDown) {
        player.body.setVelocityX(speed);
    }
    
    if (cursors.up.isDown || keyW.isDown) {
        player.body.setVelocityY(-speed);
    } else if (cursors.down.isDown || keyS.isDown) {
        player.body.setVelocityY(speed);
    }
    
    enemies.children.each(function(enemy) {
        scene.physics.moveToObject(enemy, player, 80);
    }, this);
    
    // 清理超出地图范围太远的敌人
    enemies.children.each(function(enemy) {
        if (enemy.x < -100 || enemy.x > mapWidth + 100 || 
            enemy.y < -100 || enemy.y > mapHeight + 100) {
            enemy.destroy();
        }
    }, this);
    
    updateMinimap();
    
    // 发送玩家位置到服务器（多人联机）
    if (networkManager && networkManager.isConnected() && player) {
        networkManager.sendPlayerPosition(player.x, player.y);
    }
}

// ==========================================
// 6.1 更新小地图
// ==========================================
function updateMinimap() {
    if (!minimap || !minimapPlayer || !mapGenerator) return;
    
    const minimapX = 620;
    const minimapY = 30;
    const minimapWidth = 160;
    const minimapHeight = 160;
    const mapWidth = mapGenerator.getPixelWidth();
    const mapHeight = mapGenerator.getPixelHeight();
    
    const playerMinimapX = minimapX + (player.x / mapWidth) * minimapWidth;
    const playerMinimapY = minimapY + 25 + (player.y / mapHeight) * (minimapHeight - 30);
    
    minimapPlayer.setPosition(playerMinimapX, playerMinimapY);
    
    // 清除旧的敌人标记
    minimapEnemies.forEach(marker => {
        if (marker && marker.active) {
            marker.destroy();
        }
    });
    minimapEnemies = [];
    
    // 绘制敌人（红色）
    enemies.children.each(function(enemy) {
        const enemyMinimapX = minimapX + (enemy.x / mapWidth) * minimapWidth;
        const enemyMinimapY = minimapY + 25 + (enemy.y / mapHeight) * (minimapHeight - 30);
        
        const enemyMarker = scene.add.circle(enemyMinimapX, enemyMinimapY, 3, 0xFF6B6B);
        enemyMarker.setScrollFactor(0); // 固定在屏幕上
        minimapEnemies.push(enemyMarker);
    }, this);
    
    // 清除旧的道具标记
    minimapItems.forEach(marker => {
        if (marker && marker.active) {
            marker.destroy();
        }
    });
    minimapItems = [];
    
    // 绘制道具（黄色）- 新增！
    if (itemManager && itemManager.items) {
        itemManager.items.forEach(item => {
            if (item && item.active) {
                const itemMinimapX = minimapX + (item.x / mapWidth) * minimapWidth;
                const itemMinimapY = minimapY + 25 + (item.y / mapHeight) * (minimapHeight - 30);
                
                const itemMarker = scene.add.circle(itemMinimapX, itemMinimapY, 2, 0xFFD700);
                itemMarker.setScrollFactor(0); // 固定在屏幕上
                minimapItems.push(itemMarker);
            }
        });
    }
}

// ==========================================
// 7. 射击子弹
// ==========================================
function shootBullet() {
    // 如果在大厅界面，不射击
    if (isInLobby) {
        return;
    }
    
    const currentTime = scene.time.now;
    if (currentTime < lastShootTime + shootCooldown) {
        return;
    }
    lastShootTime = currentTime;
    
    const bullet = scene.add.rectangle(player.x, player.y, 8, 8, '#ffffff');
    scene.physics.add.existing(bullet);
    bullet.body.setCollideWorldBounds(false);
    bullets.add(bullet);
    
    const angle = Phaser.Math.Angle.Between(
        player.x, player.y,
        scene.input.activePointer.worldX, scene.input.activePointer.worldY
    );
    
    scene.physics.velocityFromRotation(angle, 500, bullet.body.velocity);
    
    scene.time.delayedCall(2000, function() {
        if (bullet && bullet.active) {
            bullet.destroy();
        }
    });
    
    console.log('🔫 射击！');
}

// ==========================================
// 8. 子弹击中敌人
// ==========================================
function hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
    score += 10;
    scoreText.setText('分数: ' + score);
    
    // 击杀敌人给经验值
    if (upgradeManager) {
        upgradeManager.addExp(10);
    }
    
    // 更新等级显示
    if (upgradeManager && levelText) {
        levelText.setText('等级: ' + upgradeManager.level);
    }
    
    console.log('💥 击中敌人！分数+10，经验+10');
}

// ==========================================
// 9. 敌人击中玩家
// ==========================================
function hitPlayer(playerObj, enemy) {
    enemy.destroy();
    playerHealth -= 20;
    healthText.setText('血量: ' + playerHealth + '/' + maxHealth);
    console.log('💔 被敌人击中！血量-20');
    
    if (playerHealth <= 0) {
        gameOver();
    }
}

// ==========================================
// 10. 游戏结束
// ==========================================
function gameOver() {
    console.log('💀 游戏结束！最终分数: ' + score);
    
    if (enemySpawnTimer) {
        enemySpawnTimer.remove();
    }
    
    // 停止道具生成
    if (itemManager) {
        itemManager.stop();
    }
    
    // 重置大厅状态
    isInLobby = true;
    
    scene.physics.pause();
    
    const gameOverText = scene.add.text(400, 250, '游戏结束', {
        fontSize: '48px',
        fill: '#FF6B6B',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setShadow(3, 3, '#000000', 3);
    gameOverText.setScrollFactor(0); // 固定在屏幕上
    
    const finalScoreText = scene.add.text(400, 320, '最终分数: ' + score, {
        fontSize: '28px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    finalScoreText.setOrigin(0.5);
    finalScoreText.setShadow(2, 2, '#000000', 2);
    finalScoreText.setScrollFactor(0); // 固定在屏幕上
    
    const restartText = scene.add.text(400, 380, '刷新页面重新开始', {
        fontSize: '20px',
        fill: '#4ECDC4',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    restartText.setOrigin(0.5);
    restartText.setScrollFactor(0); // 固定在屏幕上
}

// ==========================================
// 11. 创建大厅界面
// ==========================================
function createLobbyUI() {
    const centerX = 400;
    const centerY = 300;
    
    console.log('🏠 显示大厅界面');
    
    // 游戏标题
    const title = scene.add.text(centerX, centerY - 150, '战场幸存者', {
        fontSize: '56px',
        fill: '#FFD700',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    title.setShadow(4, 4, '#000000', 4);
    lobbyElements.push(title);
    
    // 副标题
    const subtitle = scene.add.text(centerX, centerY - 80, '2D上帝视角多人战斗肉鸽游戏', {
        fontSize: '20px',
        fill: '#aaaaaa',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    subtitle.setOrigin(0.5);
    lobbyElements.push(subtitle);
    
    // 开始游戏按钮
    const startButton = scene.add.rectangle(centerX, centerY + 50, 300, 80, 0x4ECDC4);
    startButton.setStrokeStyle(3, 0xffffff);
    startButton.setInteractive({ useHandCursor: true });
    startButton.setDepth(10); // 确保按钮在最上层
    lobbyElements.push(startButton);
    
    const startButtonText = scene.add.text(centerX, centerY + 50, '开始游戏', {
        fontSize: '28px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
        fontStyle: 'bold'
    });
    startButtonText.setOrigin(0.5);
    startButtonText.setDepth(11); // 文字在按钮上面
    lobbyElements.push(startButtonText);
    
    // 按钮交互
    startButton.on('pointerdown', () => {
        console.log('🖱️ 点击了开始游戏按钮');
        startGame();
    });
    
    startButton.on('pointerover', () => {
        startButton.setFillStyle(0x3dbdb1);
    });
    
    startButton.on('pointerout', () => {
        startButton.setFillStyle(0x4ECDC4);
    });
    
    // 操作说明
    const helpText = scene.add.text(centerX, centerY + 150, 'WASD/方向键移动 | 鼠标左键射击', {
        fontSize: '16px',
        fill: '#888888',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    helpText.setOrigin(0.5);
    lobbyElements.push(helpText);
}

// ==========================================
// 12. 开始游戏
// ==========================================
function startGame() {
    console.log('🎮 开始游戏');
    
    // 清除大厅界面
    lobbyElements.forEach(element => {
        if (element && element.destroy) {
            element.destroy();
        }
    });
    lobbyElements = [];
    
    isInLobby = false;
    
    // 初始化升级系统
    upgradeManager = new UpgradeManager(scene);
    
    // 初始化道具系统
    itemManager = new ItemManager(scene);
    itemManager.init();
    
    // 初始化网络管理器（多人联机）
    networkManager = new NetworkManager(scene);
    networkManager.connect('ws://localhost:2567');
    
    // 注册网络事件回调
    networkManager.scene.onConnected = (message) => {
        console.log('✅ 已连接到服务器，玩家ID:', message.playerId);
        
        // 发送join消息加入游戏
        networkManager.send({
            type: 'join',
            name: '玩家' + message.playerId.slice(-4)
        });
    };
    
    networkManager.scene.onPlayerJoined = (message) => {
        console.log('👤 新玩家加入:', message.player);
        createOtherPlayer(message.player);
    };
    
    networkManager.scene.onPlayerLeft = (message) => {
        console.log('👋 玩家离开:', message.playerId);
        removeOtherPlayer(message.playerId);
    };
    
    networkManager.scene.onPlayerMoved = (message) => {
        updateOtherPlayerPosition(message);
    };
    
    // 生成并渲染随机地图
    mapGenerator = new MapGenerator(scene);
    mapGenerator.generate();
    mapGenerator.renderInPhaser();
    
    // 设置世界边界
    scene.physics.world.setBounds(0, 0, mapGenerator.getPixelWidth(), mapGenerator.getPixelHeight());
    
    // 创建玩家、敌人、子弹、UI
    createPlayer();
    enemies = scene.physics.add.group();
    bullets = scene.physics.add.group();
    createUI();
    
    // 设置键盘输入
    cursors = scene.input.keyboard.createCursorKeys();
    keyA = scene.input.keyboard.addKey('A');
    keyD = scene.input.keyboard.addKey('D');
    keyW = scene.input.keyboard.addKey('W');
    keyS = scene.input.keyboard.addKey('S');
    
    // 设置鼠标点击射击
    scene.input.on('pointerdown', function(pointer) {
        if (pointer.leftButtonDown() && !isInLobby) {
            shootBullet();
        }
    });
    
    // 设置碰撞检测
    scene.physics.add.overlap(bullets, enemies, hitEnemy, null, scene);
    scene.physics.add.overlap(player, enemies, hitPlayer, null, scene);
    
    // 启动敌人生成定时器（每2秒生成一个敌人）
    enemySpawnTimer = scene.time.addEvent({
        delay: 2000,
        callback: spawnEnemy,
        callbackScope: scene,
        loop: true
    });
    
    // 把所有变量挂载到window对象上，让Item.js能访问
    exposeGlobalsToWindow();
    
    console.log('✅ 游戏初始化完成');
}

// ==========================================
// 13. 创建其他玩家
// ==========================================
function createOtherPlayer(playerData) {
    if (!scene) return;
    
    const otherPlayer = scene.add.rectangle(playerData.x, playerData.y, 28, 28, '#9B59B6');
    otherPlayer.setStrokeStyle(2, 0xffffff);
    otherPlayer.playerId = playerData.id;
    
    // 添加玩家名字
    const nameText = scene.add.text(playerData.x, playerData.y - 25, `玩家${playerData.id.slice(0, 4)}`, {
        fontSize: '12px',
        fill: '#ffffff'
    });
    nameText.setOrigin(0.5);
    otherPlayer.nameText = nameText;
    
    otherPlayers.push(otherPlayer);
    console.log(`✅ 已创建其他玩家: ${playerData.id}`);
}

// ==========================================
// 14. 移除其他玩家
// ==========================================
function removeOtherPlayer(playerId) {
    const index = otherPlayers.findIndex(p => p.playerId === playerId);
    if (index !== -1) {
        const player = otherPlayers[index];
        if (player.nameText) {
            player.nameText.destroy();
        }
        player.destroy();
        otherPlayers.splice(index, 1);
        console.log(`❌ 已移除其他玩家: ${playerId}`);
    }
}

// ==========================================
// 15. 更新其他玩家位置
// ==========================================
function updateOtherPlayerPosition(message) {
    const player = otherPlayers.find(p => p.playerId === message.playerId);
    if (player) {
        // 平滑移动
        scene.tweens.add({
            targets: player,
            x: message.x,
            y: message.y,
            duration: 100,
            ease: 'Linear'
        });
        
        // 更新名字位置
        if (player.nameText) {
            scene.tweens.add({
                targets: player.nameText,
                x: message.x,
                y: message.y - 25,
                duration: 100,
                ease: 'Linear'
            });
        }
    }
}

// ==========================================
// 把所有变量挂载到window对象上，让Item.js能访问
// ==========================================
function exposeGlobalsToWindow() {
    window.game = game;
    window.scene = scene;
    window.player = player;
    window.enemies = enemies;
    window.bullets = bullets;
    window.playerHealth = playerHealth;
    window.maxHealth = maxHealth;
    window.score = score;
    window.healthText = healthText;
    window.scoreText = scoreText;
    window.levelText = levelText;
    window.cursors = cursors;
    window.keyA = keyA;
    window.keyD = keyD;
    window.keyW = keyW;
    window.keyS = keyS;
    window.lastShootTime = lastShootTime;
    window.shootCooldown = shootCooldown;
    window.enemySpawnTimer = enemySpawnTimer;
    window.isInLobby = isInLobby;
    window.lobbyElements = lobbyElements;
    window.upgradeManager = upgradeManager;
    window.attackMultiplier = attackMultiplier;
    window.moveSpeedMultiplier = moveSpeedMultiplier;
    window.critChance = critChance;
    window.areaDamageMultiplier = areaDamageMultiplier;
    window.itemManager = itemManager;
    window.mapGenerator = mapGenerator;
    window.minimap = minimap;
    window.minimapPlayer = minimapPlayer;
    window.minimapEnemies = minimapEnemies;
}

// ==========================================
// 初始化Phaser游戏实例
// ==========================================
window.onload = function() {
    console.log('🚀 正在启动战场幸存者...');
    game = new Phaser.Game(gameConfig);
};
