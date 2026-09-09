# Obsidian RCrypt

[English](../README.md) | [简体中文](./README.zh-CN.md) | 繁體中文 | [Español](./README.es.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [עברית](./README.he.md)

---

[Obsidian](https://obsidian.md) 的客戶端檔案與資料夾加密外掛，與官方 [Rclone Crypt](https://rclone.org/crypt/) 標準完全相容。

`obsidian-rcrypt` 使用純 Web 密碼學原語（`@noble/ciphers` 和 `@noble/hashes`），100% 離線運行，無需安裝本地 `rclone` 二進位檔案，可在桌面和行動平台（Android、iOS、macOS、Windows、Linux）上無縫運行。

> **免責聲明**：本外掛為一個獨立的開源項目，非 [Rclone](https://rclone.org) 官方團隊開發，且與其無任何附屬或背書關係。

---

## 核心特性

- **1:1 Rclone 互通性**：在 Obsidian 中加密檔案，然後直接使用官方 Rclone CLI（`rclone cat`、`rclone mount`、`rclone copy`）解密或掛載。
- **加密設定檔管理**：設定多個帶有自訂密碼、鹽、檔名加密模式和編碼方式的加密設定檔。
- **右鍵選單與命令面板整合**：右鍵點擊筆記、附件或整個資料夾進行加密或解密。命令根據您的活動設定檔動態更新。
- **彈性的檔名模式**：支援**標準**（AES-256-EME）、**混淆**（Rclone 字元旋轉）和**關閉**（明文檔名，可選副檔名後綴）三種模式。
- **巢狀（多層）加密**：使用不同或相同的設定檔遞迴加密已經加密的檔案。解密時，智慧載荷字節檢測可通知您內部加密層依然存在。
- **僅 RAM 安全性與國際化**：預設情況下，憑證嚴格保存在揮發性記憶體中。完全支援 11 種語言，並自動適配 RTL 文字方向。

---

## 安裝方式

### 方式一：Obsidian 社群外掛商店
1. 開啟 Obsidian **設定** $\rightarrow$ **社群外掛**。
2. 點擊**瀏覽**，搜尋 **RCrypt**。
3. 點擊**安裝**，然後點擊**啟用**。

### 方式二：透過 BRAT（適用於預發布 / 測試版）
1. 在 Obsidian 中安裝 [BRAT](https://github.com/TfTHacker/obsidian-42-brat)（**設定** $\rightarrow$ **社群外掛** $\rightarrow$ 搜尋 **BRAT**）。
2. 開啟 BRAT 設定，點擊**新增 Beta 外掛**。
3. 輸入儲存庫位址：`https://github.com/emarpiee/obsidian-rcrypt`
4. 點擊**新增外掛**，並在社群外掛清單中啟用 **RCrypt**。

### 方式三：手動安裝
1. 從最新 [GitHub Release](https://github.com/emarpiee/obsidian-rcrypt/releases) 下載 `main.js`、`manifest.json` 和 `styles.css`（如有）。
2. 建立目錄 `<vault>/.obsidian/plugins/obsidian-rcrypt/`。
3. 將下載的檔案移入該目錄。
4. 重新啟動 Obsidian，並在**設定** $\rightarrow$ **社群外掛**中啟用 **RCrypt**。

### 方式四：從原始碼建置
```bash
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/emarpiee/obsidian-rcrypt.git
cd obsidian-rcrypt
npm install
npm run build
```

---

## 使用指南

### 1. 設定檔設定
1. 開啟 **Obsidian 設定** $\rightarrow$ **RCrypt**。
2. 建立或選擇一個**加密設定檔**。
3. 設定您的**密碼**和**鹽**（對應 `rclone.conf` 中的 `password` 和 `password2`）。
4. 選擇**檔名加密模式**（`標準`、`混淆`或`關閉`）。
   - 使用**標準**模式時：還需選擇**檔名編碼**（`Base32` *（預設）*、`Base64` 或 `Base32768`）。
   - 使用**關閉**模式時：設定**加密檔案後綴**（預設：`.bin`，與 Rclone 的 `--crypt-suffix` 預設值一致）。

### 2. 基本加密與解密
- **右鍵選單**：在 Obsidian 檔案管理器中右鍵點擊任意檔案、多個檔案或資料夾，選擇**加密**或**解密**。
- **命令面板**：按 `Ctrl/Cmd + P` 並搜尋 **RCrypt** 命令以處理活動檔案或特定路徑。

### 3. 巢狀（多層）加密工作流
- **新增外層**：右鍵點擊已加密的檔案或資料夾，選擇**加密**，選擇外層設定檔或輸入自訂憑證。
- **解除外層**：右鍵點擊多層加密檔案，使用外層設定檔的憑證選擇**解密**。
- **內層偵測**：解密外層後，`obsidian-rcrypt` 檢查輸出字節並提醒您：
  > 🔓 *已解密外層：已處理 1 個項目。偵測到內部加密層！*
- **解除內層**：右鍵點擊剩餘檔案，使用內層設定檔的憑證選擇**解密**以恢復明文。

> [!TIP]
> **多層加密的使用情境**：
> - **分級存取控制**：對機密筆記應用私人內層密碼，再用第二個外層設定檔進行備份保護。
> - **中繼資料混淆**：將以`關閉`或`混淆`模式加密的檔案包裹在外層`標準`設定檔中，以擾亂目錄結構和副檔名。

> [!CAUTION]
> 避免在兩次加密之間用文字編輯器開啟或修改原始二進位密文檔案，因為文字轉換會損毀二進位標頭結構（`RCLONE\x00\x00`）。

---

## 密碼學架構

| 原語 / 元件 | 實作方式 | 技術標準與參數 |
| :--- | :--- | :--- |
| **金鑰衍生** | `scrypt` | 衍生 80 字節金鑰緩衝區（`N=16384`，`r=8`，`p=1`）。分割為 `dataKey`（字節 0–31）、`nameKey`（字節 32–63）和 `nameTweak`（字節 64–79）。如為空，預設使用 Rclone 的 16 字節固定預設鹽。 |
| **載荷密碼** | `NaCl SecretBox` | XSalsa20 串流密碼，帶 Poly1305 MAC 標籤（每 64 KiB 區塊 16 字節）。前綴為 8 字節魔數標頭（`RCLONE\x00\x00`）和 24 字節基礎 nonce。 |
| **檔名加密** | `EME (AES-256)` / `混淆` / `關閉` | **標準**：AES-256 EME 寬區塊密碼，使用 PKCS#7 填充，採用 `nameKey` 和 `nameTweak`（`Base32`、`Base64` 或 `Base32768`）。**混淆**：Rclone 字元旋轉密碼。**關閉**：明文，可選副檔名後綴。 |
| **多層加密** | `多重 XSalsa20` | 與 Rclone CLI 匹配的遞迴字節級載荷包裹。智慧字節檢查在解密後偵測內層 `RCLONE\x00\x00` 標頭。 |
| **磁碟憑證儲存** | `AES-256-CTR 混淆` | AES-256 CTR 模式，使用 Rclone 內部固定 256 位元金鑰和隨機 16 字節 IV（Base64 URL 安全）。 |

---

## 安全模型與免責聲明

### 僅 RAM 工作階段儲存（推薦）
- **零磁碟佔用**：停用**將密碼儲存到磁碟**時，密碼和鹽嚴格保存在揮發性記憶體（RAM）中。
- **自動清除**：Obsidian 關閉、重新啟動或解除安裝外掛時，RAM 中的憑證將自動清除。
- **手動清除**：從命令面板（`Ctrl/Cmd + P`）執行**從記憶體中清除工作階段密碼與鹽**，立即清除憑證。

### 磁碟混淆儲存（`data.json`）
- 啟用**將密碼儲存到磁碟**後，憑證使用 Rclone 的 `rclone obscure` 演算法加密。
- *安全說明*：混淆後的密碼可防止隨意查看，但任何能存取本地磁碟 `data.json` 的人以及知道開源 Rclone 金鑰的人都可以還原。如需最高安全性，請使用僅 RAM 模式。

> [!WARNING]
> **重要警告與責任限制**：
> - **不可恢復的資料遺失**：加密操作直接作用於磁碟檔案。如果憑證遺失或設定錯誤，**任何人都無法恢復**資料。請務必保留關鍵筆記的未加密備份。
> - **多層解密順序**：巢狀檔案的解密**必須**嚴格按照逆序（外層 $\rightarrow$ 內層）進行。任何中間層的憑證遺失都會永久鎖定所有內層內容。
> - **第三方庫同步**：請驗證您的同步解決方案（Obsidian Sync、Git、iCloud）同步的是明文原始檔案還是加密輸出。
> - **無擔保**：依據 MIT 授權「按原樣」提供，不附帶任何形式的擔保。開發者對因使用導致的資料遺失或損毀不承擔任何責任。

---

## 官方參考與資源
- [Rclone Crypt 文件](https://rclone.org/crypt/) — 官方設定概覽和 CLI 使用說明。
- [Rclone 技術規範](https://rclone.org/crypt/#technical-specification) — scrypt 金鑰衍生和區塊佈局的深度解析。
- [Rclone Obscure 命令](https://rclone.org/commands/rclone_obscure/) — `rclone obscure` CLI 工具文件。
- [Rclone 原始碼（`backend/crypt`）](https://github.com/rclone/rclone/tree/master/backend/crypt) — 官方 Go 實作儲存庫。
