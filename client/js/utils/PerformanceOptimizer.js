// ==========================================
// 战场幸存者 - 性能优化器
// 功能：渲染优化、网络优化、碰撞优化、内存优化
// ==========================================

class PerformanceOptimizer {
    constructor(scene) {
        this.scene = scene;
        this.fps = 60;
        this.targetFPS = 60;
        this.frameCount = 0;
        this.lastFPSUpdate = Date.now();
        this.ping = 0;
        this.targetPing = 100;
        this.isLowEndDevice = this.detectLowEndDevice();
        this.objectPool = new Map(); // 对象池
        this.activeObjects = new Set(); // 活跃对象
        this.cullingDistance = 800; // 视锥剔除距离
        
        console.log('⚡ 性能优化器初始化');
        console.log('📱 设备类型:', this.isLowEndDevice ? '低配置' : '标准配置');
        
        // 开始性能监控
        this.startPerformanceMonitor();
    }
    
    // 检测低配置设备
    detectLowEndDevice() {
        // 检测内存
        const memory = navigator.deviceMemory || 4;
        
        // 检测CPU核心数
        const cores = navigator.hardwareConcurrency || 2;
        
        // 检测移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 低配置设备判断
        const lowEnd = memory < 4 || cores < 4 || isMobile;
        
        return lowEnd;
    }
    
    // 开始性能监控
    startPerformanceMonitor() {
        // FPS监控
        this.scene.time.addEvent({
            delay: 1000,
            callback: () => this.updateFPS(),
            loop: true
        });
        
        console.log('📊 性能监控已启动');
    }
    
    // 更新FPS
    updateFPS() {
        const now = Date.now();
        const elapsed = (now - this.lastFPSUpdate) / 1000;
        this.fps = Math.round(this.frameCount / elapsed);
        this.frameCount = 0;
        this.lastFPSUpdate = now;
        
        // 如果FPS过低，降低画质
        if (this.fps < 30 && !this.isLowEndDevice) {
            console.warn('⚠️ FPS过低，自动降低画质');
            this.enableLowQualityMode();
        }
        
        console.log(`📊 FPS: ${this.fps} | Ping: ${this.ping}ms`);
    }
    
    // 每帧更新
    update() {
        this.frameCount++;
        
        // 视锥剔除
        this.cullObjects();
        
        // 对象池更新
        this.updateObjectPool();
    }
    
    // ==========================================
    // 1. 渲染性能优化
    // ==========================================
    
    // 启用低画质模式
    enableLowQualityMode() {
        if (this.isLowEndDevice) return;
        
        this.isLowEndDevice = true;
        console.log('🎮 启用低画质模式');
        
        // 降低渲染质量
        if (this.scene.game) {
            this.scene.game.renderer.pixelRatio = Math.min(window.devicePixelRatio, 1.5);
        }
        
        // 减少粒子效果
        this.disableParticleEffects();
    }
    
    // 禁用粒子效果
    disableParticleEffects() {
        console.log('✨ 禁用粒子效果');
        // 这里可以禁用不必要的粒子系统
    }
    
    // 对象池获取对象
    getObjectFromPool(type, createFunc) {
        const pool = this.objectPool.get(type) || [];
        
        if (pool.length > 0) {
            const obj = pool.pop();
            obj.active = true;
            obj.visible = true;
            this.activeObjects.add(obj);
            return obj;
        }
        
        // 池中没有对象，创建新的
        const newObj = createFunc();
        newObj.active = true;
        newObj.visible = true;
        this.activeObjects.add(newObj);
        
        return newObj;
    }
    
    // 返还对象到池中
    returnObjectToPool(type, obj) {
        if (!obj) return;
        
        obj.active = false;
        obj.visible = false;
        
        // 移除出视野
        if (obj.setPosition) {
            obj.setPosition(-1000, -1000);
        }
        
        // 从活跃对象中移除
        this.activeObjects.delete(obj);
        
        // 放入对象池
        const pool = this.objectPool.get(type) || [];
        pool.push(obj);
        this.objectPool.set(type, pool);
    }
    
    // 更新对象池
    updateObjectPool() {
        // 清理过大的对象池
        this.objectPool.forEach((pool, type) => {
            if (pool.length > 50) {
                // 保留50个，销毁多余的
                const excess = pool.splice(50);
                excess.forEach(obj => {
                    if (obj.destroy) {
                        obj.destroy();
                    }
                });
            }
        });
    }
    
    // 视锥剔除
    cullObjects() {
        const camera = this.scene.cameras.main;
        if (!camera) return;
        
        const cameraX = camera.scrollX + camera.width / 2;
        const cameraY = camera.scrollY + camera.height / 2;
        
        this.activeObjects.forEach(obj => {
            if (!obj || !obj.x || !obj.y) return;
            
            const distance = Math.sqrt(
                Math.pow(obj.x - cameraX, 2) + 
                Math.pow(obj.y - cameraY, 2)
            );
            
            // 超出视野范围的对象隐藏
            if (distance > this.cullingDistance) {
                if (obj.visible !== false) {
                    obj.visible = false;
                }
            } else {
                if (obj.visible !== true) {
                    obj.visible = true;
                }
            }
        });
    }
    
    // ==========================================
    // 2. 网络延迟优化
    // ==========================================
    
    // 更新网络延迟
    updatePing(ping) {
        this.ping = ping;
        
        // 如果延迟过高，调整网络策略
        if (ping > this.targetPing) {
            this.adjustNetworkForHighLatency();
        }
    }
    
    // 高延迟网络调整
    adjustNetworkForHighLatency() {
        console.warn('⚠️ 网络延迟过高，调整网络策略');
        
        // 减少更新频率
        this.scene.networkUpdateRate = Math.max(10, this.scene.networkUpdateRate || 20);
        
        // 增加插值
        this.scene.enableInterpolation = true;
    }
    
