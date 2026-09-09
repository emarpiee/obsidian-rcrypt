# Obsidian RCrypt

[English](../README.md) | 简体中文 | [繁體中文](./README.zh-TW.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [עברית](./README.he.md)

---

[Obsidian](https://obsidian.md) 的客户端文件与文件夹加密插件，与官方 [Rclone Crypt](https://rclone.org/crypt/) 标准完全兼容。

`obsidian-rcrypt` 使用纯 Web 密码学原语（`@noble/ciphers` 和 `@noble/hashes`），100% 离线运行，无需安装本地 `rclone` 二进制文件，可在桌面和移动平台（Android、iOS、macOS、Windows、Linux）上无缝运行。

> **免责声明**：本插件为一个独立的开源项目，非 [Rclone](https://rclone.org) 官方团队开发，且与其无任何附属或背书关系。

---

## 核心特性

- **1:1 Rclone 互操作性**：在 Obsidian 中加密文件，然后直接使用官方 Rclone CLI（`rclone cat`、`rclone mount`、`rclone copy`）解密或挂载。
- **加密配置文件管理**：配置多个带有自定义密码、盐、文件名加密模式和编码方式的加密配置文件。
- **右键菜单与命令面板集成**：右键单击笔记、附件或整个文件夹进行加密或解密。命令根据您的活动配置文件动态更新。
- **灵活的文件名模式**：支持**标准**（AES-256-EME）、**混淆**（Rclone 字符旋转）和**关闭**（明文文件名，可选扩展名后缀）三种模式。
- **嵌套（多层）加密**：使用不同或相同的配置文件递归加密已经加密的文件。解密时，智能载荷字节检测可通知您内部加密层依然存在。
- **仅 RAM 安全性与国际化**：默认情况下，凭证严格保存在易失性内存中。完全支持 11 种语言，并自动适配 RTL 文字方向。

---

## 安装方式

### 方式一：Obsidian 社区插件商店
1. 打开 Obsidian **设置** $\rightarrow$ **社区插件**。
2. 点击**浏览**，搜索 **RCrypt**。
3. 点击**安装**，然后点击**启用**。

### 方式二：通过 BRAT（适用于预发布 / 测试版）
1. 在 Obsidian 中安装 [BRAT](https://github.com/TfTHacker/obsidian-42-brat)（**设置** $\rightarrow$ **社区插件** $\rightarrow$ 搜索 **BRAT**）。
2. 打开 BRAT 设置，点击 **添加 Beta 插件**。
3. 输入仓库地址：`https://github.com/emarpiee/obsidian-rcrypt`
4. 点击**添加插件**，并在社区插件列表中启用 **RCrypt**。

### 方式三：手动安装
1. 从最新 [GitHub Release](https://github.com/emarpiee/obsidian-rcrypt/releases) 下载 `main.js`、`manifest.json` 和 `styles.css`（如有）。
2. 创建目录 `<vault>/.obsidian/plugins/obsidian-rcrypt/`。
3. 将下载的文件移入该目录。
4. 重启 Obsidian，并在**设置** $\rightarrow$ **社区插件**中启用 **RCrypt**。

### 方式四：从源码构建
```bash
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/emarpiee/obsidian-rcrypt.git
cd obsidian-rcrypt
npm install
npm run build
```

---

## 使用指南

### 1. 配置文件设置
1. 打开 **Obsidian 设置** $\rightarrow$ **RCrypt**。
2. 创建或选择一个**加密配置文件**。
3. 设置您的**密码**和**盐**（对应 `rclone.conf` 中的 `password` 和 `password2`）。
4. 选择**文件名加密模式**（`标准`、`混淆`或`关闭`）。
   - 使用**标准**模式时：还需选择**文件名编码**（`Base32` *（默认）*、`Base64` 或 `Base32768`）。
   - 使用**关闭**模式时：设置**加密文件后缀**（默认：`.bin`，与 Rclone 的 `--crypt-suffix` 默认值一致）。

### 2. 基本加密与解密
- **右键菜单**：在 Obsidian 文件管理器中右键单击任意文件、多个文件或文件夹，选择**加密**或**解密**。
- **命令面板**：按 `Ctrl/Cmd + P` 并搜索 **RCrypt** 命令以处理活动文件或特定路径。

### 3. 嵌套（多层）加密工作流
- **添加外层**：右键单击已加密的文件或文件夹，选择**加密**，选择外层配置文件或输入自定义凭证。
- **解除外层**：右键单击多层加密文件，使用外层配置文件的凭证选择**解密**。
- **内层检测**：解密外层后，`obsidian-rcrypt` 检查输出字节并提醒您：
  > 🔓 *已解密外层：已处理 1 个项目。检测到内部加密层！*
- **解除内层**：右键单击剩余文件，使用内层配置文件的凭证选择**解密**以恢复明文。

> [!TIP]
> **多层加密的使用场景**：
> - **分级访问控制**：对机密笔记应用私人内层密码，再用第二个外层配置文件进行备份保护。
> - **元数据混淆**：将以 `关闭` 或 `混淆` 模式加密的文件包裹在外层 `标准` 配置文件中，以扰乱目录结构和扩展名。

> [!CAUTION]
> 避免在两次加密之间用文本编辑器打开或修改原始二进制密文文件，因为文本转换会损坏二进制头部结构（`RCLONE\x00\x00`）。

---

## 密码学架构

| 原语 / 组件 | 实现方式 | 技术标准与参数 |
| :--- | :--- | :--- |
| **密钥派生** | `scrypt` | 派生 80 字节密钥缓冲区（`N=16384`，`r=8`，`p=1`）。分割为 `dataKey`（字节 0–31）、`nameKey`（字节 32–63）和 `nameTweak`（字节 64–79）。如为空，默认使用 Rclone 的 16 字节固定默认盐。 |
| **载荷密码** | `NaCl SecretBox` | XSalsa20 流密码，带 Poly1305 MAC 标签（每 64 KiB 块 16 字节）。前缀为 8 字节魔数头（`RCLONE\x00\x00`）和 24 字节基础 nonce。 |
| **文件名加密** | `EME (AES-256)` / `混淆` / `关闭` | **标准**：AES-256 EME 宽块密码，使用 PKCS#7 填充，采用 `nameKey` 和 `nameTweak`（`Base32`、`Base64` 或 `Base32768`）。**混淆**：Rclone 字符旋转密码。**关闭**：明文，可选扩展名后缀。 |
| **多层加密** | `多重 XSalsa20` | 与 Rclone CLI 匹配的递归字节级载荷包裹。智能字节检查在解密后检测内层 `RCLONE\x00\x00` 头部。 |
| **磁盘凭证存储** | `AES-256-CTR 混淆` | AES-256 CTR 模式，使用 Rclone 内部固定 256 位密钥和随机 16 字节 IV（Base64 URL 安全）。 |

> [!NOTE]
> **内容与文件名独立解密**：
> 密钥派生会分别生成 `dataKey`（载荷）和 `nameKey`（文件名）缓冲区。只要密码和盐正确，文件内容随时可以解锁——即使文件名模式或编码设置不匹配。（文件名设置不匹配只会导致输出文件的扩展名或文件名看起来乱码。）

---

## 安全模型与免责声明

### 仅 RAM 会话存储（推荐）
- **零磁盘占用**：禁用**将密码保存到磁盘**时，密码和盐严格保存在易失性内存（RAM）中。
- **自动清除**：Obsidian 关闭、重启或卸载插件时，RAM 中的凭证将自动清除。
- **手动清除**：从命令面板（`Ctrl/Cmd + P`）执行**从内存中清除会话密码与盐**，立即清除凭证。

### 磁盘混淆存储（`data.json`）
- 启用**将密码保存到磁盘**后，凭证使用 Rclone 的 `rclone obscure` 算法加密。
- *安全说明*：混淆后的密码可防止随意查看，但任何能访问本地磁盘 `data.json` 的人以及知道开源 Rclone 密钥的人都可以还原。如需最高安全性，请使用仅 RAM 模式。

> [!WARNING]
> **重要警告与责任限制**：
> - **不可恢复的数据丢失**：加密操作直接作用于磁盘文件。如果凭证丢失或配置错误，**任何人都无法恢复**数据。请务必保留关键笔记的未加密备份。
> - **多层解密顺序**：嵌套文件的解密**必须**严格按照逆序（外层 $\rightarrow$ 内层）进行。任何中间层的凭证丢失都会永久锁定所有内层内容。
> - **第三方库同步**：请验证您的同步解决方案（Obsidian Sync、Git、iCloud）同步的是明文源文件还是加密输出。
> - **无担保**：依据 MIT 许可证"按原样"提供，不附带任何形式的担保。开发者对因使用导致的数据丢失或损坏不承担任何责任。

---

## 文件名加密模式与编码兼容性

在 Rclone Crypt 标准中，**文件名加密模式**（`filename_encryption`）和**文件名编码**（`filename_encoding`）是两个独立的配置项，具有特定的兼容性规则：

| 文件名加密模式 | 支持 `filename_encoding`？ | 描述 |
| :--- | :--- | :--- |
| **`standard`** | **是**（`base32`、`base64`、`base32768`） | 使用 AES-256 EME 宽块密码加密文件名字节。**需要编码方案**将二进制字节转换为字符串文件名。 |
| **`obfuscate`** | **否** *（Rclone CLI 忽略）* | 应用轻量字符旋转（`cipher.obfuscateSegment`）。直接操作字符串字符，因此字节编码不适用。 |
| **`off`** | **否** *（Rclone CLI 忽略）* | 文件名保持明文，并附加可配置的后缀（默认：`.bin`，与 Rclone 的 `--crypt-suffix` 默认值一致）。 |

#### 可用文件名编码（模式 = `standard` 时使用）：
- **`base32`** *（默认）*：无填充扩展十六进制 Base32（`0123456789abcdefghijklmnopqrstuv`）。适用于所有云存储和本地文件系统。
- **`base64`**：URL 安全无填充 Base64（`-` 和 `_`）。最适合区分大小写的云后端（Google Drive、S3）。
- **`base32768`**：紧凑 UTF-16 Base32768 编码。显著减少以 UTF-16 字符计数的云后端（OneDrive、Dropbox、Box）的文件名长度。

---

## Rclone CLI 兼容性

在 RCrypt 中加密的文件可以通过在 `rclone.conf` 中设置匹配的 `crypt` 远程，直接使用官方 Rclone CLI 访问或挂载：

```ini
[myvault]
type = crypt
remote = <path_to_vault_or_underlying_remote>
password = <your_obscured_passphrase>
password2 = <your_obscured_salt>
filename_encryption = <match_profile: standard | obfuscate | off>
# filename_encoding 仅在 filename_encryption = standard 时适用
filename_encoding = <base32 | base64 | base32768>
# suffix 仅在 filename_encryption = off 时适用（默认：.bin）
suffix = <match_profile: .bin or custom>
```

> [!IMPORTANT]
> **匹配您的配置文件设置**：
> `rclone.conf` 中的 `filename_encryption` 和 `filename_encoding` 值**必须与加密时使用的特定 RCrypt 配置文件设置一致**。

### 官方参考与资源
- [Rclone Crypt 文档](https://rclone.org/crypt/) — 官方配置概览和 CLI 使用说明。
- [Rclone 技术规范](https://rclone.org/crypt/#technical-specification) — scrypt 密钥派生和块布局的深度解析。
- [Rclone Obscure 命令](https://rclone.org/commands/rclone_obscure/) — `rclone obscure` CLI 工具文档。
- [Rclone 源代码（`backend/crypt`）](https://github.com/rclone/rclone/tree/master/backend/crypt) — 官方 Go 实现仓库。
