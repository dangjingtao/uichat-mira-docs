---
title: 把 Ubuntu 装进 D 盘：从 Hyper-V、Tailscale 到 Docker 的完整工程现场
description: 记录一台 Windows 11 主机如何用 Hyper-V 在 D 盘建立长期 Ubuntu Docker 实验机，并完成网络、SSH、Tailscale、Docker Engine 与 XX-Net 代理闭环。
group: 工程现场
order: 10
date: 2026年7月27日
readTime: 14 分钟阅读
tags: Ubuntu | Hyper-V | Tailscale | Docker | XX-Net | Windows | 工程现场
author: tomz
writingMode: co-authored
writtenBy: mira
---

# 把 Ubuntu 装进 D 盘：从 Hyper-V、Tailscale 到 Docker 的完整工程现场

这篇不是一份“复制几条命令就结束”的云服务器教程，而是一次真实的本地工程记录。

起点很简单：我们需要一个稳定的 Linux 环境来跑长期 Docker 服务，又不想继续把 Windows、Docker Desktop、WSL、开发容器和业务应用叠成一座故障塔。更现实的约束是，系统和数据不能继续往 C 盘塞；机器有时使用代理，有时关闭代理；网络出口甚至可能来自手机 USB 共享；以后还需要把本地服务临时开放给外部演示。

最终落下来的结构是：

```text
Windows 11
└─ Hyper-V
   └─ D:\VMs\Ubuntu-Docker\
      └─ Ubuntu-Docker.vhdx
         ├─ Ubuntu Server 24.04 LTS
         ├─ OpenSSH
         ├─ Tailscale
         ├─ Docker Engine + Compose
         └─ 业务容器与持久化数据
```

这套方案没有让 Ubuntu 与 Windows 抢物理分区，也没有继续依赖 Docker Desktop。整个 Linux 系统、Docker 镜像、容器和数据库，都在 D 盘的一块动态扩展 VHDX 中。关掉虚拟机，它就是一组可迁移、可备份、可回滚的文件；启动虚拟机，它是一台真正的 Linux 主机。

## 为什么没有继续用 WSL 或 Windows Docker Desktop

WSL 和 Docker Desktop 很适合日常开发，但这次的目标不是“偶尔跑一个容器”，而是留下一台长期存在的本地服务器。我们需要：

- 与 Windows 文件系统、代理和开发工具相对隔离；
- 让 Docker 直接运行在原生 Linux 用户空间里；
- 所有数据明确落在 D 盘；
- 能做整机检查点和导出；
- 网络拓扑可控，后续能直接接入 Tailscale；
- 将来换论坛、数据库、搜索服务或本地 Agent Runtime 时，不用重新搭地基。

Hyper-V 虚拟机比 WSL 多占一点内存，但边界清楚得多。对长期服务而言，“多一层明确的机器”往往比“少一层但处处共享状态”更省心。

## 一、创建放在 D 盘的 Hyper-V 虚拟机

本次配置如下：

```text
名称：Ubuntu-Docker
代数：第 2 代
CPU：4 个虚拟处理器
内存：8192 MB 固定内存
虚拟硬盘：120 GB 动态扩展 VHDX
虚拟机目录：D:\VMs\Ubuntu-Docker\
安装介质：Ubuntu Server 24.04 LTS AMD64 ISO
```

“120 GB 动态扩展”不是立刻占用 120 GB。VHDX 会随着 Ubuntu、Docker 镜像和数据增长，120 GB 只是允许它增长到的上限。真正需要警惕的是长期堆积 Hyper-V 检查点：检查点会产生 `.avhdx` 差分盘，数量一多，才是悄悄吞掉磁盘空间的那位。

第 2 代虚拟机使用 UEFI。Ubuntu 在 Hyper-V 中启用安全启动时，安全启动模板要选择：

```text
Microsoft UEFI Certificate Authority
```

不是默认的 Windows 模板。创建完成后，再确认处理器数量、内存、虚拟硬盘路径和 ISO 挂载都正确。

<figure>
  <img src="/blog-assets/ubuntu-hyperv-tailscale-docker/vm-settings.svg" alt="Hyper-V 虚拟机硬件设置" />
  <figcaption>4 核、8 GB 内存和 D 盘 VHDX 是这台长期 Docker 实验机的基础配置。</figcaption>
</figure>

我们关闭了“自动检查点”，只在关键阶段手工创建：

```text
Ubuntu-Clean
Ubuntu-Docker-Ready
```

第一个用于保留纯净 Ubuntu，第二个用于保留 Tailscale 和 Docker 均已验收的状态。

## 二、Ubuntu Server 安装时的选择

