// ==========================================
// 战场幸存者 - 随机地图生成器
// 功能：随机瓦片地图生成、地形和掩体
// ==========================================

class MapGenerator {
    constructor(width = 50, height = 38) {
        this.width = width;      // 瓦片地图宽度（瓦片数）
        this.height = height;    // 瓦片地图高度（瓦片数）
        this.tileSize = 32;      // 每个瓦片的像素大小
        this.map = [];          // 地图数据 [y][x]
        this.seed = Date.now();  // 随机种子（确保每次不同）
    }
    
    // 瓦片类型
    static TILE_TYPES = {
        EMPTY: 0,       // 空地（可通行）
        WALL: 1,        // 墙壁（不可通行）
        COVER: 2,       // 掩体（可通行，提供掩护）
        SPAWN: 3        // 出生点（可通行）
    };
    
    // 瓦片颜色
    static TILE_COLORS = {
        0: '#1a1a2e',      // 空地：深色
        1: '#16213e',      // 墙壁：更深色
        2: '#0f3460',      // 掩体：蓝色
        3: '#1a1a2e'       // 出生点：同空地
    };
    
    // 生成随机地图
    generate() {
        console.log('🗺️ 开始生成随机地图...');
        
        // 重置随机种子
        this.seed = Date.now();
        
        // 1. 初始化空地图
        this.initEmptyMap();
        
        // 2. 生成边界墙
        this.generateBoundaryWalls();
        
        // 3. 生成随机墙壁
        this.generateRandomWalls();
        
        // 4. 生成掩体
        this.generateCovers();
        
        // 5. 生成出生点
        this.generateSpawnPoints();
        
        // 6. 确保玩家有足够的移动空间
        this.ensurePlayerSpace();
        
        console.log('✅ 随机地图生成完成！');
        
        return this.map;
    }
    
    // 初始化空地图
    initEmptyMap() {
        this.map = [];
        for (let y = 0; y < this.height; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.map[y][x] = MapGenerator.TILE_TYPES.EMPTY;
            }
        }
    }
    
    // 生成边界墙
    generateBoundaryWalls() {
        // 顶部边界
        for (let x = 0; x < this.width; x++) {
            this.map[0][x] = MapGenerator.TILE_TYPES.WALL;
        }
        
        // 底部边界
        for (let x = 0; x < this.width; x++) {
            this.map[this.height - 1][x] = MapGenerator.TILE_TYPES.WALL;
        }
        
        // 左侧边界
        for (let y = 0; y < this.height; y++) {
            this.map[y][0] = MapGenerator.TILE_TYPES.WALL;
        }
        
        // 右侧边界
        for (let y = 0; y < this.height; y++) {
            this.map[y][this.width - 1] = MapGenerator.TILE_TYPES.WALL;
        }
        
        console.log('🧱 边界墙生成完成');
    }
    
    // 生成随机墙壁
    generateRandomWalls() {
        const wallCount = 50 + this.randomInt(30); // 50-80个随机墙壁
        
        for (let i = 0; i < wallCount; i++) {
            const x = 2 + this.randomInt(this.width - 4);
            const y = 2 + this.randomInt(this.height - 4);
            
            // 墙壁长度：1-4个瓦片
            const length = 1 + this.randomInt(4);
            const direction = this.randomInt(2); // 0=水平, 1=垂直
            
            for (let j = 0; j < length; j++) {
                let wx = x;
                let wy = y;
                
                if (direction === 0) {
                    wx = x + j;
                } else {
                    wy = y + j;
                }
                
                // 确保不超出边界
                if (wx > 1 && wx < this.width - 2 && 
                    wy > 1 && wy < this.height - 2) {
                    this.map[wy][wx] = MapGenerator.TILE_TYPES.WALL;
                }
            }
        }
        
        console.log('🧱 随机墙壁生成完成');
    }
    
    // 生成掩体
    generateCovers() {
        const coverCount = 30 + this.randomInt(20); // 30-50个掩体
        
        for (let i = 0; i < coverCount; i++) {
            const x = 3 + this.randomInt(this.width - 6);
            const y = 3 + this.randomInt(this.height - 6);
            
            // 只在空地上生成掩体
            if (this.map[y][x] === MapGenerator.TILE_TYPES.EMPTY) {
                this.map[y][x] = MapGenerator.TILE_TYPES.COVER;
            }
        }
        
        console.log('🛡️ 掩体生成完成');
    }
    
    // 生成出生点
    generateSpawnPoints() {
        // 4个角落附近的出生点
        const spawnPoints = [
            { x: 3, y: 3 },                    // 左上角
            { x: this.width - 4, y: 3 },        // 右上角
            { x: 3, y: this.height - 4 },        // 左下角
            { x: this.width - 4, y: this.height - 4 } // 右下角
        ];
        
        spawnPoints.forEach(point => {
            // 确保出生点周围是空的
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const x = point.x + dx;
                    const y = point.y + dy;
                    if (x > 0 && x < this.width - 1 && 
                        y > 0 && y < this.height - 1) {
                        this.map[y][x] = MapGenerator.TILE_TYPES.SPAWN;
                    }
                }
            }
        });
        
        console.log('📍 出生点生成完成');
    }
    
    // 确保玩家有足够的移动空间
    ensurePlayerSpace() {
        // 在地图中心开辟一个空地
        const centerX = Math.floor(this.width / 2);
        const centerY = Math.floor(this.height / 2);
        
        // 中心5x5区域清空
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x > 1 && x < this.width - 2 && 
                    y > 1 && y < this.height - 2) {
                    this.map[y][x] = MapGenerator.TILE_TYPES.EMPTY;
                }
            }
        }
        
        console.log('🏃 玩家移动空间确保完成');
    }
    
    // 获取瓦片地图数据
    getTileMap() {
        return this.map;
    }
    
    // 获取瓦片大小
    getTileSize() {
        return this.tileSize;
    }
    
    // 获取地图像素宽度
    getPixelWidth() {
        return this.width * this.tileSize;
    }
    
    // 获取地图像素高度
    getPixelHeight() {
        return this.height * this.tileSize;
    }
    
    // 检查位置是否可通行
    isWalkable(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (tileX < 0 || tileX >= this.width || 
            tileY < 0 || tileY >= this.height) {
            return false;
        }
        
        const tile = this.map[tileY][tileX];
        return tile !== MapGenerator.TILE_TYPES.WALL;
    }
    
    // 伪随机数生成器（确保每次不同）
    randomInt(max) {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed % max;
    }
    
    // 在Phaser中渲染地图
    renderInPhaser(scene) {
        console.log('🎨 在Phaser中渲染地图...');
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.map[y][x];
                const color = MapGenerator.TILE_COLORS[tile];
                
                // 绘制瓦片
                const rect = scene.add.rectangle(
                    x * this.tileSize + this.tileSize / 2,
                    y * this.tileSize + this.tileSize / 2,
                    this.tileSize,
                    this.tileSize,
                    color
                );
                
                // 墙壁和掩体添加边框
                if (tile === MapGenerator.TILE_TYPES.WALL || 
                    tile === MapGenerator.TILE_TYPES.COVER) {
                    rect.setStrokeStyle(1, 0x000000, 0.3);
                }
            }
        }
        
        console.log('✅ 地图渲染完成');
    }
}

// 导出地图生成器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}
