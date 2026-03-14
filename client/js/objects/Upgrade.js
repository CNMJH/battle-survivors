// ==========================================
// 战场幸存者 - 升级系统
// ==========================================

class UpgradeManager {
    constructor(scene) {
        this.scene = scene;
        this.upgrades = []; // 当前已选升级
        this.upgradeOptions = []; // 可选升级选项
        this.isShowingUpgrade = false; // 是否正在显示升级界面
        this.exp = 0; // 经验值
        this.level = 1; // 等级
        this.expToNextLevel = 50; // 升级所需经验
        
        // 升级定义
        this.allUpgrades = [
            {
                id: 'maxHealth',
                name: '血量上限提升',
                description: '血量上限+20',
                icon: '❤️',
                apply: () => {
                    this.scene.maxHealth = (this.scene.maxHealth || 100) + 20;
                    this.scene.playerHealth = Math.min(this.scene.playerHealth + 20, this.scene.maxHealth);
                }
            },
            {
                id: 'attack',
                name: '攻击力提升',
                description: '攻击力+25%',
                icon: '⚔️',
                apply: () => {
                    this.scene.attackMultiplier = (this.scene.attackMultiplier || 1) * 1.25;
                }
            },
            {
                id: 'shootSpeed',
                name: '射击速度提升',
                description: '射击冷却-20%',
                icon: '🔫',
                apply: () => {
                    this.scene.shootCooldown = Math.max(50, (this.scene.shootCooldown || 200) * 0.8);
                }
            },
            {
                id: 'moveSpeed',
                name: '移动速度提升',
                description: '移动速度+20%',
                icon: '👟',
                apply: () => {
                    this.scene.moveSpeedMultiplier = (this.scene.moveSpeedMultiplier || 1) * 1.2;
                }
            },
            {
                id: 'critChance',
                name: '暴击率提升',
                description: '暴击率+10%',
                icon: '💥',
                apply: () => {
                    this.scene.critChance = (this.scene.critChance || 0) + 0.1;
                }
            },
            {
                id: 'areaDamage',
                name: '范围伤害',
                description: '子弹伤害范围+50%',
                icon: '💫',
                apply: () => {
                    this.scene.areaDamageMultiplier = (this.scene.areaDamageMultiplier || 1) * 1.5;
                }
            }
        ];
    }
    
    // 添加经验值
    addExp(amount) {
        this.exp += amount;
        console.log(`📊 获得 ${amount} 经验值，当前：${this.exp}/${this.expToNextLevel}`);
        
        if (this.exp >= this.expToNextLevel) {
            this.levelUp();
        }
    }
    
    // 升级
    levelUp() {
        this.exp -= this.expToNextLevel;
        this.level++;
        this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);
        console.log(`🎉 升级！当前等级：${this.level}`);
        
        this.showUpgradeOptions();
    }
    
    // 显示升级选项
    showUpgradeOptions() {
        this.isShowingUpgrade = true;
        this.scene.physics.pause();
        
        // 随机选择3个升级选项
        this.upgradeOptions = this.getRandomUpgrades(3);
        
        // 显示升级界面
        this.createUpgradeUI();
    }
    
    // 随机选择升级
    getRandomUpgrades(count) {
        const available = [...this.allUpgrades];
        const selected = [];
        
        for (let i = 0; i < count && available.length > 0; i++) {
            const index = Phaser.Math.Between(0, available.length - 1);
            selected.push(available.splice(index, 1)[0]);
        }
        
        return selected;
    }
    
    // 创建升级UI
    createUpgradeUI() {
        const centerX = 400;
        const centerY = 300;
        
        // 半透明背景
        this.bg = this.scene.add.rectangle(centerX, centerY, 700, 500, 0x000000, 0.8);
        
        // 标题
        this.title = this.scene.add.text(centerX, centerY - 200, '🎉 选择升级！', {
            fontSize: '36px',
            fill: '#FFD700',
            fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif'
        });
        this.title.setOrigin(0.5);
        this.title.setShadow(2, 2, '#000000', 2);
        
        // 创建升级选项按钮
        this.optionButtons = [];
        for (let i = 0; i < this.upgradeOptions.length; i++) {
            const upgrade = this.upgradeOptions[i];
            const buttonY = centerY - 50 + i * 100;
            
            const button = this.scene.add.rectangle(centerX, buttonY, 500, 80, 0x333355);
            button.setStrokeStyle(2, 0x555577);
            button.setInteractive({ useHandCursor: true });
            
            const text = this.scene.add.text(centerX, buttonY, `${upgrade.icon} ${upgrade.name}\n${upgrade.description}`, {
                fontSize: '20px',
                fill: '#ffffff',
                fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
                align: 'center'
            });
            text.setOrigin(0.5);
            
            button.on('pointerdown', () => {
                this.selectUpgrade(i);
            });
            
            button.on('pointerover', () => {
                button.setFillStyle(0x444466);
            });
            
            button.on('pointerout', () => {
                button.setFillStyle(0x333355);
            });
            
            this.optionButtons.push({ button, text });
        }
    }
    
    // 选择升级
    selectUpgrade(index) {
        const upgrade = this.upgradeOptions[index];
        upgrade.apply();
        this.upgrades.push(upgrade);
        
        console.log(`✅ 选择了升级：${upgrade.name}`);
        
        this.closeUpgradeUI();
        this.scene.physics.resume();
        this.isShowingUpgrade = false;
    }
    
    // 关闭升级UI
    closeUpgradeUI() {
        if (this.bg) this.bg.destroy();
        if (this.title) this.title.destroy();
        
        this.optionButtons.forEach(({ button, text }) => {
            button.destroy();
            text.destroy();
        });
        this.optionButtons = [];
    }
}