启动 ISO 后，选择：

```text
Try or Install Ubuntu Server
Language: English
Keyboard: English (US)
Installation type: Ubuntu Server
Third-party drivers: 不勾选
```

不选 `minimized`。这台机器以后要承担 Docker、SSH 和故障排查，完整 Server 基础包比极限精简更实用。

代理页先留空。原因是 Windows 的 `127.0.0.1` 对 Ubuntu 虚拟机没有意义：虚拟机里的 `127.0.0.1` 指向虚拟机自己，不会神奇地穿到 Windows 代理。把一个会频繁开关的代理写死进安装器，也容易让 APT 在代理关闭时整体失效。

镜像源可以使用国内镜像，例如：

```text
https://mirrors.ustc.edu.cn/ubuntu/
```

不过这次真正的坑不在镜像源，而在 Hyper-V 的网络出口。

## 三、Default Switch 能拿到 IP，不代表能联网

最开始虚拟机通过 Hyper-V `Default Switch` 获得了 DHCP 地址，DNS 也能解析镜像域名，但 HTTPS 连接持续超时。换代理、关代理、重试镜像都没有解决。

这类现象很容易误导人：

```text
能拿到 IP
+ 能解析域名
≠ 能建立外网 TCP 连接
```

当前 Windows 的真实网络来自手机 USB 网络共享，对应物理网卡是 `Remote NDIS Compatible Device`。最终做法是在 Hyper-V 中创建一个外部虚拟交换机，直接绑定这张物理网卡，并保留：

```text
允许管理操作系统共享此网络适配器
```

然后把 Ubuntu 虚拟机的网卡从 `Default Switch` 改到这个外部交换机。

换完以后，安装器的镜像检查终于通过。测速并不快，但只要连接稳定，就不值得为了追求数字继续拆网络。Ubuntu Server 的主体在 ISO 中，安装阶段只需要拉取更新和附加包。

## 四、磁盘：LVM 要把空间真正分给根分区

存储页选择：

```text
Use an entire disk
Set up this disk as an LVM group
Encrypt：不勾选
```

这里的“整个磁盘”只指那块 D 盘上的虚拟 VHDX，不会格式化 Windows 的真实 D 盘。

Ubuntu 安装器可能只给根逻辑卷 `/` 分配大约一半空间，其余空间留在 LVM Volume Group 中。对 Docker 主机来说，这会制造一个很讨厌的假象：VHDX 明明有 120 GB，根分区却先在 50 多 GB 时告急。

因此我们把根逻辑卷扩到约 110 GB，给 LVM 留少量余量：

```text
/          约 110 GB
/boot      2 GB
/boot/efi  1 GB
剩余空间   数 GB
```

Docker 默认数据目录 `/var/lib/docker` 位于根分区。根分区不扩，后面拉几个大镜像、做几次构建，很快就会遇到“整块虚拟磁盘还有空间，但 Docker 已经写不进去”的荒诞现场。

账户配置示例：

```text
Your name: tomz
Server name: ubuntu-docker
Username: tomz
```

安装时勾选 `Install OpenSSH server`，其余 Featured Server Snaps 全部不选。Docker 后面使用官方 APT 仓库安装，不用 Snap 版本。

安装完成后弹出 ISO，再重启。若出现 `/cdrom` 无法卸载，不代表安装失败，只是虚拟 DVD 还挂着；在 Hyper-V 中移除 ISO 后按 Enter 即可。

## 五、第一次 SSH 登录和系统更新

在 Ubuntu 控制台查看局域网地址：

```bash
hostname -I
```

从 Windows PowerShell 登录：

```powershell
ssh tomz@<Ubuntu-局域网-IP>
```

首次连接输入 `yes`，再输入 Ubuntu 密码。Linux 终端输入密码时不会显示星号，也不会回显字符，这是正常行为。

登录后设置时区并更新系统：

```bash
sudo timedatectl set-timezone Asia/Shanghai
sudo apt update
sudo apt full-upgrade -y
sudo reboot
```

这些命令分别做了四件事：

- `timedatectl`：把系统时区切换到上海，日志时间与本地一致；
- `apt update`：刷新软件包索引，不会安装软件；
- `apt full-upgrade -y`：安装可用更新，并允许为解决依赖关系增删包；
- `reboot`：让内核和系统服务更新真正生效。

### Windows SSH 配置权限坑

这次 Windows OpenSSH 曾在真正发起连接之前报错，原因是：

```text
C:\Users\Administrator\.ssh\config
```

的所有者或 ACL 不符合 OpenSSH 要求。为了先完成连接，我们把配置文件临时移开：

