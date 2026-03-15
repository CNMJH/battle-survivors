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

// 全局变量
let game;
let scene;
let player;
let enemies;
let bullets;
let playerHealth = 100;
let maxHealth = 100; // 血量上限
let score = 0;
let healthText;
let scoreText;
let levelText; // 等级显示
let cursors;
let keyA, keyD, keyW, keyS;
let lastShootTime = 0;
let shootCooldown = 200; // 射击冷却（可升级）
let enemySpawnTimer = null;

// 升级相关
let upgradeManager;
let attackMultiplier = 1; // 攻击力倍数
let moveSpeedMultiplier = 1; // 移动速度倍数
let critChance = 0; // 暴击率
let areaDamageMultiplier = 1; // 范围伤害倍数

// 道具相关
let itemManager;

// 地图相关
let mapGenerator;

// 小地图相关
let minimap;
let minimapPlayer;
let minimapEnemies = [];

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
    
    // 初始化升级系统
    upgradeManager = new UpgradeManager(this);
    
    // 初始化道具系统
    itemManager = new ItemManager(this);
    itemManager.init();
    
    // 生成并渲染随机地图
    mapGenerator = new MapGenerator(this);
    mapGenerator.generate();
    mapGenerator.renderInPhaser();
    
    // 设置世界边界
    this.physics.world.setBounds(0, 0, mapGenerator.getPixelWidth(), mapGenerator.getPixelHeight());
    
    createPlayer();
    enemies = this.physics.add.group();
    bullets = this.physics.add.group();
    createUI();
    
    cursors = this.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey('A');
    keyD = this.input.keyboard.addKey('D');
    keyW = this.input.keyboard.addKey('W');
    keyS = this.input.keyboard.addKey('S');
    
    this.input.on('pointerdown', function(pointer) {
        if (pointer.leftButtonDown()) {
            shootBullet();
        }
    });
    
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);
    
    enemySpawnTimer = this.time.addEvent({
        delay: 2000,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });
    
    console.log('✅ 游戏初始化完成');
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
    
    scoreText = scene.add.text(16, 48, '分数: 0', {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    scoreText.setShadow(2, 2, '#000000', 2);
    
    // 等级显示
    levelText = scene.add.text(16, 80, '等级: 1', {
        fontSize: '18px',
        fill: '#FFD700',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    levelText.setShadow(2, 2, '#000000', 2);
    
    scene.add.text(16, 550, 'WASD/方向键移动 | 鼠标左键射击', {
        fontSize: '14px',
        fill: '#aaaaaa',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    
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
    
    scene.add.text(minimapX + 10, minimapY + 5, '小地图', {
        fontSize: '14px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    
    minimap = scene.add.rectangle(
        minimapX + minimapWidth/2,
        minimapY + minimapHeight/2,
        minimapWidth,
        minimapHeight,
        0x0a0a1a
    );
    minimap.setStrokeStyle(2, 0x333355);
    
    minimapPlayer = scene.add.circle(0, 0, 5, 0x4ECDC4);
    minimapPlayer.setStrokeStyle(1, 0xffffff);
}

// ==========================================
// 6. 游戏主循环
// ==========================================
function update() {
    if (!player) return;
    
    // 如果正在显示升级界面，不更新游戏
    if (upgradeManager && upgradeManager.isShowingUpgrade) {
        return;
    }
    
    // 检查道具拾取
    if (itemManager) {
        itemManager.checkPickup(player);
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
    
    minimapEnemies.forEach(marker => {
        if (marker && marker.active) {
            marker.destroy();
        }
    });
    minimapEnemies = [];
    
    enemies.children.each(function(enemy) {
        const enemyMinimapX = minimapX + (enemy.x / mapWidth) * minimapWidth;
        const enemyMinimapY = minimapY + 25 + (enemy.y / mapHeight) * (minimapHeight - 30);
        
        const enemyMarker = scene.add.circle(enemyMinimapX, enemyMinimapY, 3, 0xFF6B6B);
        minimapEnemies.push(enemyMarker);
    }, this);
}

// ==========================================
// 7. 射击子弹
// ==========================================
function shootBullet() {
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
        scene.input.activePointer.x, scene.input.activePointer.y
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
    
    scene.physics.pause();
    
    const gameOverText = scene.add.text(400, 250, '游戏结束', {
        fontSize: '48px',
        fill: '#FF6B6B',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setShadow(3, 3, '#000000', 3);
    
    const finalScoreText = scene.add.text(400, 320, '最终分数: ' + score, {
        fontSize: '28px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    finalScoreText.setOrigin(0.5);
    finalScoreText.setShadow(2, 2, '#000000', 2);
    
    const restartText = scene.add.text(400, 380, '刷新页面重新开始', {
        fontSize: '20px',
        fill: '#4ECDC4',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    restartText.setOrigin(0.5);
}

// ==========================================
// 初始化Phaser游戏实例
// ==========================================
window.onload = function() {
    console.log('🚀 正在启动战场幸存者...');
    game = new Phaser.Game(gameConfig);
};
