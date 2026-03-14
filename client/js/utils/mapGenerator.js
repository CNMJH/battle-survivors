// ==========================================
// 战场幸存者 - 随机地图生成器
// ==========================================

class MapGenerator {
    constructor(scene) {
        this.scene = scene;
        this.mapWidth = 100; // 地图宽度（格子数）- 增大一倍
        this.mapHeight = 75; // 地图高度（格子数）- 增大一倍
        this.tileSize = 16; // 每个格子大小（像素）
        this.map = []; // 地图数据
    }
    
    // 生成随机地图
    generate() {
        console.log('🗺️ 开始生成随机地图...');
        
        // 初始化空地图
        this.map = [];
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = 0; // 0 = 空地
            }
        }
        
        // 1. 添加边界墙
        this.addBoundaryWalls();
        
        // 2. 随机添加障碍物
        this.addRandomObstacles();
        
        // 3. 确保玩家出生点为空
        this.clearPlayerSpawn();
        
        console.log('✅ 地图生成完成');
        return this.map;
    }
    
    // 添加边界墙
    addBoundaryWalls() {
        for (let x = 0; x < this.mapWidth; x++) {
            this.map[0][x] = 1; // 1 = 墙
            this.map[this.mapHeight - 1][x] = 1;
        }
        
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y][0] = 1;
            this.map[y][this.mapWidth - 1] = 1;
        }
    }
    
    // 随机添加障碍物
    addRandomObstacles() {
        const obstacleCount = 300; // 障碍物数量 - 增大地图后增加障碍物
        
        for (let i = 0; i < obstacleCount; i++) {
            const x = Phaser.Math.Between(2, this.mapWidth - 3);
            const y = Phaser.Math.Between(2, this.mapHeight - 3);
            
            // 随机决定是墙还是掩体
            const type = Phaser.Math.Between(0, 2);
            if (type === 0) {
                this.map[y][x] = 1; // 墙
            } else if (type === 1) {
                this.map[y][x] = 2; // 掩体
            }
            // type 2 = 保持空地
        }
    }
    
    // 确保玩家出生点为空
    clearPlayerSpawn() {
        const centerX = Math.floor(this.mapWidth / 2);
        const centerY = Math.floor(this.mapHeight / 2);
        
        // 清除中心3x3区域
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                    this.map[y][x] = 0;
                }
            }
        }
    }
    
    // 在Phaser中渲染地图
    renderInPhaser() {
        if (!this.map || this.map.length === 0) {
            console.warn('⚠️ 地图未生成，无法渲染');
            return;
        }
        
        const offsetX = 0;
        const offsetY = 0;
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.map[y][x];
                const posX = offsetX + x * this.tileSize;
                const posY = offsetY + y * this.tileSize;
                
                if (tile === 1) {
                    // 墙 - 深灰色
                    const wall = this.scene.add.rectangle(posX + this.tileSize/2, posY + this.tileSize/2, this.tileSize, this.tileSize, 0x333344);
                    this.scene.physics.add.existing(wall, true); // 静态物理体
                } else if (tile === 2) {
                    // 掩体 - 棕色
                    const obstacle = this.scene.add.rectangle(posX + this.tileSize/2, posY + this.tileSize/2, this.tileSize, this.tileSize, 0x8B4513);
                    this.scene.physics.add.existing(obstacle, true); // 静态物理体
                }
            }
        }
    }
    
    // 获取像素宽度
    getPixelWidth() {
        return this.mapWidth * this.tileSize;
    }
    
    // 获取像素高度
    getPixelHeight() {
        return this.mapHeight * this.tileSize;
    }
}