```powershell
Rename-Item "$env:USERPROFILE\.ssh\config" "config.bad-acl"
```

它不是 Ubuntu 问题，也不是网络问题。看到 SSH 报错时先判断错误发生在“读取本地配置”还是“连接远端”，别一上来就重装服务端。

## 六、Tailscale 必须装在 Ubuntu 虚拟机里

Windows 已经有 Tailscale，并不等于 Ubuntu 自动加入 Tailnet。虚拟机是一台独立主机，应该在 Ubuntu 内直接安装 Tailscale：

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

第一条命令下载并执行 Tailscale 官方 Linux 安装脚本；第二条命令启动连接流程，并输出一个浏览器授权地址。用现有 Tailscale 账号完成授权后检查：

```bash
tailscale status
tailscale ip -4
systemctl is-active tailscaled
```

它们分别用于：

- 查看当前 Tailnet 中的设备和连接状态；
- 取得这台 Ubuntu 稳定的 `100.x.x.x` 地址；
- 确认 `tailscaled` 服务正在运行。

从此以后，Windows 不再依赖经常变化的 DHCP 地址，直接通过 Tailscale SSH：

```powershell
ssh tomz@<Ubuntu-Tailscale-IP>
```

局域网切换、手机共享重连、路由器重新分配地址，都不会改变这条管理入口。

### Serve 与 Funnel 的区别

当 Ubuntu 上已经有本地 Web 服务时，可以选择：

```bash
sudo tailscale serve --bg 80
```

只在 Tailnet 内共享本机 80 端口；或者：

```bash
sudo tailscale funnel --bg 80
```

通过 Tailscale 提供的 HTTPS 地址公开到互联网，适合短期演示。查看和关闭：

```bash
sudo tailscale funnel status
sudo tailscale funnel reset
```

Funnel 是演示入口，不是自动替你完成业务应用的域名、反向代理和安全配置。应用本身仍然需要正确识别外部 HTTPS、Host 和可信代理头。

## 七、安装官方 Docker Engine 与 Compose

我们没有安装 Docker Desktop，也没有使用 Ubuntu Snap 中的 Docker，而是使用 Docker 官方 APT 仓库。

先安装证书与下载工具：

```bash
sudo apt update
sudo apt install -y ca-certificates curl
```

创建 APT keyring 目录，下载 Docker 官方签名密钥：

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

命令作用：

- `install -d`：以指定权限创建目录；
- `curl -fsSL`：下载失败时返回非零状态，安静输出，并跟随重定向；
- `chmod a+r`：确保 APT 进程可以读取签名密钥。

添加 Docker 软件源：

```bash
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

这里动态读取 Ubuntu 发行版代号和 CPU 架构，避免把 `noble`、`amd64` 等值硬编码进脚本。

安装 Docker Engine、CLI、containerd、Buildx 与 Compose 插件：

```bash
sudo apt update
sudo apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin
```

把当前管理用户加入 `docker` 组：

```bash
sudo usermod -aG docker $USER
sudo systemctl enable --now docker
exit
```

`usermod -aG` 把当前用户追加到 Docker 组；`enable --now` 同时完成开机自启和立即启动。退出 SSH 再重新登录，是为了让新的组成员身份进入当前会话。

重新登录后验收：

```bash
docker compose version
systemctl is-active docker
docker run --rm hello-world
```

其中 `hello-world` 会完成完整链路：CLI 连接 Docker daemon、daemon 访问镜像仓库、下载镜像、创建容器、运行并自动删除容器。

## 八、Docker Hub 超时：代理要配给 daemon，不是当前终端

Docker 安装完成后，第一次 `hello-world` 失败：

```text
failed to resolve reference "docker.io/library/hello-world:latest"
registry-1.docker.io:443 i/o timeout
```

强制 IPv4 测试同样超时：

```bash
curl -4 -I --connect-timeout 15 https://registry-1.docker.io/v2/
```

这说明不是 Docker 服务坏了，而是 Ubuntu 无法直连 Docker Hub。

Windows 使用 XX-Net。关键是，执行镜像拉取的是 Docker daemon，而不是当前 Shell。只在终端里写：

```bash
export HTTPS_PROXY=...
```

不会自动改变 systemd 管理的 `dockerd` 网络出口。

### 1. 让 Ubuntu 访问 Windows 上的 XX-Net

在 XX-Net 中开启远程访问，确认实际 HTTP 或 Mixed 代理端口。本次使用的是 `8086`。Windows 防火墙放行该端口，并取得 Windows 自己的 Tailscale IPv4：

```powershell
tailscale ip -4
```

通过 Windows Tailscale IP 访问代理，比依赖会变化的 Wi-Fi、USB 共享或局域网地址更稳。

先从 Ubuntu 测试：

```bash
curl -x http://<Windows-Tailscale-IP>:8086 \
  -I \
  --connect-timeout 20 \
  https://registry-1.docker.io/v2/
