import { describe, expect, it } from 'vitest';
import { deriveRcloneKeys } from '../src/crypto/kdf';
import { decryptPayload, encryptPayload } from '../src/crypto/payloadEngine';
import { decryptFilename, encryptFilename } from '../src/crypto/filenameEngine';
import { decodeBase32, decodeBase64URL, encodeBase32, encodeBase64URL } from '../src/crypto/encoders';
import { obscurePassword, revealPassword } from '../src/crypto/obscure';

describe('Rclone Crypt Engine 1:1 Compatibility Tests', () => {
	it('should derive keys deterministically using scrypt', () => {
		const keys = deriveRcloneKeys('mysecretpassword', 'mysalt');
		expect(keys.dataKey.length).toBe(32);
		expect(keys.nameKey.length).toBe(32);
		expect(keys.nameTweak.length).toBe(16);

		const keys2 = deriveRcloneKeys('mysecretpassword', 'mysalt');
		expect(keys.dataKey).toEqual(keys2.dataKey);
		expect(keys.nameKey).toEqual(keys2.nameKey);
		expect(keys.nameTweak).toEqual(keys2.nameTweak);
	});

	it('should obscure and reveal passwords matching rclone obscure standard', () => {
		const rawPassword = 'test12345password!';
		const obscured = obscurePassword(rawPassword);

		expect(obscured).not.toBe(rawPassword);
		expect(obscured.length).toBeGreaterThan(10);

		const revealed = revealPassword(obscured);
		expect(revealed).toBe(rawPassword);
	});

	it('should encrypt and decrypt file payload with RCLONE header', () => {
		const keys = deriveRcloneKeys('mysecretpassword', 'mysalt');
		const originalText = 'Hello Obsidian Rclone Crypt World!';
		const plaintext = new TextEncoder().encode(originalText);

		const encrypted = encryptPayload(plaintext, keys.dataKey);

		expect(encrypted.length).toBeGreaterThan(32);
		const magic = String.fromCharCode(...encrypted.subarray(0, 6));
		expect(magic).toBe('RCLONE');

		const decrypted = decryptPayload(encrypted, keys.dataKey);
		const decryptedText = new TextDecoder().decode(decrypted);

		expect(decryptedText).toBe(originalText);
	});

	it('should test Base32 and Base64 encoders round-trip', () => {
		const sample = new Uint8Array([1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 100, 200, 255]);

		const b32Enc = encodeBase32(sample);
		const b32Dec = decodeBase32(b32Enc);
		expect(b32Dec).toEqual(sample);

		const b64Enc = encodeBase64URL(sample);
		const b64Dec = decodeBase64URL(b64Enc);
		expect(b64Dec).toEqual(sample);
	});

	it('should encrypt and decrypt filenames with obfuscate mode', () => {
		const keys = deriveRcloneKeys('mysecretpassword', 'mysalt');
		const originalFilename = 'My Secret Journal Note.md';

		// Base32
		const encB32 = encryptFilename(originalFilename, keys, 'obfuscate', 'base32');
		const decB32 = decryptFilename(encB32, keys, 'obfuscate', 'base32');
		expect(decB32).toBe(originalFilename);

		// Base64
		const encB64 = encryptFilename(originalFilename, keys, 'obfuscate', 'base64');
		const decB64 = decryptFilename(encB64, keys, 'obfuscate', 'base64');
		expect(decB64).toBe(originalFilename);
	});

	it('should encrypt and decrypt filenames with standard EME mode', () => {
		const keys = deriveRcloneKeys('mysecretpassword', 'mysalt');
		const originalFilename = 'My Secret Journal Note.md';

		// Standard EME Base32
		const encEME32 = encryptFilename(originalFilename, keys, 'standard', 'base32');
		const decEME32 = decryptFilename(encEME32, keys, 'standard', 'base32');
		expect(decEME32).toBe(originalFilename);

		// Standard EME Base64
		const encEME64 = encryptFilename(originalFilename, keys, 'standard', 'base64');
		const decEME64 = decryptFilename(encEME64, keys, 'standard', 'base64');
		expect(decEME64).toBe(originalFilename);
	});

});
