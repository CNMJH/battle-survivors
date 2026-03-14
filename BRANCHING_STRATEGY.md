# 战场幸存者 - 分支管理策略

> Git分支管理规范和工作流程

---

## 分支结构

| 分支类型 | 分支名 | 说明 |
|---------|---------|------|
| **主分支** | `main` | 稳定版本，可用于生产环境 |
| **开发分支** | `develop` | 日常开发分支，集成新功能 |
| **功能分支** | `feature/功能名称` | 单个功能的开发分支 |
| **紧急修复分支** | `hotfix/修复内容` | 生产环境紧急修复 |

---

## 分支说明

### 1. main 分支（主分支）

**用途**：
- 存放稳定版本
- 可用于生产环境部署
- 每次更新都有对应的版本号

**规则**：
- 只从 `develop` 或 `hotfix` 分支合并
- 每次合并后打标签（如 `v1.0.0`）
- 禁止直接提交代码到 `main`

---

### 2. develop 分支（开发分支）

**用途**：
- 日常开发分支
- 集成所有新功能
- 测试新功能的集成

**规则**：
- 从 `main` 分支创建
- 只从 `feature` 分支合并新功能
- 禁止直接提交大功能到 `develop`
- 定期合并到 `main` 分支发布版本

---

### 3. feature 分支（功能分支）

**用途**：
- 单个功能的开发
- 功能开发完成后合并到 `develop`

**命名规范**：
```
feature/功能名称
```

**示例**：
- `feature/地图系统`
- `feature/道具系统`
- `feature/升级系统`
- `feature/网络同步`

**规则**：
- 从 `develop` 分支创建
- 功能开发完成后合并到 `develop`
- 合并后删除该分支
- 一个分支只做一个功能

---

### 4. hotfix 分支（紧急修复分支）

**用途**：
- 生产环境紧急Bug修复
- 快速修复后立即发布

**命名规范**：
```
hotfix/修复内容
```

**示例**：
- `hotfix/崩溃修复`
- `hotfix/网络连接问题`
- `hotfix/显示错误`

**规则**：
- 从 `main` 分支创建
- 修复完成后同时合并到 `main` 和 `develop`
- 合并到 `main` 后打标签（如 `v1.0.1`）
- 合并后删除该分支

---

## 工作流程

### 功能开发流程

```
1. 从 develop 分支创建 feature 分支
   git checkout develop
   git pull origin develop
   git checkout -b feature/功能名称

2. 在 feature 分支上开发
   git add .
   git commit -m "描述你的修改"

3. 功能完成后合并到 develop
   git checkout develop
   git pull origin develop
   git merge feature/功能名称
   git push origin develop

4. 删除 feature 分支
   git branch -d feature/功能名称
   git push origin --delete feature/功能名称
```

---

### 紧急修复流程

```
1. 从 main 分支创建 hotfix 分支
   git checkout main
   git pull origin main
   git checkout -b hotfix/修复内容

2. 修复Bug
   git add .
   git commit -m "修复：描述修复内容"

3. 合并到 main 和 develop
   git checkout main
   git merge hotfix/修复内容
   git tag v1.0.1
   git push origin main --tags
   
   git checkout develop
   git merge hotfix/修复内容
   git push origin develop

4. 删除 hotfix 分支
   git branch -d hotfix/修复内容
   git push origin --delete hotfix/修复内容
```

---

### 版本发布流程

```
1. 确保 develop 分支稳定
   git checkout develop
   git pull origin develop

2. 合并到 main 分支
   git checkout main
   git pull origin main
   git merge develop

3. 打版本标签
   git tag v1.0.0
   git push origin main --tags

4. 推送更新
   git push origin main
```

---

## 版本号规范

使用语义化版本（Semantic Versioning）：

```
v主版本号.次版本号.修订号
```

- **主版本号**：不兼容的API修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

**示例**：
- `v1.0.0` - 第一个正式版本
- `v1.1.0` - 新增功能
- `v1.1.1` - 修复Bug
- `v2.0.0` - 重大更新

---

## 常用Git命令速查

### 分支操作

```bash
# 查看所有分支
git branch -a

# 创建并切换到新分支
git checkout -b 分支名

# 切换到已有分支
git checkout 分支名

# 删除本地分支
git branch -d 分支名

# 删除远程分支
git push origin --delete 分支名
```

### 合并操作

```bash
# 合并分支到当前分支
git merge 分支名

# 查看合并状态
git status

# 解决冲突后继续合并
git add .
git commit
```

### 标签操作

```bash
# 查看所有标签
git tag

# 创建标签
git tag v1.0.0

# 推送标签到远程
git push origin --tags

# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0
```

---

## 注意事项

1. **功能分支要小**：一个分支只做一个功能，方便测试和回滚
2. **经常提交**：不要等功能完全写完才提交
3. **写好提交信息**：清晰描述修改内容
4. **定期同步**：经常从 `develop` 分支拉取最新代码
5. **测试后再合并**：功能测试通过后再合并到 `develop`

---

## 示例

### 示例1：开发新功能

```bash
# 1. 切换到开发分支
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feature/新功能

# 3. 开发并提交
git add .
git commit -m "实现新功能"

# 4. 合并到开发分支
git checkout develop
git pull origin develop
git merge feature/新功能
git push origin develop

# 5. 删除功能分支
git branch -d feature/新功能
git push origin --delete feature/新功能
```

### 示例2：紧急修复

```bash
# 1. 切换到主分支
git checkout main
git pull origin main

# 2. 创建修复分支
git checkout -b hotfix/紧急修复

# 3. 修复并提交
git add .
git commit -m "修复紧急问题"

# 4. 合并到主分支和开发分支
git checkout main
git merge hotfix/紧急修复
git tag v1.0.1
git push origin main --tags

git checkout develop
git merge hotfix/紧急修复
git push origin develop

# 5. 删除修复分支
git branch -d hotfix/紧急修复
git push origin --delete hotfix/紧急修复
```

---

**最后更新：** 2026年3月
