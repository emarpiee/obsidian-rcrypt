import { execSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { deriveRcloneKeys } from '../src/crypto/kdf';
import { decryptFilename, encryptFilename } from '../src/crypto/filenameEngine';
import { decryptPayload, encryptPayload } from '../src/crypto/payloadEngine';
import { obscurePassword } from '../src/crypto/obscure';
import { CryptProfile, DEFAULT_PROFILE } from '../src/types';

function isRcloneAvailable(): boolean {
	try {
		execSync('rclone version', { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

const rcloneInstalled = isRcloneAvailable();

describe.runIf(rcloneInstalled)('Obsidian <-> Rclone CLI 1:1 Bidirectional Integration Tests', () => {
	it('should verify Obsidian-encrypted file & filename can be decrypted by Rclone CLI', () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-rcrypt-test-'));
		const plainDir = path.join(tempDir, 'plain');
		const encDir = path.join(tempDir, 'encrypted');
		const configPath = path.join(tempDir, 'temp_rclone.conf');

		fs.mkdirSync(plainDir);
		fs.mkdirSync(encDir);

		const password = 'TestIntegrationPassphrase123!';
		const salt = '';
		const profile: CryptProfile = {
			...DEFAULT_PROFILE,
			passphrase: password,
			salt: salt,
			filenameEncryptionMode: 'standard',
			filenameEncoding: 'base32',
			encryptedExtension: '.rcrypt',
		};

		const keys = deriveRcloneKeys(password, salt);
		const originalFilename = 'Secret Project Note.md';
		const originalText = '# Confidential Data\n\nThis text was encrypted inside Obsidian-RCrypt.';

		// 1. Encrypt using RCryptEngine (Obsidian logic)
		const encFilename = encryptFilename(originalFilename, keys, profile.filenameEncryptionMode, profile.filenameEncoding);
		const encBytes = encryptPayload(new TextEncoder().encode(originalText), keys.dataKey);

		// Standard Rclone crypt mode does not append .rcrypt to the EME-encrypted Base32 filename
		const encryptedFilePath = path.join(encDir, encFilename);
		fs.writeFileSync(encryptedFilePath, encBytes);

		// 2. Create isolated temporary rclone.conf (NEVER touching user config)
		const obscuredPass = execSync(`rclone obscure "${password}"`).toString().trim();
		const rcloneConfigContent = `
[local_backend]
type = alias
remote = ${encDir}

[rcrypt_remote]
type = crypt
remote = local_backend:
password = ${obscuredPass}
filename_encryption = standard
filename_encoding = base32
`;
		fs.writeFileSync(configPath, rcloneConfigContent);

		// 3. Use Rclone CLI to copy/decrypt from rcrypt_remote to plainDir
		execSync(`rclone copy --config "${configPath}" rcrypt_remote: "${plainDir}"`);

		// 4. Verify Rclone decrypted the exact filename and text content
		const decryptedFiles = fs.readdirSync(plainDir);
		expect(decryptedFiles).toContain(originalFilename);

		const decryptedContent = fs.readFileSync(path.join(plainDir, originalFilename), 'utf-8');
		expect(decryptedContent).toBe(originalText);

		// Cleanup
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	it('should verify Rclone CLI-encrypted file & filename can be decrypted by Obsidian RCryptEngine', () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-rcrypt-test-'));
		const sourcePlainDir = path.join(tempDir, 'source_plain');
		const encDir = path.join(tempDir, 'encrypted');
		const configPath = path.join(tempDir, 'temp_rclone.conf');

		fs.mkdirSync(sourcePlainDir);
		fs.mkdirSync(encDir);

		const password = 'AnotherSecretPassphrase789!';
		const salt = '';
		const profile: CryptProfile = {
			...DEFAULT_PROFILE,
			passphrase: password,
			salt: salt,
			filenameEncryptionMode: 'standard',
			filenameEncoding: 'base32',
			encryptedExtension: '.rcrypt',
		};

		const originalFilename = 'Rclone Exported Doc.md';
		const originalText = 'Created via Rclone CLI and decrypted inside Obsidian.';

		fs.writeFileSync(path.join(sourcePlainDir, originalFilename), originalText);

		// 1. Create isolated temporary rclone.conf
		const obscuredPass = execSync(`rclone obscure "${password}"`).toString().trim();
		const rcloneConfigContent = `
[local_backend]
type = alias
remote = ${encDir}

[rcrypt_remote]
type = crypt
remote = local_backend:
password = ${obscuredPass}
filename_encryption = standard
filename_encoding = base32
`;
		fs.writeFileSync(configPath, rcloneConfigContent);

		// 2. Encrypt using Rclone CLI
		execSync(`rclone copy --config "${configPath}" "${sourcePlainDir}" rcrypt_remote:`);

		// 3. Find encrypted file created by Rclone
		const encryptedFiles = fs.readdirSync(encDir);
		expect(encryptedFiles.length).toBe(1);

		const rawEncryptedFileName = encryptedFiles[0];

		// 4. Decrypt using RCryptEngine (Obsidian logic)
		const keys = deriveRcloneKeys(password, salt);
		const decFilename = decryptFilename(rawEncryptedFileName, keys, profile.filenameEncryptionMode, profile.filenameEncoding);
		expect(decFilename).toBe(originalFilename);

		const encFileBytes = new Uint8Array(fs.readFileSync(path.join(encDir, rawEncryptedFileName)));
		const decryptedBytes = decryptPayload(encFileBytes, keys.dataKey);
		const decryptedText = new TextDecoder().decode(decryptedBytes);

		expect(decryptedText).toBe(originalText);

		// Cleanup
		fs.rmSync(tempDir, { recursive: true, force: true });
	});
});
