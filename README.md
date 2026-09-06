# Obsidian Rclone Crypt (`obsidian-rcrypt`)

Client-side file and folder encryption for [Obsidian](https://obsidian.md), fully compatible with official [Rclone Crypt](https://rclone.org/crypt/).

`obsidian-rcrypt` runs 100% offline using standard web cryptography primitives (`@noble/ciphers` and `@noble/hashes`). It requires no local `rclone` binary installation and runs on desktop and mobile platforms (Android, iOS, macOS, Windows, Linux).

---

## Features

- **Rclone 1:1 Compatibility**: Files encrypted inside Obsidian can be mounted or extracted directly with Rclone CLI (`rclone cat`, `rclone mount`, `rclone copy`).
- **Crypt Profile Manager**: Create and manage multiple profiles with distinct passphrases, salts, filename encryption modes, and encodings.
- **Native Context Submenus**: Right-click notes, media, or folders to encrypt/decrypt using the active profile, a specific profile, or custom credentials.
- **Filename Encryption Modes**:
  - **Standard** (AES-256-EME with PKCS#7 padding)
  - **Obfuscate** (Rclone character-rotation cipher)
  - **Off** (Plaintext filenames with optional file extension suffix)
- **Automatic Fallback Handling**: Decryption gracefully handles unencrypted or already decrypted files within bulk operations.
- **Internationalization (i18n)**: Multilingual UI support with automatic locale matching and RTL language handling.

---

## Technical Specifications

| Component | Implementation |
| :--- | :--- |
| **Key Derivation** | `scrypt` (`N=16384`, `r=8`, `p=1`) deriving 64-byte key (32-byte data key, 32-byte name key) |
| **Payload Cipher** | `NaCl SecretBox` (XSalsa20-Poly1305) in 64 KiB blocks with 16-byte Poly1305 MAC tags |
| **Header Format** | 8-byte magic header (`RCLONE\x00\x00`) followed by 24-byte initial nonce |
| **Password Storage** | Passphrases and salts stored obscured in `data.json` using Rclone `obscure` standard |

---

## Usage

### 1. Configure Crypt Profiles
1. Go to **Obsidian Settings** -> **Rclone Crypt**.
2. Select or create a **Crypt Profile**.
3. Enter your **Passphrase** and **Salt** (corresponding to `password` and `password2` in your Rclone configuration).
4. Select your **Filename Encryption Mode** (`Standard`, `Obfuscate`, or `Off`) and **Filename Encoding** (`Base32` or `Base64`).

### 2. Encrypt & Decrypt via Context Menu
- Right-click any file, selection of files, or folder in Obsidian File Explorer.
- Open **Encrypt file** or **Decrypt file** from the context menu.
- Choose your target profile or select **Custom Passphrase...** to enter one-time credentials.

---

## Rclone CLI Compatibility

Files encrypted by `obsidian-rcrypt` can be decrypted directly using the Rclone CLI by setting up a `crypt` remote in `rclone.conf` with matching parameters:

- `password` and `password2` matching your profile's Passphrase and Salt.
- `filename_encryption` set to `standard`, `obfuscate`, or `off`.
- `filename_encoding` set to `base32` or `base64`.

---

## License

GPL-3.0 License

