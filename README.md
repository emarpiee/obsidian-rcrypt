# Obsidian RCrypt

Client-side file and folder encryption for [Obsidian](https://obsidian.md), fully compatible with the official [Rclone Crypt](https://rclone.org/crypt/) standard.

`obsidian-rcrypt` runs 100% offline using pure web cryptography primitives (`@noble/ciphers` and `@noble/hashes`). It requires no local `rclone` binary installation and operates seamlessly across desktop and mobile platforms (Android, iOS, macOS, Windows, Linux).

---

## Key Features

- **1:1 Rclone Interoperability**: Encrypt files inside Obsidian and decrypt or mount them directly using the official Rclone CLI (`rclone cat`, `rclone mount`, `rclone copy`).
- **Crypt Profile Management**: Configure multiple encryption profiles with custom passphrases, salts, filename encryption modes, and encodings.
- **Context Menu & Palette Integration**: Right-click notes, attachments, or entire folders to encrypt or decrypt. Commands dynamically update based on your active profile.
- **Flexible Filename Modes**: Supports **Standard** (AES-256-EME), **Obfuscate** (Rclone character rotation), and **Off** (plaintext filenames with optional extension suffix).
- **Nested (Multi-Layer) Encryption**: Encrypt already-encrypted files recursively using different or matching profiles. Features smart payload byte inspection to notify you when inner encryption layers remain upon decryption.
- **RAM-Only Security & i18n**: Keeps credentials strictly in volatile memory by default. Fully localized across 11 languages with automatic RTL support.

---

## Installation

### Option 1: Official Obsidian Community Plugin Store
1. Open Obsidian **Settings** $\rightarrow$ **Community plugins**.
2. Click **Browse** and search for **RCrypt**.
3. Click **Install**, then click **Enable**.

### Option 2: Via BRAT (Recommended for Pre-releases / Beta Testing)
1. Install [BRAT](https://github.com/TfTHacker/obsidian-42-brat) in Obsidian (**Settings** $\rightarrow$ **Community plugins** $\rightarrow$ Search **BRAT**).
2. Open BRAT settings and click **Add Beta plugin**.
3. Enter repository URL: `https://github.com/emarpiee/obsidian-rcrypt`
4. Click **Add Plugin** and enable **RCrypt** in your Community Plugins list.

### Option 3: Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` (if available) from the latest [GitHub Release](https://github.com/emarpiee/obsidian-rcrypt/releases).
2. Create directory `<vault>/.obsidian/plugins/obsidian-rcrypt/`.
3. Move the downloaded release files into `<vault>/.obsidian/plugins/obsidian-rcrypt/`.
4. Reload Obsidian and enable **RCrypt** under **Settings** $\rightarrow$ **Community plugins**.

### Option 4: Build from Source
```bash
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/emarpiee/obsidian-rcrypt.git
cd obsidian-rcrypt
npm install
npm run build
```

---

## Usage Guide

### 1. Profile Configuration
1. Open **Obsidian Settings** $\rightarrow$ **Rclone Crypt**.
2. Create or select a **Crypt Profile**.
3. Set your **Passphrase** and **Salt** (corresponding to `password` and `password2` in `rclone.conf`).
4. Select your **Filename Encryption Mode** (`Standard`, `Obfuscate`, or `Off`) and **Filename Encoding** (`Base32` or `Base64`).

### 2. Basic Encryption & Decryption
- **Context Menu**: Right-click any file, selection of files, or folder in the Obsidian File Explorer and choose **Encrypt** or **Decrypt**.
- **Command Palette**: Press `Ctrl/Cmd + P` and search for **RCrypt** commands to process active files or specific paths.

### 3. Nested (Multi-Layer) Encryption Workflow
- **Adding Outer Layers**: Right-click an already-encrypted file or folder and select **Encrypt**. Choose an outer profile or enter custom credentials.
- **Unwrapping Outer Layer**: Right-click the multi-layer file and select **Decrypt** using the outer profile's credentials.
- **Inner Layer Detection**: Upon decrypting the outer layer, `obsidian-rcrypt` inspects output bytes and alerts you:
  > 🔓 *Decrypted outer layer for 1 item(s). Inner encryption layer detected!*
- **Unwrapping Inner Layer**: Right-click the remaining file and select **Decrypt** using the inner profile's credentials to restore plaintext.

> [!TIP]
> **Use Cases for Multi-Layer Encryption**:
> - **Tiered Access Control**: Apply a private inner passphrase for confidential notes, then wrap with a secondary outer profile for backup or secondary protection.
> - **Metadata Obfuscation**: Wrap files encrypted with `Off` or `Obfuscate` mode inside an outer `Standard` profile to scramble directory structure and extensions.

> [!CAUTION]
> Avoid opening or modifying raw binary ciphertext files in text editors between passes, as text conversion corrupts binary header structures (`RCLONE\x00\x00`).

---

## Cryptographic Architecture

| Primitive / Component | Implementation | Technical Standard & Parameters |
| :--- | :--- | :--- |
| **Key Derivation** | `scrypt` | Derives an 80-byte key buffer (`N=16384`, `r=8`, `p=1`). Split into `dataKey` (bytes 0–31), `nameKey` (bytes 32–63), and `nameTweak` (bytes 64–79). Defaults to Rclone's 16-byte fixed default salt if empty. |
| **Payload Cipher** | `NaCl SecretBox` | XSalsa20 stream cipher with Poly1305 MAC tags (16 bytes per 64 KiB block). Prefixed by an 8-byte magic header (`RCLONE\x00\x00`) and a 24-byte base nonce. |
| **Filename Encryption** | `EME (AES-256)` / `Obfuscate` / `Off` | **Standard**: AES-256 EME wide-block cipher padded with PKCS#7 using `nameKey` & `nameTweak` (Base32/Base64).<br>**Obfuscate**: Rclone character-rotation cipher.<br>**Off**: Plaintext with optional extension suffix. |
| **Multi-Layer Encryption** | `Multi-Pass XSalsa20` | Recursive byte-level payload wrapping matching Rclone CLI. Smart byte inspection detects inner `RCLONE\x00\x00` headers post-decryption. |
| **On-Disk Credential Store** | `AES-256-CTR Obscure` | AES-256 in CTR mode using Rclone's internal fixed 256-bit key and random 16-byte IV (Base64 URL-safe). |

> [!NOTE]
> **Independent Content & Filename Decryption**:
> Key derivation produces separate `dataKey` (payload) and `nameKey` (filename) buffers. File content unlocks whenever the passphrase and salt are correct—even if filename mode or encoding settings are mismatched. (Mismatched filename settings only cause the output file extension or filename to appear scrambled).

---

## Security Model & Disclaimers

### RAM-Only Session Storage (Recommended)
- **Zero Disk Footprint**: When **Save password on disk** is disabled, passphrases and salts reside strictly in volatile memory (RAM).
- **Automatic Purge**: Credentials in RAM are automatically wiped when Obsidian closes, restarts, or unloads the plugin.
- **Manual Purge**: Execute **Clear session password & salt from memory** from the Command Palette (`Ctrl/Cmd + P`) to wipe credentials instantly.

### On-Disk Obscured Storage (`data.json`)
- Enabling **Save password on disk** encrypts credentials using Rclone's `rclone obscure` algorithm.
- *Security Note*: Obscured passwords are protected against casual viewing, but anyone with local disk access to `data.json` and the open-source Rclone key can reverse them. Use RAM-Only mode for maximum security.

> [!WARNING]
> **Important Warnings & Limitation of Liability**:
> - **Irrecoverable Data Loss**: Encryption operates directly on disk files. If credentials are lost or misconfigured, data **cannot** be recovered by anyone. Always maintain unencrypted backups of critical notes.
> - **Multi-Layer Decryption Order**: Decryption of nested files **must** proceed in exact reverse order (Outer $\rightarrow$ Inner). Losing credentials for *any* intermediate layer permanently locks all inner contents.
> - **Third-Party Vault Sync**: Verify whether your sync solution (Obsidian Sync, Git, iCloud) is syncing plaintext source files or encrypted outputs.
> - **No Warranty**: Provided "as is" under the MIT License without warranty of any kind. Developers accept no liability for data loss or corruption resulting from use.

---

## Rclone CLI Compatibility

Files encrypted in Obsidian can be decrypted directly by Rclone CLI using a matching `rclone.conf` entry:

```ini
[myvault]
type = crypt
remote = /path/to/obsidian/vault
password = <your_obscured_passphrase>
password2 = <your_obscured_salt>
filename_encryption = standard
filename_encoding = base32
```

### Official References & Resources
- [Rclone Crypt Documentation](https://rclone.org/crypt/) — Official configuration overview and CLI usage.
- [Rclone Technical Specification](https://rclone.org/crypt/#technical-specification) — Deep dive into scrypt key derivation and block layout.
- [Rclone Obscure Command](https://rclone.org/commands/rclone_obscure/) — Documentation for the `rclone obscure` CLI tool.
- [Rclone Source Code (`backend/crypt`)](https://github.com/rclone/rclone/tree/master/backend/crypt) — Official Go implementation repository.
