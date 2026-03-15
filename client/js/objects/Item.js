// ==========================================
// 战场幸存者 - 道具系统
// ==========================================

class ItemManager {
    constructor(scene) {
        this.scene = scene;
        this.items = []; // 当前存在的道具
        this.itemSpawnTimer = null; // 道具生成定时器
    }
    
    // 初始化道具系统
    init() {
        console.log('🎁 道具系统初始化');
        
        // 每5秒生成一个道具
        this.itemSpawnTimer = this.scene.time.addEvent({
            delay: 5000,
            callback: this.spawnItem,
            callbackScope: this,
            loop: true
        });
    }
    
    // 道具定义
    itemTypes = [
        {
            id: 'health',
            name: '血量恢复',
            description: '恢复30点血量',
            icon: '❤️',
            color: 0xFF6B6B,
            apply: () => {
                this.scene.playerHealth = Math.min(
                    this.scene.playerHealth + 30,
                    this.scene.maxHealth
                );
                if (this.scene.healthText) {
                    this.scene.healthText.setText(
                        '血量: ' + this.scene.playerHealth + '/' + this.scene.maxHealth
                    );
                }
            }
        },
        {
            id: 'weapon',
            name: '武器升级',
            description: '本次游戏攻击力+50%',
            icon: '⚔️',
            color: 0xFFD700,
            apply: () => {
                this.scene.attackMultiplier = (this.scene.attackMultiplier || 1) * 1.5;
            }
        },
        {
            id: 'speed',
            name: '速度提升',
            description: '本次游戏移动速度+30%',
            icon: '👟',
            color: 0x4ECDC4,
            apply: () => {
                this.scene.moveSpeedMultiplier = (this.scene.moveSpeedMultiplier || 1) * 1.3;
            }
        },
        {
            id: 'damage',
            name: '伤害增强',
            description: '本次游戏子弹伤害+40%',
            icon: '💥',
            color: 0xFF4500,
            apply: () => {
                this.scene.attackMultiplier = (this.scene.attackMultiplier || 1) * 1.4;
            }
        },
        {
            id: 'area',
            name: '范围攻击',
            description: '击杀敌人时，周围敌人也受伤害',
            icon: '💫',
            color: 0x9400D3,
            apply: () => {
                this.scene.areaDamageMultiplier = (this.scene.areaDamageMultiplier || 1) * 2;
            }
        }
    ];
    
    // 生成道具
    spawnItem() {
        if (!this.scene.mapGenerator) return;
        
        const mapWidth = this.scene.mapGenerator.getPixelWidth();
        const mapHeight = this.scene.mapGenerator.getPixelHeight();
        
        // 随机选择道具类型
        const itemType = this.itemTypes[Phaser.Math.Between(0, this.itemTypes.length - 1)];
        
        // 随机位置（避开玩家太近的地方）
        let x, y;
        let attempts = 0;
        do {
            x = Phaser.Math.Between(50, mapWidth - 50);
            y = Phaser.Math.Between(50, mapHeight - 50);
            attempts++;
        } while (
            attempts < 50 &&
            this.scene.player &&
            Phaser.Math.Distance.Between(x, y, this.scene.player.x, this.scene.player.y) < 150
        );
        
        // 创建道具
        const item = this.scene.add.circle(x, y, 16, itemType.color);
        item.setStrokeStyle(2, 0xffffff);
        item.itemType = itemType;
        
        // 添加道具图标文字
        const iconText = this.scene.add.text(x, y, itemType.icon, {
            fontSize: '16px'
        });
        iconText.setOrigin(0.5);
        item.iconText = iconText;
        
        // 启用物理引擎
        this.scene.physics.add.existing(item, true); // 静态物体
        
        // 添加到道具列表
        this.items.push(item);
        
        console.log(`🎁 生成道具：${itemType.name}`);
    }
    
    // 检查道具拾取
    checkPickup(player) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            
            // 检测碰撞
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,
                item.x, item.y
            );
            
            if (distance < 30) {
                // 拾取道具
                this.pickupItem(item, i);
            }
        }
    }
    
    // 拾取道具
    pickupItem(item, index) {
        const itemType = item.itemType;
        
        // 应用道具效果
        itemType.apply();
        
        // 销毁道具
        if (item.iconText) {
            item.iconText.destroy();
        }
        item.destroy();
        this.items.splice(index, 1);
        
        console.log(`✨ 拾取道具：${itemType.name}`);
        
        // 显示拾取提示
        this.showPickupNotification(itemType);
    }
    
    // 显示拾取提示
    showPickupNotification(itemType) {
        const centerX = 400;
        const centerY = 200;
        
        const notification = this.scene.add.text(centerX, centerY, `${itemType.icon} ${itemType.name}！\n${itemType.description}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
            align: 'center',
            backgroundColor: '#000000',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        });
        notification.setOrigin(0.5);
        
        // 2秒后消失
        this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            duration: 500,
            delay: 1500,
            onComplete: () => {
                notification.destroy();
            }
        });
    }
    
    // 停止道具生成
    stop() {
        if (this.itemSpawnTimer) {
            this.itemSpawnTimer.remove();
            this.itemSpawnTimer = null;
        }
        
        // 清除所有道具
        this.items.forEach(item => {
            if (item.iconText) {
                item.iconText.destroy();
            }
            item.destroy();
        });
        this.items = [];
    }
}
