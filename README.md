> [!NOTE]
WORK IN PROGRESS

# Obsidian RCrypt

Client-side file and folder encryption for [Obsidian](https://obsidian.md), fully compatible with official [Rclone Crypt](https://rclone.org/crypt/).

`obsidian-rcrypt` runs 100% offline using standard web cryptography primitives (`@noble/ciphers` and `@noble/hashes`). It requires no local `rclone` binary installation and runs on desktop and mobile platforms (Android, iOS, macOS, Windows, Linux).

---

## Features

- **Rclone 1:1 Compatibility**: Files encrypted inside Obsidian can be mounted or extracted directly with Rclone CLI (`rclone cat`, `rclone mount`, `rclone copy`).
- **Crypt Profile Manager**: Create and manage multiple profiles with distinct passphrases, salts, filename encryption modes, and encodings.
- **Dynamic Command Palette Integration**: Commands dynamically format with active profile names (e.g. `Encrypt specific file/folder (Standard)`) and update automatically when active profiles change.
- **Interactive Modals & Previews**: Live file/folder tree preview in passphrase modals, dynamic password visibility toggles, and context-sensitive profile configurations.
- **Native Context Submenus**: Right-click notes, media, or folders to encrypt/decrypt using the active profile, a specific profile, or custom credentials.
- **Filename Encryption Modes**:
  - **Standard** (AES-256-EME with PKCS#7 padding)
  - **Obfuscate** (Rclone character-rotation cipher)
  - **Off** (Plaintext filenames with optional file extension suffix)
- **Automatic Fallback & Decoupled Decryption**: Decryption handles unencrypted/already decrypted files in bulk operations and automatically strips suffixes based on file type.
- **Internationalization (i18n)**: Multilingual UI support across 10 languages with automatic locale matching and RTL language handling.

---

## Installation

### Option 1: Via BRAT (Recommended for pre-releases)
1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian-42-brat) in Obsidian (**Settings** -> **Community plugins** -> **Search for "BRAT"**).
2. Open BRAT settings and click **Add Beta plugin**.
3. Enter repository URL: `https://github.com/emarpiee/obsidian-rcrypt`
4. Click **Add Plugin** and enable **RCrypt** in Obsidian's Community Plugins list.

### Option 2: Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` (if available) from the latest [GitHub Release](https://github.com/emarpiee/obsidian-rcrypt/releases).
2. Create a directory named `obsidian-rcrypt` inside your vault's plugins folder (`<vault>/.obsidian/plugins/obsidian-rcrypt/`).
3. Move the downloaded files into `<vault>/.obsidian/plugins/obsidian-rcrypt/`.
4. Reload Obsidian and enable **RCrypt** under **Settings** -> **Community plugins**.

### Option 3: Building from Source
1. Clone the repository into your vault's plugins folder:
   ```bash
   cd /path/to/your/vault/.obsidian/plugins/
   git clone https://github.com/emarpiee/obsidian-rcrypt.git
   cd obsidian-rcrypt
   ```
2. Install dependencies & build:
   ```bash
   npm install
   npm run build
   ```
3. Run the health check before submitting pull requests:
   ```bash
   npm run health
   ```
4. Enable the plugin under **Settings** -> **Community plugins**.

---

## Technical Specifications

| Component | Implementation | Details |
| :--- | :--- | :--- |
| **Key Derivation** | `scrypt` | `N=16384`, `r=8`, `p=1` deriving 80 bytes (`dataKey`: bytes 0–31, `nameKey`: bytes 32–63, `nameTweak`: bytes 64–79) using passphrase and salt (defaults to Rclone 16-byte fixed default salt if salt is empty) |
| **Payload Cipher** | `NaCl SecretBox` | XSalsa20 stream cipher with Poly1305 MAC tags (16 bytes per 64 KiB block). 8-byte magic header (`RCLONE\x00\x00`) followed by 24-byte base nonce |
| **Filename Encryption** | `EME (AES-256)` / `Obfuscate` / `Off` | **Standard**: AES-256 EME wide-block cipher with `nameKey` & `nameTweak` & Base32/Base64.<br>**Obfuscate**: Rclone character rotation with 256-bit key.<br>**Off**: Plaintext with optional extension suffix |
| **On-Disk Password Security** | `AES-256-CTR Obscure` | AES-256 in CTR mode using Rclone's internal 256-bit fixed key and 16-byte random IV, serialized as URL-safe unpadded Base64 |

---

> [!WARNING]
> **Use at your own risk!**
> - **Data Loss Risk**: Encrypting files modifies their raw contents on disk. If you forget your password or salt, or if your credentials are misconfigured, your encrypted data **cannot** be recovered by anyone. Always maintain unencrypted backups of critical notes before encrypting.
> - **Obscured On-Disk Storage**: Enabling "Save password on disk" stores your obscured password in `data.json`. While obscured from direct text viewing, anyone with local read access to your `data.json` can reverse the official Rclone key to retrieve your plaintext password.
> - **RAM Memory Exposure**: When "Save password on disk" is disabled, passwords reside in RAM during your Obsidian session. Memory-dump attacks or unauthorized local processes with process-memory read permissions could inspect process RAM.
> - **Third-Party Sync Plugins**: If you sync your vault using third-party plugins or cloud storage services (Git, iCloud, Obsidian Sync), ensure you understand whether you are syncing unencrypted source files or encrypted files.
> - **Limitation of Liability**: The developer(s) of this plugin accept no legal responsibility or liability for any data loss, corruption, security breach, unauthorized access, or any consequences resulting from your use or misuse of this software. You are solely responsible for managing your credentials and backing up your data.
> - **No Warranty**: This software is provided "as is" without warranty of any kind, express or implied, under the MIT License.

### How On-Disk Password Storage Works (`data.json`)
When **Save password on disk** is enabled, passwords and salts are stored inside the plugin's `data.json` file in an encrypted/obscured format:
- **Encryption Scheme**: Implements Rclone's official `rclone obscure` algorithm.
- **Cipher Details**: The plaintext password or salt is encrypted using **AES-256 in Counter (CTR) mode** initialized with a 16-byte cryptographically secure random Initialization Vector (`IV`) generated per write operation.
- **Obscure Key**: Uses Rclone's internal fixed 256-bit key (`9c 93 5b 48 73 0a 55 4d 6b 5b 2b 32 7b 92 5c 7b ...`).
- **Formatting**: The 16-byte `IV` is prepended to the ciphertext, and the resulting payload is Base64 encoded (URL-safe, without trailing `=` padding).
- **Interoperability**: Passwords obscured by `obsidian-rcrypt` can be directly decoded using standard Rclone credential parameters and vice-versa.

> [!NOTE]
> While on-disk storage is encrypted/obscured so passwords cannot be read directly in plaintext by eye or simple text scrapers, any process or user with access to your `data.json` and the open-source Rclone key can reveal them. For maximum security, disable **Save password on disk** to use RAM-Only mode.

### RAM-Only Session Mode (Recommended)
- **Zero Disk Footprint**: When **Save password on disk** is disabled, both the **Password or pass phrase (for encryption)** and **Password or pass phrase (for salt)** remain strictly in volatile memory (RAM) during your active session.
- **Disk Wiping**: `data.json` retains an empty string `""` for credentials.
- **Automatic Session Purge**: Credentials in memory are automatically discarded when Obsidian closes, restarts, or unloads the plugin.
- **Manual Purge Command**: Run **Clear session password & salt from memory** from the Obsidian Command Palette (`Ctrl/Cmd + P`) at any time to immediately wipe all in-memory passwords and salts.

---

## Cryptographic Architecture & How Encryption Works

### 1. Key Derivation (scrypt)
From your entered **Password or pass phrase (for encryption)** and **Password or pass phrase (for salt)** (defaulting to Rclone's official 16-byte fixed default salt if empty), an 80-byte master key buffer is derived using `scrypt` with parameters:
- `N = 16384` (cost factor)
- `r = 8` (block size)
- `p = 1` (parallelization)
- `dataKey`: First 32 bytes (used for file payload encryption)
- `nameKey`: Second 32 bytes (used for filename EME encryption & obfuscation)
- `nameTweak`: Final 16 bytes (used for EME tweak cipher initialization)

### 2. File Payload Encryption (NaCl SecretBox / XSalsa20-Poly1305)
Every file encrypted by `obsidian-rcrypt` follows Rclone Crypt's binary structure:
1. **Header**: 8-byte magic header (`RCLONE\x00\x00`) + 24-byte random base `nonce`.
2. **Chunking**: The file plaintext is divided into 64 KiB (65,536 bytes) data blocks.
3. **Block Nonce & Cipher**: Each 64 KiB block is encrypted using `XSalsa20` with a nonce derived by incrementing the base nonce by block index, and authenticated with a 16-byte `Poly1305` MAC tag.
4. **Result**: Each encrypted 64 KiB block produces 65,552 bytes of ciphertext on disk.

### 3. Filename Encryption Modes
- **Standard (AES-256 EME Wide-Block Cipher)**:
  - Filenames are padded with PKCS#7 to a multiple of 16 bytes.
  - Encrypted with AES-256-EME (Encrypt-Mix-Encrypt wide-block mode) using `nameKey`.
  - Encoded to string using **Base32** (Rclone default unpadded lowercase) or **Base64** (URL-safe unpadded).
- **Obfuscate (Character Rotation)**:
  - A lightweight 256-bit key-based character rotation cipher designed by Rclone to obscure filenames while preserving file length and readable extensions.
- **Off**:
  - Filenames remain in plain unencrypted text with an optional append suffix (e.g. `.rcrypt`).

> [!NOTE]
> **Independent Content & Filename Decryption (Rclone Design Standard)**:
> In Rclone Crypt, key derivation derives two separate keys: `dataKey` (for file payload encryption) and `nameKey` (for filename encryption). Because payload decryption relies solely on `dataKey` derived from your passphrase and salt, file contents will successfully unlock whenever the passphrase and salt are correct—even if the Filename Encryption Mode or Filename Encoding is misconfigured. In such cases, the payload content decrypts properly, but the resulting filename or extension may appear scrambled until decrypted with matching filename settings.

---

## Usage

### 1. Configure Crypt Profiles
1. Go to **Obsidian Settings** -> **Rclone Crypt**.
2. Select or create a **Crypt Profile**.
3. Enter your **Password or pass phrase (for encryption)** and **Password or pass phrase (for salt)** (corresponding to `password` and `password2` in your Rclone configuration).
4. (Optional) Toggle **Save password on disk**. Leave disabled for maximum security.
5. Select your **Filename Encryption Mode** (`Standard`, `Obfuscate`, or `Off`) and **Filename Encoding** (`Base32` or `Base64`).

### 2. Encrypt & Decrypt via Context Menu
- Right-click any file, selection of files, or folder in Obsidian File Explorer.
- Open **Encrypt file** or **Decrypt file** from the context menu.
- Choose your target profile or select **Encrypt with custom passphrase...** to enter one-time credentials.

---

## Rclone CLI Compatibility

Files encrypted by `obsidian-rcrypt` can be decrypted directly using the Rclone CLI by setting up a `crypt` remote in `rclone.conf` with matching parameters:

- `password` and `password2` matching your profile's **Password or pass phrase (for encryption)** and **Password or pass phrase (for salt)**.
- `filename_encryption` set to `standard`, `obfuscate`, or `off`.
- `filename_encoding` set to `base32` or `base64`.

---

## Official Rclone References & Resources

For detailed specifications on Rclone's encryption standard and CLI operations, refer to the official Rclone documentation:

- [Rclone Crypt Documentation](https://rclone.org/crypt/) — Official overview of Rclone Crypt, configuration options, and parameters.
- [Rclone Crypt Technical Specification](https://rclone.org/crypt/#technical-specification) — Deep dive into Rclone key derivation (`scrypt`), block layout (`NaCl SecretBox`), and filename encryption modes.
- [Rclone Obscure Command](https://rclone.org/commands/rclone_obscure/) — Official documentation for the `rclone obscure` CLI tool.
- [Rclone Source Code (`backend/crypt`)](https://github.com/rclone/rclone/tree/master/backend/crypt) — Official Rclone Crypt Go implementation repository.
