// ==========================================
// 战场幸存者 - 前端游戏主逻辑
// ==========================================

// 游戏配置
const gameConfig = {
    type: Phaser.AUTO,
    width: 800, // 改回800x600
    height: 600, // 改回800x600
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
let scene; // 保存scene引用
let player;
let enemies;
let bullets;
let playerHealth = 100;
let score = 0;
let healthText;
let scoreText;
let cursors;
let keyA, keyD, keyW, keyS; // WASD按键
let lastShootTime = 0;
const shootCooldown = 200; // 射击冷却时间（毫秒）
let enemySpawnTimer = null; // 敌人生成定时器

// 小地图相关
let minimap;
let minimapGraphics;
let minimapPlayer;
let minimapEnemies = [];

// 雷达相关
let radar;
let radarGraphics;
let radarRange = 200; // 雷达范围

// ==========================================
// 1. 预加载资源
// ==========================================
function preload() {
    // 这个Demo用代码绘制图形，不需要加载外部资源
    console.log('📦 资源预加载完成');
}

// ==========================================
// 2. 创建游戏场景
// ==========================================
function create() {
    console.log('🎮 游戏场景已创建');
    
    // 保存scene引用
    scene = this;
    
    // 创建玩家
    createPlayer();
    
    // 创建敌人分组
    enemies = this.physics.add.group();
    
    // 创建子弹分组
    bullets = this.physics.add.group();
    
    // 创建UI
    createUI();
    
    // 设置键盘输入
    cursors = this.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey('A');
    keyD = this.input.keyboard.addKey('D');
    keyW = this.input.keyboard.addKey('W');
    keyS = this.input.keyboard.addKey('S');
    
    // 设置鼠标点击射击
    this.input.on('pointerdown', function(pointer) {
        if (pointer.leftButtonDown()) {
            shootBullet();
        }
    });
    
    // 设置碰撞检测
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);
    
    // 启动敌人生成定时器（每2秒生成一个敌人）
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
    // 重置全局变量
    playerHealth = 100;
    score = 0;
    lastShootTime = 0;
    
    // 创建玩家（像素风格的方块）
    player = scene.add.rectangle(400, 300, 32, 32, '#4ECDC4');
    player.setStrokeStyle(2, 0xffffff);
    
    // 启用物理引擎
    scene.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);
    
    console.log('🎮 玩家角色已创建');
}

// ==========================================
// 4. 生成敌人
// ==========================================
function spawnEnemy() {
    // 随机选择一个边缘位置生成敌人
    const side = Phaser.Math.Between(0, 3);
    let x, y;
    
    switch(side) {
        case 0: // 上边
            x = Phaser.Math.Between(0, 800);
            y = -32;
            break;
        case 1: // 右边
            x = 832;
            y = Phaser.Math.Between(0, 600);
            break;
        case 2: // 下边
            x = Phaser.Math.Between(0, 800);
            y = 632;
            break;
        case 3: // 左边
            x = -32;
            y = Phaser.Math.Between(0, 600);
            break;
    }
    
    // 创建敌人（像素风格的红色方块）
    const enemy = scene.add.rectangle(x, y, 28, 28, '#FF6B6B');
    enemy.setStrokeStyle(2, 0xffffff);
    
    // 启用物理引擎
    scene.physics.add.existing(enemy);
    enemy.body.setCollideWorldBounds(false); // 敌人可以超出屏幕
    enemies.add(enemy);
    
    console.log('👾 敌人已生成');
}

