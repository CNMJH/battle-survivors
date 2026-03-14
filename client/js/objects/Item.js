// ==========================================
// 战场幸存者 - 道具系统
// 功能：道具生成、掉落、拾取、使用
// ==========================================

// 道具类型
const ItemTypes = {
    HEALTH_RESTORE: 'health_restore',  // 血量恢复
    WEAPON_UPGRADE: 'weapon_upgrade',  // 武器升级
    SPEED_BOOST: 'speed_boost',        // 速度提升
    DAMAGE_BOOST: 'damage_boost',     // 伤害增强
    AREA_ATTACK: 'area_attack'        // 范围攻击
};

// 道具颜色
const ItemColors = {
    health_restore: '#4ECDC4',    // 青色（恢复）
    weapon_upgrade: '#FFE66D',     // 黄色（升级）
    speed_boost: '#96CEB4',        // 绿色（速度）
    damage_boost: '#FF6B6B',       // 红色（伤害）
    area_attack: '#DDA0DD'          // 紫色（范围）
};

// 道具名称
const ItemNames = {
    health_restore: '💚 血量恢复',
    weapon_upgrade: '⚔️ 武器升级',
    speed_boost: '👟 速度提升',
    damage_boost: '💥 伤害增强',
    area_attack: '🌀 范围攻击'
};

// 道具类
class Item {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.type = type;
        this.active = true;
        
        // 创建道具精灵
        this.sprite = scene.add.rectangle(
            x,
            y,
            24,     // 宽度
            24,     // 高度
            ItemColors[type]
        );
        
        // 添加白色边框
        this.sprite.setStrokeStyle(2, 0xffffff);
        
