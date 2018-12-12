---
title: "常见git命令学习"
img: new-york.jpg # Add image post (optional)
date: 2018-03-18 19:00:00 Asia/Shanghai
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [GIT]
---


# 文章目的

在学习了[廖雪峰的git教程](https://www.liaoxuefeng.com/wiki/0013739516305929606dd18361248578c67b8067c8c017b000)中一些常见的git命令后，觉得有必要把他们记录下来，就有了这文章，仅作为记录使用。**很多命令都可以使用 --help 后缀来获取帮助**。

# 版本回退

此回退操作的前提是没有推送到远程仓库。

### git log

1. 显示从最近到最远的`commit`提交日志
2. `--pretty=oneline`  每个提交以单行显示

### HEAD版本

`HEAD`当前版本，上一个版本`HEAD^`，上上一个版本`HEAD^^`，往上100个版本可以写成HEAD~100。

### 回退

1. 回到上个版本 `git reset --hard head^`
2. 回到具体某个`commit id`对应的版本 `git reset --hard commit-id`,只需指定前几位即可
3. 如果无法直接找到commit id，可以尝试使用`git reflog`，它会记录每一次的操作命令，其中就包含了id信息。

# 撤销修改

1. 撤销工作区的修改 `git checkout -- file` or `git checkout .`
2. 撤销暂存区的修改 `git reset HEAD file`

# 分支管理
## 创建与合并分支

1. 切换到分支`git checkout branch-name`
2. 创建并切换到分支 `git checkout -b branch-name`，这里的`-b`表示创建分支， `checkout`表示切换到对应分支. 它相当于
	1. `git branch branch-name` 创建分支
	2. `git checkout branch-name` 切换分支
3. 查看当前分支 `git branch`
4. `Fast Forward`模式合并分支 `git merge target-branch-name`. **此模式适用于目标分支有新提交，当前分支没有新提交即落后于目标分支，直接推进master指针即可**

	![](https://cdn.liaoxuefeng.com/cdn/files/attachments/0013849088235627813efe7649b4f008900e5365bb72323000/0)

	![](https://cdn.liaoxuefeng.com/cdn/files/attachments/00138490883510324231a837e5d4aee844d3e4692ba50f5000/0)

5. 删除分支 `git branch -d branch-name`. **如果目标分支上已经有了提交，但没有合并到当前分支上，此命令会失败，需要改为`git branch -D branch-name`**

## 解决冲突

在执行`git merge branch-name`操作时，如果提示有冲突，就必须先解决完冲突才能再提交。**这种情况下`Fast Forward`模式无法起作用，因为当前分支不是单纯的落后目标分支**。

冲突前：

![](https://cdn.liaoxuefeng.com/cdn/files/attachments/001384909115478645b93e2b5ae4dc78da049a0d1704a41000/0)

解决完冲突后

![](https://cdn.liaoxuefeng.com/cdn/files/attachments/00138490913052149c4b2cd9702422aa387ac024943921b000/0)

## 分支管理策略

### 不使用`Fast Forward`进行合并

`Fast forward`模式下合并时，看不到目标分支的各种提交信息，合并操作也没有当做一次`commit`操作，  删除分支后，会丢掉分支信息。

使用`--no-ff`来强制不使用FF模式合并，上述的缺点都会避免：

```
git merge --no-ff -m "commit message" target-branch-name
```

加上`-m`是为了将此次合并当做一次提交。

![](https://cdn.liaoxuefeng.com/cdn/files/attachments/001384909222841acf964ec9e6a4629a35a7a30588281bb000/0)

## `git stash`与BUG分支

有时候当前分支的活没干完，临时需要去修BUG，但又不能直接把半成品提交，此时可以借助`git stash`将当前工作内容藏匿起来，但又不是放到暂存区。

`stash`之后，当前工作区就是干净的了，可以使用`git status`验证。然后就可以创建BUG分支，修改之后合并到当前分支。

1. `git stash` 将当前分支的修改藏匿起来
2. `git stash list` 可以进行多次藏匿，使用此命令查看所有的藏匿列表
3. 从藏匿列表中恢复
	1. 先恢复再删除对应藏匿记录：
		1. `git stash apply` 从藏匿列表的最新一条记录恢复，但不删除此记录
		2. `git stash drop` 删除藏匿列表的最新一条
	2. 恢复的同时并删除 `git stash pop`
	3. 恢复指定的一条藏匿记录，每条藏匿记录都有一个标识，使用`git stash list`查看，然后使用例如

		```
		git stash apply stash@{0} # stash@{0} 就是记录的标识
		```

## 多人写作

使用`git remote` 或 `git remote -v`获取远程仓库的信息

### 推送分支

1. 将本地某个分支推送到远程的对应分支 `git push origin branch-name`，`branch-name`为本地的分支，一般是`master`或`dev`

### 抓取分支

1. 使用`git clone remote-address` 克隆远程仓库到本地，**此时会默认建立本地`master`到远程`master`的联系，可以使用`git branch`验证**
2. 创建一个本地分支并与远程仓库的对应分支联系： `git checkout -b branch-name origin/branch-name`，之后在此分支上提交代码就可以使用`git push origin branch-name`了。
3. 使用`git pull`拉取远程仓库的最新提交，如果提示`no tracking information`,则表示当前本地分支还没有任何远程分支建立联系，使用`git branch --set-upstream-to=origin/branch-name branch-name`来建立联系

# 标签管理

1. `git tag tag-name` 以当前分支的最新一次提交打标签，暂时还只在本地存储的
2. `git tag tag-name commit-id` 以指定的`commit id`对应的版本来打标签
3. `git tag` 显示所有标签
4. `git show tag-name` 显示标签的详细信息
5. 创建带有说明的标签： `git tag -a tag-name -m tag-desc [commit-id]`
6. `git tag -d tag-name`删除标签（本地的标签）
7. 推送标签到远程仓库
	1. `git push origin tag-name` 推送单个标签
	2. `git push origin --tags` 推送所有标签
8. 删除远程仓库标签
	1. 先从本地删除这个标签 `git tag -d tag-name`
	2. 再将删除操作推送到远程 `git push origin :refs/tags/tag-name`

# 设置命令别名

别名有3种级别： 用户级`--global`、系统级`--system`、项目级无需修饰符

1. 设置级别名 `git config [level] alias.alias-name "command-name"`,如：`git config --global alias.ci "commit"`
2. 获取所有别名 `git config [level] --get-regexp alias`


