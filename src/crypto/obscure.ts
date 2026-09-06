import { ctr } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';

// Rclone internal fixed 256-bit key for rclone obscure algorithm
// Key bytes matching official Go source backend/crypt/obscure.go:
const OBSCURE_KEY = new Uint8Array([
	0x9c, 0x93, 0x5b, 0x48, 0x73, 0x0a, 0x55, 0x4d,
	0x6b, 0x5b, 0x2b, 0x32, 0x7b, 0x92, 0x5c, 0x7b,
	0x92, 0x5c, 0x7b, 0x92, 0x5c, 0x7b, 0x92, 0x5c,
	0x7b, 0x92, 0x5c, 0x7b, 0x92, 0x5c, 0x7b, 0x92,
]);

/**
 * Obscure a plaintext password using official Rclone CTR-AES obscuring algorithm.
 */
export function obscurePassword(password: string): string {
	if (!password) return '';

	const plaintext = new TextEncoder().encode(password);
	const iv = new Uint8Array(randomBytes(16));

	const cipher = ctr(OBSCURE_KEY, iv);
	const ciphertext = cipher.encrypt(plaintext);

	const result = new Uint8Array(iv.length + ciphertext.length);
	result.set(iv, 0);
	result.set(ciphertext, iv.length);

	let binary = '';
	for (let i = 0; i < result.length; i++) {
		binary += String.fromCharCode(result[i]);
	}
	const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(result).toString('base64');
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Reveal an obscured password back to plaintext.
 */
export function revealPassword(obscured: string): string {
	if (!obscured) return '';

	try {
		let base64 = obscured.replace(/-/g, '+').replace(/_/g, '/');
		while (base64.length % 4 !== 0) {
			base64 += '=';
		}

		let rawBytes: Uint8Array;
		if (typeof atob !== 'undefined') {
			const binary = atob(base64);
			rawBytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				rawBytes[i] = binary.charCodeAt(i);
			}
		} else {
			rawBytes = new Uint8Array(Buffer.from(base64, 'base64'));
		}

		if (rawBytes.length < 16) {
			return obscured;
		}

		const iv = rawBytes.subarray(0, 16);
		const ciphertext = rawBytes.subarray(16);

		const cipher = ctr(OBSCURE_KEY, iv);
		const plaintext = cipher.decrypt(ciphertext);

		return new TextDecoder().decode(plaintext);
	} catch {
		return obscured;
	}
}