        // 添加闪烁动画
        this.scene.tweens.add({
            targets: this.sprite,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // 添加到物理系统
        this.scene.physics.add.existing(this.sprite);
        this.sprite.body.setImmovable(true);
        
        console.log(`📦 道具生成: ${ItemNames[type]} 位置 (${Math.round(x)}, ${Math.round(y)})`);
    }
    
    // 获取道具类型
    getType() {
        return this.type;
    }
    
    // 获取道具名称
    getName() {
        return ItemNames[this.type];
    }
    
    // 检查道具是否激活
    isActive() {
        return this.active;
    }
    
    // 销毁道具
    destroy() {
        this.active = false;
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

// 道具管理器
class ItemManager {
    constructor(scene) {
        this.scene = scene;
        this.items = [];          // 场上道具列表
        this.itemGroups = new Map(); // 按类型分组
        this.spawnTimer = null;     // 生成定时器
    }
    
    // 初始化道具管理器
    init() {
        console.log('📦 道具管理器初始化');
        
        // 每隔5秒生成一个道具
        this.spawnTimer = this.scene.time.addEvent({
            delay: 5000,
            callback: () => this.spawnRandomItem(),
            callbackScope: this,
            loop: true
        });
    }
    
    // 生成随机道具
    spawnRandomItem() {
        if (!this.scene.player) return;
        
        // 随机选择道具类型
        const types = Object.values(ItemTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        // 在玩家周围随机位置生成
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const offsetX = (Math.random() - 0.5) * 400;
        const offsetY = (Math.random() - 0.5) * 400;
        
        const x = Math.max(50, Math.min(1550, playerX + offsetX));
        const y = Math.max(50, Math.min(1166, playerY + offsetY));
        
        // 创建道具
        this.spawnItem(x, y, randomType);
    }
    
    // 在指定位置生成道具
    spawnItem(x, y, type) {
        const item = new Item(this.scene, x, y, type);
        this.items.push(item);
        
        // 按类型分组
        if (!this.itemGroups.has(type)) {
            this.itemGroups.set(type, []);
        }
        this.itemGroups.get(type).push(item);
        
        return item;
    }
    
    // 敌人死亡时掉落道具
    dropItemOnEnemyDeath(enemy) {
        // 30%概率掉落道具
        if (Math.random() > 0.3) return;
        
        // 随机选择道具类型
        const types = Object.values(ItemTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        // 在敌人位置生成道具
        this.spawnItem(enemy.x, enemy.y, randomType);
    }
    
    // 检查玩家拾取道具
    checkPickup(player) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            
            if (!item.isActive()) continue;
            
            // 检查碰撞
            const dx = player.x - item.sprite.x;
            const dy = player.y - item.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 40) {
                // 拾取道具
                this.pickupItem(item, player);
                
                // 从列表中移除
                this.items.splice(i, 1);
                
                // 从分组中移除
                const type = item.getType();
                const group = this.itemGroups.get(type);
                if (group) {
                    const index = group.indexOf(item);
                    if (index > -1) {
                        group.splice(index, 1);
                    }
                }
            }
        }
    }
    
    // 玩家拾取道具
    pickupItem(item, player) {
        const itemType = item.getType();
        const itemName = item.getName();
        
        console.log(`✨ 玩家拾取道具: ${itemName}`);
        
        // 使用道具
        this.useItem(itemType, player);
        
        // 显示拾取提示
        this.showPickupText(itemName, player.x, player.y);
        
        // 销毁道具
        item.destroy();
    }
    
    // 使用道具
    useItem(itemType, player) {
        switch (itemType) {
            case ItemTypes.HEALTH_RESTORE:
                // 血量恢复
                player.health = Math.min(100, player.health + 30);
                if (this.scene.updateHealthDisplay) {
                    this.scene.updateHealthDisplay(player.health);
                }
                break;
                
            case ItemTypes.WEAPON_UPGRADE:
                // 武器升级（提升射击速度）
                player.shootCooldown = Math.max(100, (player.shootCooldown || 300) - 50);
                break;
                
            case ItemTypes.SPEED_BOOST:
                // 速度提升（5秒）
                if (!player.speedBoostActive) {
                    player.speedBoostActive = true;
                    player.originalSpeed = player.speed || 200;
                    player.speed = player.originalSpeed * 1.5;
                    
                    // 5秒后恢复
                    this.scene.time.delayedCall(5000, () => {
                        if (player.speedBoostActive) {
                            player.speedBoostActive = false;
                            player.speed = player.originalSpeed;
                        }
                    });
                }
                break;
                
            case ItemTypes.DAMAGE_BOOST:
                // 伤害增强（5秒）
                if (!player.damageBoostActive) {
                    player.damageBoostActive = true;
                    player.originalDamage = player.damage || 1;
                    player.damage = player.originalDamage * 2;
                    
                    // 5秒后恢复
                    this.scene.time.delayedCall(5000, () => {
                        if (player.damageBoostActive) {
                            player.damageBoostActive = false;
                            player.damage = player.originalDamage;
                        }
                    });
                }
                break;
                
            case ItemTypes.AREA_ATTACK:
                // 范围攻击（对周围敌人造成伤害）
                this.areaAttack(player);
                break;
        }
    }
    
    // 范围攻击
    areaAttack(player) {
        console.log('🌀 范围攻击！');
        
        const attackRadius = 150;
        
        // 找到范围内的敌人
        this.scene.enemies.children.each(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < attackRadius) {
                // 敌人消失
                enemy.destroy();
                
                // 玩家加分
                player.score += 20;
                if (this.scene.updateScoreDisplay) {
                    this.scene.updateScoreDisplay(player.score);
                }
            }
        });
        
        // 显示范围攻击特效
        this.showAreaAttackEffect(player.x, player.y, attackRadius);
    }
    
    // 显示拾取提示文字
    showPickupText(text, x, y) {
        const pickupText = this.scene.add.text(x, y - 30, text, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
        });
        pickupText.setOrigin(0.5);
        pickupText.setShadow(2, 2, '#000000', 2);
        
        // 1秒后消失
        this.scene.tweens.add({
            targets: pickupText,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                pickupText.destroy();
            }
        });
    }
    
    // 显示范围攻击特效
    showAreaAttackEffect(x, y, radius) {
        // 创建范围圆圈
        const circle = this.scene.add.circle(x, y, radius, 0xDDA0DD, 0.3);
        circle.setStrokeStyle(3, 0xDDA0DD);
        
        // 缩放动画
        this.scene.tweens.add({
            targets: circle,
            scale: 0,
            duration: 500,
            onComplete: () => {
                circle.destroy();
            }
        });
    }
    
    // 清理
    destroy() {
        if (this.spawnTimer) {
            this.spawnTimer.remove();
        }
        
        this.items.forEach(item => item.destroy());
        this.items = [];
        this.itemGroups.clear();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Item,
        ItemManager,
        ItemTypes,
        ItemColors,
        ItemNames
    };
}
