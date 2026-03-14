#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
战场幸存者 - 游戏资源生成脚本
创建简约像素风格的游戏资源
"""

from PIL import Image, ImageDraw
import os

# 确保目录存在
os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)

def create_player():
    """创建16x16像素的玩家角色"""
    img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 青绿色方块（简约像素风格）
    # 主体
    draw.rectangle([3, 3, 12, 12], fill=(78, 205, 196, 255))
    # 白色边框
    draw.rectangle([3, 3, 12, 12], outline=(255, 255, 255, 255), width=1)
    # 眼睛
    draw.rectangle([5, 5, 7, 7], fill=(255, 255, 255, 255))
    draw.rectangle([9, 5, 11, 7], fill=(255, 255, 255, 255))
    
    img.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'player.png'))
    print("✅ 已创建: player.png (16x16)")

def create_enemy():
    """创建12x12像素的敌人角色"""
    img = Image.new('RGBA', (12, 12), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 红色方块（简约像素风格）
    # 主体
    draw.rectangle([2, 2, 9, 9], fill=(255, 107, 107, 255))
    # 白色边框
    draw.rectangle([2, 2, 9, 9], outline=(255, 255, 255, 255), width=1)
    # 眼睛（红色小点）
    draw.rectangle([4, 4, 5, 5], fill=(139, 0, 0, 255))
    draw.rectangle([7, 4, 8, 5], fill=(139, 0, 0, 255))
    
    img.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'enemy.png'))
    print("✅ 已创建: enemy.png (12x12)")

def create_bullet():
    """创建4x4像素的子弹"""
    img = Image.new('RGBA', (4, 4), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 白色小方块（简约像素风格）
    draw.rectangle([0, 0, 3, 3], fill=(255, 255, 255, 255))
    
    img.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bullet.png'))
    print("✅ 已创建: bullet.png (4x4)")

def create_background():
    """创建800x600像素的背景图"""
    img = Image.new('RGBA', (800, 600), (26, 26, 46, 255))
    draw = ImageDraw.Draw(img)
    
    # 深色网格背景（简约像素风格）
    grid_color = (22, 33, 62, 255)
    
    # 绘制垂直线
    for x in range(0, 800, 32):
        draw.line([(x, 0), (x, 600)], fill=grid_color, width=1)
    
    # 绘制水平线
    for y in range(0, 600, 32):
        draw.line([(0, y), (800, y)], fill=grid_color, width=1)
    
    # 随机添加一些深色小方块作为装饰
    import random
    random.seed(42)  # 固定种子，每次生成一样
    for _ in range(50):
        x = random.randint(0, 780)
        y = random.randint(0, 580)
        s = random.randint(8, 16)
        draw.rectangle([x, y, x + s, y + s], fill=(20, 20, 40, 255))
    
    img.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'background.png'))
    print("✅ 已创建: background.png (800x600)")

if __name__ == "__main__":
    print("🎨 开始生成游戏资源...")
    print("-" * 40)
    
    create_player()
    create_enemy()
    create_bullet()
    create_background()
    
    print("-" * 40)
    print("🎉 所有游戏资源生成完成！")
