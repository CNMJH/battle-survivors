// ==========================================
// 战场幸存者 - 角色升级系统
// 功能：升级选择界面、升级效果、升级逻辑
// ==========================================

// 升级类型
const UpgradeTypes = {
    HEALTH_BOOST: 'health_boost',      // 血量上限提升
    ATTACK_BOOST: 'attack_boost',      // 攻击力提升
    FIRE_RATE: 'fire_rate',             // 射击速度提升
    MOVE_SPEED: 'move_speed',           // 移动速度提升
    CRIT_CHANCE: 'crit_chance',          // 暴击率提升
    AREA_DAMAGE: 'area_damage'          // 范围伤害
};

// 升级名称
const UpgradeNames = {
    health_boost: '❤️ 血量上限提升',
    attack_boost: '⚔️ 攻击力提升',
    fire_rate: '🔥 射击速度提升',
    move_speed: '👟 移动速度提升',
    crit_chance: '💥 暴击率提升',
    area_damage: '🌀 范围伤害'
};

// 升级描述
const UpgradeDescriptions = {
    health_boost: '血量上限 +30',
    attack_boost: '攻击力 +20%',
    fire_rate: '射击冷却 -50ms',
    move_speed: '移动速度 +15%',
    crit_chance: '暴击率 +10%',
    area_damage: '伤害范围 +20%'
};

// 升级图标颜色
const UpgradeColors = {
    health_boost: '#FF6B6B',
    attack_boost: '#FFE66D',
    fire_rate: '#FF8C42',
    move_speed: '#4ECDC4',
    crit_chance: '#DDA0DD',
    area_damage: '#96CEB4'
};

