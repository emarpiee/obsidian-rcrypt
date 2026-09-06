# Obsidian Rclone Crypt (`obsidian-rcrypt`)

🔐 **1:1 Rclone Crypt** file and folder encryption for [Obsidian](https://obsidian.md). 

Designed to be **mobile-first**, **100% offline**, and **completely compatible** with the official [Rclone](https://rclone.org/crypt/) CLI.

---

## ✨ Key Features

- **1:1 Official Rclone Crypt Specification**: Encrypt files in Obsidian and seamlessly decrypt them on your server or desktop using official `rclone cat` or `rclone mount`.
- **Right-Click Context Menu**: Encrypt or decrypt single notes, media files, full folders, or bulk multi-file selections directly from Obsidian's File Explorer.
- **Mobile Friendly & 100% Offline**: Built with pure WebCrypto / TypeScript libraries (`@noble/hashes` & `@noble/ciphers`). No `rclone` binary installation is required on iOS, Android, macOS, Windows, or Linux.
- **Zero-Trace Quick View**: Right-click any `.rcrypt` file and choose **"Safe View Encrypted File (In-Memory)"** to preview notes or text in memory without writing unencrypted data to your device's disk.
- **Flexible Passphrase Modes**:
  - **Unified Master Passphrase**: Set your vault passphrase & salt once in Settings for 1-click context menu actions.
  - **Custom Passphrase Option**: Right-click -> **"Encrypt with Custom Passphrase..."** for per-file or per-folder password overrides.

---

## 🛠️ How It Works (Cryptographic Architecture)

`obsidian-rcrypt` implements Rclone's exact cryptographic specifications:

1. **Key Derivation Function (KDF)**:
   - Uses `scrypt` with Rclone parameters (`N=16384`, `r=8`, `p=1`) to derive a 64-byte key (32 bytes `dataKey` + 32 bytes `nameKey`) from your **Passphrase** and **Salt** (`password2`).
2. **File Payload Encryption**:
   - Files are encrypted using **NaCl SecretBox (`XSalsa20-Poly1305`)** in authenticated 64 KiB chunks.
   - Every file starts with the official Rclone 8-byte magic header `RCLONE\x00\x00` followed by a random 24-byte nonce.
3. **Filename Privacy**:
   - Supports `obfuscate` (character shift rotation) and `off` modes with standard text encodings (`base32` and `base64`).

---

## 🚀 Usage Guide

### 1. Plugin Configuration
1. Open **Obsidian Settings** -> **Rclone Crypt Settings**.
2. Enter your **Default Passphrase** and **Default Salt** (matching your `rclone.conf` credentials).
3. Set your preferred **Encrypted File Suffix** (default: `.rcrypt`).
4. Toggle **Auto-Delete Source File** to automatically clean up unencrypted originals after successful encryption.

### 2. Encrypting & Decrypting Files
- **To Encrypt**: Right-click any file or folder in Obsidian -> click **"Encrypt (Rclone Crypt)"**.
- **To Decrypt**: Right-click an encrypted `.rcrypt` file or folder -> click **"Decrypt (Rclone Crypt)"**.
- **To Safe-Preview**: Right-click an encrypted `.rcrypt` file -> click **"Safe View Encrypted File (In-Memory)"**.

---

## 📖 Rclone Interoperability Guide

Files encrypted with `obsidian-rcrypt` can be decrypted anywhere using the official Rclone CLI.

### Sample `rclone.conf` setup:

```ini
[myvault]
type = crypt
remote = /path/to/your/obsidian/vault
password = your_obscured_password
password2 = your_obscured_salt
filename_encryption = obfuscate
```

### Inspecting an encrypted note via Rclone CLI:

```bash
# Stream and decrypt directly in terminal:
rclone cat myvault:SecretNote.md.rcrypt

# Or mount your encrypted vault folder as a drive:
rclone mount myvault: /mnt/secretvault
```

---

## 🔒 Security Best Practices

> [!WARNING]
> **Backup Your Passphrase & Salt!** 
> Rclone Crypt uses zero-knowledge encryption. If you lose your passphrase or salt, your encrypted files **cannot be recovered by anyone**.

> [!TIP]
> **Custom Salt Recommended**: Leaving your salt blank or set to `"rclone"` uses Rclone's fallback default. Setting a custom salt in settings provides maximum protection against rainbow table attacks.

---

## 📄 License

GPL-3.0 License