    // 状态插值（减少延迟感知）
    interpolateState(oldState, newState, t) {
        // t: 0-1 插值因子
        const interpolated = {};
        
        for (const key in newState) {
            if (typeof newState[key] === 'number' && typeof oldState[key] === 'number') {
                interpolated[key] = oldState[key] + (newState[key] - oldState[key]) * t;
            } else {
                interpolated[key] = newState[key];
            }
        }
        
        return interpolated;
    }
    
    // 消息压缩
    compressMessage(message) {
        // 简单的消息压缩：只发送变化的字段
        return message; // 实际项目中可以使用Protocol Buffers等
    }
    
    // ==========================================
    // 3. 碰撞检测优化
    // ==========================================
    
    // 空间分区（网格）
    createSpatialGrid(cellSize = 100) {
        this.gridCellSize = cellSize;
        this.spatialGrid = new Map();
    }
    
    // 将对象放入网格
    addToGrid(obj, id) {
        if (!this.spatialGrid) this.createSpatialGrid();
        
        const gridX = Math.floor(obj.x / this.gridCellSize);
        const gridY = Math.floor(obj.y / this.gridCellSize);
        const key = `${gridX},${gridY}`;
        
        const cell = this.spatialGrid.get(key) || new Map();
        cell.set(id, obj);
        this.spatialGrid.set(key, cell);
    }
    
    // 从网格移除对象
    removeFromGrid(obj, id) {
        if (!this.spatialGrid) return;
        
        const gridX = Math.floor(obj.x / this.gridCellSize);
        const gridY = Math.floor(obj.y / this.gridCellSize);
        const key = `${gridX},${gridY}`;
        
        const cell = this.spatialGrid.get(key);
        if (cell) {
            cell.delete(id);
        }
    }
    
    // 只检查周围网格的碰撞
    getNearbyObjects(obj, id) {
        if (!this.spatialGrid) return [];
        
        const nearby = [];
        const gridX = Math.floor(obj.x / this.gridCellSize);
        const gridY = Math.floor(obj.y / this.gridCellSize);
        
        // 检查周围9个网格
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${gridX + dx},${gridY + dy}`;
                const cell = this.spatialGrid.get(key);
                
                if (cell) {
                    cell.forEach((cellObj, cellId) => {
                        if (cellId !== id) {
                            nearby.push(cellObj);
                        }
                    });
                }
            }
        }
        
        return nearby;
    }
    
    // 宽相位碰撞检测（AABB）
    broadPhaseCollision(obj1, obj2) {
        if (!obj1 || !obj2) return false;
        
        const r1 = (obj1.size || 32) / 2;
        const r2 = (obj2.size || 32) / 2;
        
        return Math.abs(obj1.x - obj2.x) < r1 + r2 &&
               Math.abs(obj1.y - obj2.y) < r1 + r2;
    }
    
    // 窄相位碰撞检测（圆形）
    narrowPhaseCollision(obj1, obj2) {
        if (!obj1 || !obj2) return false;
        
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const r1 = (obj1.size || 32) / 2;
        const r2 = (obj2.size || 32) / 2;
        
        return distance < r1 + r2;
    }
    
    // ==========================================
    // 4. 内存使用优化
    // ==========================================
    
    // 清理内存
    cleanupMemory() {
        console.log('🧹 清理内存');
        
        // 清理对象池
        this.objectPool.forEach((pool, type) => {
            if (pool.length > 20) {
                // 保留20个，销毁多余的
                const excess = pool.splice(20);
                excess.forEach(obj => {
                    if (obj.destroy) {
                        obj.destroy();
                    }
                });
            }
        });
        
        // 清理空间分区
        this.spatialGrid?.clear();
        
        // 强制GC提示（浏览器不一定执行）
        if (window.gc) {
            window.gc();
        }
    }
    
    // 纹理图集（减少绘制调用）
    createTextureAtlas(textures) {
        console.log('🎨 创建纹理图集');
        // 实际项目中可以将多个小图合并成一张大图
        return textures;
    }
    
    // 资源预加载
    preloadAssets(assets) {
        console.log('📦 预加载资源');
        return assets;
    }
    
    // ==========================================
    // 性能统计
    // ==========================================
    
    // 获取性能统计
    getPerformanceStats() {
        return {
            fps: this.fps,
            ping: this.ping,
            activeObjects: this.activeObjects.size,
            poolSize: Array.from(this.objectPool.values()).reduce((sum, p) => sum + p.length, 0),
            isLowEndDevice: this.isLowEndDevice
        };
    }
    
    // 显示性能面板
    showPerformancePanel() {
        const stats = this.getPerformanceStats();
        
        if (!this.performanceText) {
            this.performanceText = this.scene.add.text(
                this.scene.cameras.main.width - 16,
                16,
                '',
                {
                    fontSize: '14px',
                    fill: '#4ECDC4',
                    fontFamily: 'Consolas, monospace',
                    align: 'right'
                }
            );
            this.performanceText.setOrigin(1, 0);
            this.performanceText.setScrollFactor(0);
        }
        
        this.performanceText.setText([
            `FPS: ${stats.fps}`,
            `Ping: ${stats.ping}ms`,
            `Objects: ${stats.activeObjects}`,
            `Pool: ${stats.poolSize}`,
            stats.isLowEndDevice ? 'Low-End' : 'Standard'
        ].join('\n'));
    }
    
    // 销毁
    destroy() {
        this.cleanupMemory();
        this.objectPool.clear();
        this.activeObjects.clear();
        this.spatialGrid?.clear();
        
        if (this.performanceText) {
            this.performanceText.destroy();
        }
        
        console.log('⚡ 性能优化器已销毁');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}