// 升级管理器
class UpgradeManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.upgrades = [];          // 已获得的升级列表
        this.upgradeLevel = 0;        // 当前升级等级
        this.isOpen = false;          // 升级界面是否打开
        this.upgradeUI = null;         // 升级UI容器
        this.upgradeButtons = [];     // 升级按钮列表
        
        // 升级数据
        this.maxHealth = 100;          // 最大血量
        this.attackMultiplier = 1;      // 攻击倍数
        this.fireRateBonus = 0;        // 射击速度加成
        this.moveSpeedMultiplier = 1;  // 移动速度倍数
        this.critChance = 0;           // 暴击率
        this.areaDamageBonus = 0;       // 范围伤害加成
        
        console.log('⬆️ 升级管理器初始化');
    }
    
    // 打开升级界面（每次升级显示3个随机选项）
    openUpgradeUI() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.upgradeLevel++;
        
        console.log(`⬆️ 打开升级界面 - 第${this.upgradeLevel}次升级`);
        
        // 暂停游戏
        this.scene.physics.pause();
        
        // 创建升级UI容器
        this.createUpgradeUI();
        
        // 随机选择3个升级选项
        this.showRandomUpgrades();
    }
    
    // 创建升级UI
    createUpgradeUI() {
        // 创建半透明背景
        this.upgradeUI = this.scene.add.container(0, 0);
        
        // 背景遮罩
        const background = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            1600,
            1216,
            0x000000,
            0.7
        );
        this.upgradeUI.add(background);
        
        // 标题
        const title = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 200,
            '选择升级！',
            {
                fontSize: '48px',
                fill: '#ffffff',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        title.setOrigin(0.5);
        title.setShadow(3, 3, '#000000', 3);
        this.upgradeUI.add(title);
        
        // 等级显示
        const levelText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 140,
            `第 ${this.upgradeLevel} 次升级`,
            {
                fontSize: '24px',
                fill: '#aaaaaa',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
            }
        );
        levelText.setOrigin(0.5);
        this.upgradeUI.add(levelText);
    }
    
    // 显示3个随机升级选项
    showRandomUpgrades() {
        const allTypes = Object.values(UpgradeTypes);
        
        // 随机打乱
        for (let i = allTypes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allTypes[i], allTypes[j]] = [allTypes[j], allTypes[i]];
        }
        
        // 取前3个
        const selectedTypes = allTypes.slice(0, 3);
        
        // 创建3个升级按钮
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        const spacing = 200;
        
        selectedTypes.forEach((type, index) => {
            const x = centerX + (index - 1) * spacing;
            this.createUpgradeButton(type, x, centerY);
        });
    }
    
    // 创建单个升级按钮
    createUpgradeButton(type, x, y) {
        // 按钮背景
        const buttonBg = this.scene.add.rectangle(
            x,
            y,
            160,
            200,
            UpgradeColors[type],
            0.9
        );
        buttonBg.setStrokeStyle(3, 0xffffff);
        buttonBg.setInteractive();
        this.upgradeUI.add(buttonBg);
        
        // 升级名称
        const nameText = this.scene.add.text(
            x,
            y - 60,
            UpgradeNames[type],
            {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
                align: 'center',
                wordWrap: { width: 140 }
            }
        );
        nameText.setOrigin(0.5);
        this.upgradeUI.add(nameText);
        
        // 升级描述
        const descText = this.scene.add.text(
            x,
            y + 20,
            UpgradeDescriptions[type],
            {
                fontSize: '16px',
                fill: '#dddddd',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
                align: 'center'
            }
        );
        descText.setOrigin(0.5);
        this.upgradeUI.add(descText);
        
        // 鼠标悬停效果
        buttonBg.on('pointerover', () => {
            this.scene.tweens.add({
                targets: buttonBg,
                scale: 1.05,
                duration: 100
            });
        });
        
        buttonBg.on('pointerout', () => {
            this.scene.tweens.add({
                targets: buttonBg,
                scale: 1,
                duration: 100
            });
        });
        
        // 点击选择升级
        buttonBg.on('pointerdown', () => {
            this.selectUpgrade(type);
        });
        
        // 保存按钮引用
        this.upgradeButtons.push({
            type: type,
            bg: buttonBg,
            nameText: nameText,
            descText: descText
        });
    }
    
    // 选择升级
    selectUpgrade(type) {
        if (!this.isOpen) return;
        
        console.log(`⬆️ 选择升级: ${UpgradeNames[type]}`);
        
        // 应用升级效果
        this.applyUpgrade(type);
        
        // 记录已获得的升级
        this.upgrades.push(type);
        
        // 关闭升级界面
        this.closeUpgradeUI();
        
        // 恢复游戏
        this.scene.physics.resume();
    }
    
    // 应用升级效果
    applyUpgrade(type) {
        switch (type) {
            case UpgradeTypes.HEALTH_BOOST:
                // 血量上限提升
                this.maxHealth += 30;
                if (this.player) {
                    this.player.health = Math.min(this.player.health + 30, this.maxHealth);
                    this.updateHealthDisplay();
                }
                break;
                
            case UpgradeTypes.ATTACK_BOOST:
                // 攻击力提升
                this.attackMultiplier *= 1.2;
                break;
                
            case UpgradeTypes.FIRE_RATE:
                // 射击速度提升
                this.fireRateBonus += 50;
                break;
                
            case UpgradeTypes.MOVE_SPEED:
                // 移动速度提升
                this.moveSpeedMultiplier *= 1.15;
                if (this.player && this.player.body) {
                    this.player.speed = (this.player.baseSpeed || 200) * this.moveSpeedMultiplier;
                }
                break;
                
            case UpgradeTypes.CRIT_CHANCE:
                // 暴击率提升
                this.critChance = Math.min(1, this.critChance + 0.1);
                break;
                
            case UpgradeTypes.AREA_DAMAGE:
                // 范围伤害
                this.areaDamageBonus += 0.2;
                break;
        }
        
        console.log(`✨ 升级效果已应用: ${UpgradeNames[type]}`);
    }
    
    // 关闭升级界面
    closeUpgradeUI() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        // 销毁UI
        if (this.upgradeUI) {
            this.upgradeUI.destroy();
            this.upgradeUI = null;
        }
        
        // 清空按钮列表
        this.upgradeButtons = [];
        
        console.log('⬆️ 升级界面已关闭');
    }
    
    // 获取当前射击冷却时间
    getShootCooldown(baseCooldown) {
        return Math.max(50, baseCooldown - this.fireRateBonus);
    }
    
    // 获取伤害值（包含暴击计算）
    getDamage(baseDamage) {
        let damage = baseDamage * this.attackMultiplier;
        
        // 暴击判定
        if (Math.random() < this.critChance) {
            damage *= 2;
            console.log('💥 暴击！');
        }
        
        return damage;
    }
    
    // 更新血量显示
    updateHealthDisplay() {
        if (this.scene.updateHealthDisplay) {
            this.scene.updateHealthDisplay(this.player.health);
        }
    }
    
    // 获取升级统计
    getUpgradeStats() {
        return {
            level: this.upgradeLevel,
            upgrades: [...this.upgrades],
            maxHealth: this.maxHealth,
            attackMultiplier: this.attackMultiplier,
            fireRateBonus: this.fireRateBonus,
            moveSpeedMultiplier: this.moveSpeedMultiplier,
            critChance: this.critChance,
            areaDamageBonus: this.areaDamageBonus
        };
    }
    
    // 重置升级
    reset() {
        this.upgrades = [];
        this.upgradeLevel = 0;
        this.maxHealth = 100;
        this.attackMultiplier = 1;
        this.fireRateBonus = 0;
        this.moveSpeedMultiplier = 1;
        this.critChance = 0;
        this.areaDamageBonus = 0;
        
        this.closeUpgradeUI();
        
        console.log('⬆️ 升级已重置');
    }
    
    // 销毁
    destroy() {
        this.closeUpgradeUI();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UpgradeManager,
        UpgradeTypes,
        UpgradeNames,
        UpgradeDescriptions,
        UpgradeColors
    };
}
