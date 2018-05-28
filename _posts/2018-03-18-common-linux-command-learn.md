---
title: "常见linux命令学习"
img: new-zealand.jpg # Add image post (optional)
date: 2018-03-18 19:00:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [LINUX]
---

# 文章目的

在学习了一些常见的 linux 命令后，觉得有必要把他们记录下来，就有了这文章，仅作为记录使用

1.  `ls` 列出当前目录内容,常用参数

    1.  `-l` 列出长数据串，包含文件属性与权限等
    2.  `-a` 全部文件，包含隐藏文件
    3.  `-d` 仅列出目录本身
    4.  `-R` 递归列出当前及子目录的所有文件
    5.  参数可组合使用，如`ls -lR`

2.  `mkdir dir-name` 新建目录
3.  `rmdir dir-name` 删除目录
4.  `rm file-name` 删除文件
    1.  `-f` force，忽略不存在的文件
    2.  `-i` 互动模式，在删除前会询问用户是否操作
    3.  `-r` 递归删除，最常用于目录删除，**它是一个非常危险的参数**
5.  `pwd` 显示当前目录路径
6.  `cp file-path target-folder-path` 拷贝
    1.  `-a` 将文件的特性一起复制
    2.  `-p` 连同文件的属性一起复制，而非默认方式，与`-a`类似，常用于备份
    3.  `-i`  若目标文件已经存在时，在覆盖时会先询问操作的进行
    4.  `-r` 递归持续的复制，**用于复制文件夹**
    5.  示范：`cp file1 file2 file3 dir` 把文件`file1、file2、file3、file4`复制到 dir 下
7.  `mv origin-path target-path` 移动文件/文件夹，也可以重命名
    1.  `-f` force 强制，不管目标文件是否存在
    2.  `-i` 若目标文件已存在，会进行询问
    3.  `-u` 若目标文件已存在，且比目标文件新，才会更新
8.  `cat file-path` 单纯查看文件内容. **通常可用管道与`more/less`一起使用，从而可以一页页查看数据**。 如`cat test.html | less`
9.  `tail [-n N] file-path` 查看文件的最后（默认 10 行）10 行内容。
10. `less file-path` 分页查看文件内容，使用`Ctrl+F`向下翻页，`Ctrl+B`向上翻页
11. `grep str path` 在文件/目录中搜索指定字符串，常常与管道操作符一起使用。

    ```
    grep [-acinv] [--color=auto] 'str-to-find' filename
    ```

    1.  `-a` 将 binary 文件以 text 文件方式查找数据
    2.  `-c` 计算找到目标字符串的次数
    3.  `-i` 忽略大小写
    4.  `-v` 反向选择，即选出不匹配的那些行
    5.  示范：
        1.  `grep --color 'MANPATH' /etc/man.config` 在 man.config 中找到 MANPATH
        2.  `ls -l | grep -i file`， 在`ls -l`的输出中查找 file 字符串

12. `find` 查找匹配的文件

    ```
    find [PATH] [option] [action]
    ```

    1.  与时间有关的参数

        1.  `-mtime n` : n 为数字，意思为在 n 天之前的“一天内”被更改过的文件
        2.  `-mtime +n` :  列出在 n 天之前（不含 n 天本身）被更改过的文件名；
        3.  `-mtime -n` :  列出在 n 天之内（含 n 天本身）被更改过的文件名；
        4.  `-newer file` :  列出比 file 还要新的文件名
        5.  例如： `find . -mtime 0`找出当前文件夹中今天之内有改动的文件

    2.  与文件权限及名称有关的参数
        1.  `-name filename` 找出文件名为 filename 的文件
        2.  `-size [+-]SIZE` 找出比 SIZE 大（+）或者小（-）的文件
        3.  `-perm mode` 找出权限刚好等于 mode 的文件，mode 用数字表示，如 0755
        4.  `-perm -mode` 找出权限必须全部包括 mode 的文件
        5.  `-perm +mode` 找出权限包括任一 mode 权限的文件

13. `exit` 结束当前终端的会话
14. `ping` 检测网络连接和服务器状态
15. `who` 获取当前登录用户名
16. `ps` 显示运行的进程

    1.  `-A` 所有的进程均显示出来
    2.  `-a` 不与 terminal 有关的所有进程
    3.  `-u` 有效用户的相关进程
    4.  `-x` 一般与 a 参数一起使用，列出较完整的信息
    5.  `-l`  较长，较详细地将 PID 的信息列出
    6.  常用的几个
        1.  `ps aux` #  查看系统所有的进程数据
        2.  `ps ax` #  查看不与 terminal 有关的所有进程
        3.  `ps -lA` #  查看系统所有的进程数据
        4.  `ps axjf` #  查看连同一部分进程树状态

17. `kill -signal PID` 常用语杀进程

    1.  `-signal`的常用参数
        1.  `1`，启动被终止的进程
        2.  `2` 中断程序，相当于 ctrl+c
        3.  `9` 强制中断
        4.  `15` 以正常结束进程方式来终止进程
        5.  `17` 暂停一个进程，相当于 ctrl+z
    2.  示范： `kill 9 133624`强制中断进程 id 为 133624 的程序. PID 可通过管道与 grep 命令筛选获得。如`ps aux | grep --color 133624`

18. `file filename`判断 filename 对应文件的基本数据。
19. `chmod [+-=] r|w|x file` 改变文件权限
    1.  `+` 加入权限
    2.  `-` 删除权限
    3.  `=` 设置权限
    4.  示范： `chmod +x todev`
20. `vim file` 用于文本编辑,如果存在就打开，**不存在就以该文件夹创建一个文件**
21. `touch [options] file` 用于修改文件时间戳或者, **创建一个不存在的文件**，如 `touch ./test.js`可以创建`test.js`
