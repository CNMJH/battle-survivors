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
let player;
let enemies;
let bullets;
let playerHealth = 100;
let score = 0;
let healthText;
let scoreText;
let cursors;
let spacebar;
let lastShootTime = 0;
const shootCooldown = 300; // 射击冷却时间（毫秒）

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
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // 每隔2秒生成一个敌人
    this.time.addEvent({
        delay: 2000,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });
    
    // 设置碰撞检测
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);
}

// ==========================================
// 3. 创建玩家角色
// ==========================================
function createPlayer() {
    // 创建玩家（像素风格的方块）
    player = this.add.rectangle(400, 300, 32, 32, '#4ECDC4');
    player.setStrokeStyle(2, 0xffffff);
    
    // 启用物理引擎
    this.physics.add.existing(player);
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
    const enemy = this.add.rectangle(x, y, 28, 28, '#FF6B6B');
    enemy.setStrokeStyle(2, 0xffffff);
    
    // 启用物理引擎
    this.physics.add.existing(enemy);
    enemies.add(enemy);
    
    console.log('👾 敌人已生成');
}

// ==========================================
// 5. 创建UI界面
// ==========================================
function createUI() {
    // 显示血量
    healthText = this.add.text(16, 16, '血量: 100', {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    healthText.setShadow(2, 2, '#000000', 2);
    
    // 显示分数
    scoreText = this.add.text(16, 48, '分数: 0', {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    scoreText.setShadow(2, 2, '#000000', 2);
    
    console.log('📊 UI界面已创建');
}

// ==========================================
// 6. 游戏主循环
// ==========================================
function update() {
    if (!player) return;
    
    // 玩家移动
    player.setVelocity(0);
    
    if (cursors.left.isDown) {
        player.setVelocityX(-200);
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
    }
    
    if (cursors.up.isDown) {
        player.setVelocityY(-200);
    } else if (cursors.down.isDown) {
        player.setVelocityY(200);
    }
    
    // 玩家射击
    const currentTime = this.time.now;
    if (spacebar.isDown && currentTime > lastShootTime + shootCooldown) {
        shootBullet();
        lastShootTime = currentTime;
    }
    
    // 敌人AI：向玩家移动
    enemies.children.each(function(enemy) {
        this.physics.moveToObject(enemy, player, 100);
    }, this);
}

// ==========================================
// 7. 射击子弹
// ==========================================
function shootBullet() {
    // 创建子弹（像素风格的白色小方块）
    const bullet = this.add.rectangle(player.x, player.y, 8, 8, '#ffffff');
    
    // 启用物理引擎
    this.physics.add.existing(bullet);
    bullets.add(bullet);
    
    // 设置子弹速度（根据玩家移动方向）
    const angle = Phaser.Math.Angle.Between(
        player.x, player.y,
        this.input.activePointer.x, this.input.activePointer.y
    );
    
    this.physics.velocityFromRotation(angle, 400, bullet.body.velocity);
    
    // 3秒后自动销毁子弹
    this.time.delayedCall(3000, function() {
        if (bullet && bullet.active) {
            bullet.destroy();
        }
    });
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
function hitPlayer(player, enemy) {
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
    
    // 暂停游戏
    this.physics.pause();
    
    // 显示游戏结束文字
    const gameOverText = this.add.text(400, 250, '游戏结束', {
        fontSize: '48px',
        fill: '#FF6B6B',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setShadow(3, 3, '#000000', 3);
    
    const finalScoreText = this.add.text(400, 320, '最终分数: ' + score, {
        fontSize: '28px',
        fill: '#ffffff',
        fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
    });
    finalScoreText.setOrigin(0.5);
    finalScoreText.setShadow(2, 2, '#000000', 2);
    
    const restartText = this.add.text(400, 380, '刷新页面重新开始', {
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