```

返回：

```text
HTTP/1.1 401 Unauthorized
```

反而是成功。Docker Registry 的 `/v2/` 未认证访问本来就会返回 401；这证明代理链路已经到达目标服务。

### 2. 给 Docker systemd 服务配置代理

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d

sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf >/dev/null <<'EOF'
[Service]
Environment="HTTP_PROXY=http://<Windows-Tailscale-IP>:8086"
Environment="HTTPS_PROXY=http://<Windows-Tailscale-IP>:8086"
Environment="NO_PROXY=localhost,127.0.0.1,::1,100.64.0.0/10,192.168.0.0/16"
EOF
```

这里的 `NO_PROXY` 保证本机、Tailscale 网段和常见局域网请求不绕到代理服务器。

重新加载 systemd 配置并重启 Docker：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
sudo systemctl show --property=Environment docker
```

三条命令分别用于：

- 让 systemd 重新读取 unit 与 drop-in 文件；
- 让 Docker daemon 使用新的环境变量启动；
- 检查代理变量是否真的进入 Docker 服务，而不是只写在磁盘上。

最后再运行：

```bash
docker run --rm hello-world
```

XX-Net 关闭时，新的 Docker Hub 拉取会失败，但已经下载的镜像和正在运行的容器不会因此停止。这个边界比给整台 Ubuntu 写死全局代理更符合本次需求。

## 九、最终验收清单

完成后逐项检查：

```bash
# Ubuntu 系统与磁盘
hostnamectl
df -h /

# Tailscale
tailscale status
tailscale ip -4
systemctl is-active tailscaled

# Docker
docker version
docker compose version
systemctl is-active docker
docker run --rm hello-world

# 公网演示入口（使用时）
sudo tailscale funnel status
```

Windows 侧保留两个入口：

```powershell
# 稳定远程管理
ssh tomz@<Ubuntu-Tailscale-IP>

# 查看 Windows 自己的 Tailscale 地址，供 Ubuntu 访问 XX-Net
tailscale ip -4
```

最后在 Hyper-V 中创建手工检查点：

```text
Ubuntu-Docker-Ready
```

## 这次真正搭好的，不只是一个 Ubuntu

表面上，我们完成的是：在 D 盘安装 Ubuntu、装上 Tailscale，再让 Docker 成功跑出 `Hello from Docker!`。

真正重要的是，机器的边界终于清楚了：Windows 负责桌面、代理和 Hyper-V；Ubuntu 负责长期 Linux Runtime；Tailscale 提供稳定管理面与可选演示入口；Docker 负责业务隔离；D 盘 VHDX 承担整个运行环境的数据边界。

中间踩到的坑也都很典型：拿到 DHCP 不代表能出网，Windows 开着代理不代表虚拟机自动走代理，Shell 有代理不代表 Docker daemon 有代理，虚拟磁盘有 120 GB 不代表根逻辑卷已经拿到 120 GB。

工程里最危险的往往不是完全不通，而是“看起来已经通了一半”。

这台机器以后可以跑 Discourse、搜索服务、数据库、本地 Agent、自动化 Worker，甚至成为 Mira 的一个可回收执行环境。但在装任何上层应用之前，先把系统、网络、远程访问和容器运行时逐层验收，是这次现场最值得留下来的方法。

## 参考资料

- [Ubuntu Server：在 Hyper-V 上安装 Ubuntu](https://ubuntu.com/server/docs/how-to/virtualisation/ubuntu-on-hyper-v/)
- [Microsoft：Hyper-V 第 2 代虚拟机与安全启动](https://learn.microsoft.com/zh-cn/windows-server/virtualization/hyper-v/plan/should-i-create-a-generation-1-or-2-virtual-machine-in-hyper-v)
- [Tailscale：在 Linux 上安装](https://tailscale.com/docs/install/linux)
- [Tailscale：Serve](https://tailscale.com/docs/reference/tailscale-cli/serve)
- [Tailscale：Funnel](https://tailscale.com/docs/reference/tailscale-cli/funnel)
- [Docker：在 Ubuntu 上安装 Docker Engine](https://docs.docker.com/engine/install/ubuntu/)
- [Docker：配置 daemon 代理](https://docs.docker.com/engine/daemon/proxy/)
- [Docker：Linux 安装后的用户组与自启动配置](https://docs.docker.com/engine/install/linux-postinstall/)
