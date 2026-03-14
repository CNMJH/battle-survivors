// ==========================================
// 战场幸存者 - 音频管理器
// 功能：游戏音效、背景音乐、音效播放逻辑
// ==========================================

class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = new Map();
        this.music = null;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.75;
        this.muted = false;
        
        console.log('🔊 音频管理器初始化');
        
        // 初始化音频
        this.initAudio();
    }
    
    // 初始化音频
    initAudio() {
        // 使用 Web Audio API 生成音效（不需要外部音频文件）
        this.audioContext = null;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Web Audio API 初始化成功');
        } catch (error) {
            console.warn('⚠️ Web Audio API 不可用');
        }
        
        // 生成音效
        this.generateSounds();
    }
    
    // 生成所有音效
    generateSounds() {
        // 射击音效
        this.sounds.set('shoot', this.createShootSound());
        
        // 击中音效
        this.sounds.set('hit', this.createHitSound());
        
        // 道具拾取音效
        this.sounds.set('pickup', this.createPickupSound());
        
        // 升级音效
        this.sounds.set('upgrade', this.createUpgradeSound());
        
        // 玩家受伤音效
        this.sounds.set('hurt', this.createHurtSound());
        
        // 敌人死亡音效
        this.sounds.set('enemyDeath', this.createEnemyDeathSound());
        
        console.log('🔊 音效生成完成');
    }
    
    // 创建射击音效
    createShootSound() {
        return {
            play: () => {
                if (this.muted || !this.audioContext) return;
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // 射击音效：高频脉冲
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(this.sfxVolume * 0.5, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
            }
        };
    }
    
    // 创建击中音效
    createHitSound() {
        return {
            play: () => {
                if (this.muted || !this.audioContext) return;
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // 击中音效：低音撞击
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);
                
                gainNode.gain.setValueAtTime(this.sfxVolume * 0.7, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.15);
            }
        };
    }
    
    // 创建道具拾取音效
    createPickupSound() {
        return {
            play: () => {
                if (this.muted || !this.audioContext) return;
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // 拾取音效：上扬音调
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.15);
                
                gainNode.gain.setValueAtTime(this.sfxVolume * 0.6, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.15);
            }
        };
    }
    
    // 创建升级音效
    createUpgradeSound() {
        return {
            play: () => {
                if (this.muted || !this.audioContext) return;
                
                // 升级音效：两个上升音调
                const playTone = (freq, delay) => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + delay);
                    oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, this.audioContext.currentTime + delay + 0.2);
                    
                    gainNode.gain.setValueAtTime(this.sfxVolume * 0.5, this.audioContext.currentTime + delay);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 0.2);
                    
                    oscillator.start(this.audioContext.currentTime + delay);
                    oscillator.stop(this.audioContext.currentTime + delay + 0.2);
                };
                
                playTone(523, 0);    // C5
                playTone(659, 0.15);  // E5
                playTone(784, 0.3);   // G5
            }
        };
    }
    
    // 创建受伤音效
    createHurtSound() {
        return {
            play: () => {
                if (this.muted || !this.audioContext) return;
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // 受伤音效：下降音调
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
                
                gainNode.gain.setValueAtTime(this.sfxVolume * 0.6, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
            }
        };
    }
    
    // 创建敌人死亡音效
    createEnemyDeathSound() {
        return {
            play: () => {
                if (this.muted || !this.audioContext) return;
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // 敌人死亡音效：快速下降
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);
                
                gainNode.gain.setValueAtTime(this.sfxVolume * 0.4, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.15);
            }
        };
    }
    
    // 播放音效
    playSound(soundName) {
        const sound = this.sounds.get(soundName);
        if (sound && sound.play) {
            sound.play();
            console.log(`🔊 播放音效: ${soundName}`);
        }
    }
    
    // 播放射击音效
    playShoot() {
        this.playSound('shoot');
    }
    
    // 播放击中音效
    playHit() {
        this.playSound('hit');
    }
    
    // 播放拾取音效
    playPickup() {
        this.playSound('pickup');
    }
    
    // 播放升级音效
    playUpgrade() {
        this.playSound('upgrade');
    }
    
    // 播放受伤音效
    playHurt() {
        this.playSound('hurt');
    }
    
    // 播放敌人死亡音效
    playEnemyDeath() {
        this.playSound('enemyDeath');
    }
    
    // 播放背景音乐（循环）
    playMusic() {
        if (this.muted || !this.audioContext) return;
        if (this.music) return; // 已经在播放
        
        console.log('🎵 开始播放背景音乐');
        
        // 生成背景音乐（简单的循环和弦）
        this.musicInterval = setInterval(() => {
            if (this.muted) return;
            
            const playChord = (freq1, freq2, freq3, delay) => {
                [freq1, freq2, freq3].forEach((freq, i) => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.value = freq;
                    
                    gainNode.gain.setValueAtTime(this.musicVolume * 0.15, this.audioContext.currentTime + delay + i * 0.05);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 1.5);
                    
                    oscillator.start(this.audioContext.currentTime + delay + i * 0.05);
                    oscillator.stop(this.audioContext.currentTime + delay + 1.5);
                });
            };
            
            // C大调和弦进行
            const time = this.audioContext.currentTime;
            playChord(261.63, 329.63, 392.00, 0);    // C大调
            playChord(293.66, 369.99, 440.00, 2);    // D小调
            playChord(329.63, 415.30, 493.88, 4);    // E小调
            playChord(349.23, 440.00, 523.25, 6);    // F大调
        }, 8000); // 8秒循环
        
        this.music = true;
    }
    
    // 停止背景音乐
    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        this.music = false;
        console.log('🎵 停止播放背景音乐');
    }
    
    // 设置音乐音量
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        console.log(`🎵 音乐音量: ${Math.round(this.musicVolume * 100)}%`);
    }
    
    // 设置音效音量
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 音效音量: ${Math.round(this.sfxVolume * 100)}%`);
    }
    
    // 静音/取消静音
    toggleMute() {
        this.muted = !this.muted;
        
        if (this.muted) {
            this.stopMusic();
            console.log('🔇 已静音');
        } else {
            console.log('🔊 取消静音');
        }
        
        return this.muted;
    }
    
    // 检查是否静音
    isMuted() {
        return this.muted;
    }
    
    // 获取音乐音量
    getMusicVolume() {
        return this.musicVolume;
    }
    
    // 获取音效音量
    getSfxVolume() {
        return this.sfxVolume;
    }
    
    // 销毁
    destroy() {
        this.stopMusic();
        this.sounds.clear();
        if (this.audioContext) {
            this.audioContext.close();
        }
        console.log('🔊 音频管理器已销毁');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