// ==========================================
// 5. 创建UI界面
// ==========================================
function createUI() {
    // 显示血量
    healthText = scene.add.text(16, 16, '血量: 100', {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    healthText.setShadow(2, 2, '#000000', 2);
    
    // 显示分数
    scoreText = scene.add.text(16, 48, '分数: 0', {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    scoreText.setShadow(2, 2, '#000000', 2);
    
    // 显示操作说明
    const helpText = scene.add.text(16, 550, 'WASD/方向键移动 | 鼠标左键射击', {
        fontSize: '14px',
        fill: '#aaaaaa',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    
    // 创建小地图
    createMinimap();
    
    // 创建雷达
    createRadar();
    
    console.log('📊 UI界面已创建');
}

// ==========================================
// 5.1 创建小地图
// ==========================================
function createMinimap() {
    const minimapX = 630;
    const minimapY = 16;
    const minimapWidth = 150;
    const minimapHeight = 150;
    
    // 小地图背景
    minimap = scene.add.rectangle(
        minimapX + minimapWidth/2,
        minimapY + minimapHeight/2,
        minimapWidth,
        minimapHeight,
        0x0a0a1a
    );
    minimap.setStrokeStyle(2, 0x333355);
    
    // 小地图标题
    scene.add.text(minimapX, minimapY - 20, '小地图', {
        fontSize: '14px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    
    // 小地图图形绘制器
    minimapGraphics = scene.add.graphics();
    
    // 小地图上的玩家（绿色圆点）
    minimapPlayer = scene.add.circle(0, 0, 5, 0x4ECDC4);
    minimapPlayer.setStrokeStyle(1, 0xffffff);
}

// ==========================================
// 5.2 创建雷达
// ==========================================
function createRadar() {
    const radarX = 630;
    const radarY = 200;
    const radarSize = 120;
    
    // 雷达背景
    radar = scene.add.circle(
        radarX + radarSize/2,
        radarY + radarSize/2,
        radarSize/2,
        0x0a0a1a
    );
    radar.setStrokeStyle(2, 0x333355);
    
    // 雷达标题
    scene.add.text(radarX, radarY - 20, '雷达', {
        fontSize: '14px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    
    // 雷达图形绘制器
    radarGraphics = scene.add.graphics();
}

// ==========================================
// 6. 游戏主循环
// ==========================================
function update() {
    if (!player) return;
    
    // 玩家移动
    player.body.setVelocity(0);
    
    // WASD或方向键移动
    if (cursors.left.isDown || keyA.isDown) {
        player.body.setVelocityX(-200);
    } else if (cursors.right.isDown || keyD.isDown) {
        player.body.setVelocityX(200);
    }
    
    if (cursors.up.isDown || keyW.isDown) {
        player.body.setVelocityY(-200);
    } else if (cursors.down.isDown || keyS.isDown) {
        player.body.setVelocityY(200);
    }
    
    // 敌人AI：向玩家移动
    enemies.children.each(function(enemy) {
        scene.physics.moveToObject(enemy, player, 80);
    }, this);
    
    // 清理超出屏幕的敌人
    enemies.children.each(function(enemy) {
        if (enemy.x < -100 || enemy.x > 900 || enemy.y < -100 || enemy.y > 700) {
            enemy.destroy();
        }
    }, this);
    
    // 更新小地图
    updateMinimap();
    
    // 更新雷达
    updateRadar();
}

// ==========================================
// 6.1 更新小地图
// ==========================================
function updateMinimap() {
    if (!minimap || !minimapPlayer) return;
    
    const minimapX = 630;
    const minimapY = 16;
    const minimapWidth = 150;
    const minimapHeight = 150;
    const gameWidth = 800;
    const gameHeight = 600;
    
    // 计算玩家在小地图上的位置
    const playerMinimapX = minimapX + (player.x / gameWidth) * minimapWidth;
    const playerMinimapY = minimapY + (player.y / gameHeight) * minimapHeight;
    
    // 更新玩家在小地图上的位置
    minimapPlayer.setPosition(playerMinimapX, playerMinimapY);
    
    // 清除之前的敌人标记
    minimapEnemies.forEach(marker => {
        if (marker && marker.active) {
            marker.destroy();
        }
    });
    minimapEnemies = [];
    
    // 在小地图上绘制敌人
    enemies.children.each(function(enemy) {
        const enemyMinimapX = minimapX + (enemy.x / gameWidth) * minimapWidth;
        const enemyMinimapY = minimapY + (enemy.y / gameHeight) * minimapHeight;
        
        const enemyMarker = scene.add.circle(enemyMinimapX, enemyMinimapY, 3, 0xFF6B6B);
        minimapEnemies.push(enemyMarker);
    }, this);
}

// ==========================================
// 6.2 更新雷达
// ==========================================
function updateRadar() {
    if (!radarGraphics) return;
    
    const radarX = 630;
    const radarY = 200;
    const radarSize = 120;
    const radarCenterX = radarX + radarSize/2;
    const radarCenterY = radarY + radarSize/2;
    
    // 清除之前的雷达绘制
    radarGraphics.clear();
    
    // 绘制雷达范围圆圈
    radarGraphics.lineStyle(1, 0x333355, 0.5);
    radarGraphics.strokeCircle(radarCenterX, radarCenterY, radarSize/2);
    radarGraphics.strokeCircle(radarCenterX, radarCenterY, radarSize/4);
    
    // 绘制十字线
    radarGraphics.lineStyle(1, 0x333355, 0.3);
    radarGraphics.lineBetween(radarCenterX - radarSize/2, radarCenterY, radarCenterX + radarSize/2, radarCenterY);
    radarGraphics.lineBetween(radarCenterX, radarCenterY - radarSize/2, radarCenterX, radarCenterY + radarSize/2);
    
    // 绘制雷达上的敌人
    enemies.children.each(function(enemy) {
        // 计算敌人相对于玩家的位置
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 只显示雷达范围内的敌人
        if (distance < radarRange) {
            // 计算在雷达上的位置（按比例缩放）
            const scale = (radarSize/2 - 10) / radarRange;
            const radarEnemyX = radarCenterX + dx * scale;
            const radarEnemyY = radarCenterY + dy * scale;
            
            // 根据距离设置颜色和大小
            const alpha = 1 - (distance / radarRange);
            const size = 2 + (1 - distance / radarRange) * 4;
            
            radarGraphics.fillStyle(0xFF6B6B, alpha);
            radarGraphics.fillCircle(radarEnemyX, radarEnemyY, size);
        }
    }, this);
    
    // 绘制玩家在雷达中心
    radarGraphics.fillStyle(0x4ECDC4, 1);
    radarGraphics.fillCircle(radarCenterX, radarCenterY, 4);
    radarGraphics.lineStyle(1, 0xffffff, 1);
    radarGraphics.strokeCircle(radarCenterX, radarCenterY, 4);
}

// ==========================================
// 7. 射击子弹
// ==========================================
function shootBullet() {
    // 检查射击冷却
    const currentTime = scene.time.now;
    if (currentTime < lastShootTime + shootCooldown) {
        return;
    }
    lastShootTime = currentTime;
    
    // 创建子弹（像素风格的白色小方块）
    const bullet = scene.add.rectangle(player.x, player.y, 8, 8, '#ffffff');
    
    // 启用物理引擎
    scene.physics.add.existing(bullet);
    bullet.body.setCollideWorldBounds(false);
    bullets.add(bullet);
    
    // 设置子弹速度（根据鼠标位置）
    const angle = Phaser.Math.Angle.Between(
        player.x, player.y,
        scene.input.activePointer.x, scene.input.activePointer.y
    );
    
    scene.physics.velocityFromRotation(angle, 500, bullet.body.velocity);
    
    // 2秒后自动销毁子弹
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
    // 子弹和敌人都消失
    bullet.destroy();
    enemy.destroy();
    
    // 增加分数
    score += 10;
    scoreText.setText('分数: ' + score);
    
    console.log('💥 击中敌人！分数+10');
}

// ==========================================
// 9. 敌人击中玩家
// ==========================================
function hitPlayer(playerObj, enemy) {
    // 敌人消失
    enemy.destroy();
    
    // 减少血量
    playerHealth -= 20;
    healthText.setText('血量: ' + playerHealth);
    
    console.log('💔 被敌人击中！血量-20');
    
    // 检查游戏结束
    if (playerHealth <= 0) {
        gameOver();
    }
}

// ==========================================
// 10. 游戏结束
// ==========================================
function gameOver() {
    console.log('💀 游戏结束！最终分数: ' + score);
    
    // 停止敌人生成
    if (enemySpawnTimer) {
        enemySpawnTimer.remove();
    }
    
    // 暂停游戏
    scene.physics.pause();
    
    // 显示游戏结束文字
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
