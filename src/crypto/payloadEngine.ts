import { xsalsa20poly1305 } from '@noble/ciphers/salsa.js';
import { randomBytes } from '@noble/ciphers/utils.js';

// Rclone Crypt Header magic string: "RCLONE\x00\x00" (8 bytes)
export const RCLONE_MAGIC = new Uint8Array([
	0x52, 0x43, 0x4c, 0x4f, 0x4e, 0x45, 0x00, 0x00,
]);

// Rclone Crypt Block sizes
export const FILE_BLOCK_SIZE = 64 * 1024; // 65,536 bytes unencrypted payload chunk
export const BLOCK_HEADER_SIZE = 16; // 16 bytes Poly1305 MAC tag
export const ENCRYPTED_BLOCK_SIZE = FILE_BLOCK_SIZE + BLOCK_HEADER_SIZE; // 65,552 bytes

/**
 * Increment 24-byte XSalsa20 nonce matching official Rclone cipher.nonce.increment (starts at byte index 0).
 */
export function incrementNonce(nonce: Uint8Array): Uint8Array {
	const result = new Uint8Array(nonce);
	for (let i = 0; i < 24; i++) {
		const digit = result[i];
		const newDigit = (digit + 1) & 0xff;
		result[i] = newDigit;
		if (newDigit !== 0) {
			break; // Exit loop if no overflow carry
		}
	}
	return result;
}

/**
 * Encrypt file buffer using 1:1 Rclone Crypt XSalsa20-Poly1305 block streaming format.
 */
export function encryptPayload(
	plaintext: Uint8Array,
	dataKey: Uint8Array
): Uint8Array {
	const initialNonce = new Uint8Array(randomBytes(24));
	let currentNonce = new Uint8Array(initialNonce);

	const chunks: Uint8Array[] = [RCLONE_MAGIC, initialNonce];

	let offset = 0;
	while (offset < plaintext.length) {
		const end = Math.min(offset + FILE_BLOCK_SIZE, plaintext.length);
		const chunk = plaintext.subarray(offset, end);

		const cipher = xsalsa20poly1305(dataKey, currentNonce);
		const encryptedChunk = cipher.encrypt(chunk);
		chunks.push(encryptedChunk);

		currentNonce = new Uint8Array(incrementNonce(currentNonce));
		offset = end;
	}

	// Calculate total output size
	const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
	const result = new Uint8Array(totalLen);

	let writeOffset = 0;
	for (const chunk of chunks) {
		result.set(chunk, writeOffset);
		writeOffset += chunk.length;
	}

	return result;
}

/**
 * Decrypt file buffer using 1:1 Rclone Crypt XSalsa20-Poly1305 format.
 */
export function decryptPayload(
	ciphertext: Uint8Array,
	dataKey: Uint8Array
): Uint8Array {
	if (ciphertext.length < 32) {
		throw new Error(
			'File too short to be an Rclone encrypted file (minimum 32 bytes required).'
		);
	}

	// Verify magic header "RCLONE\x00\x00"
	let isMagicValid = true;
	for (let i = 0; i < 8; i++) {
		if (ciphertext[i] !== RCLONE_MAGIC[i]) {
			isMagicValid = false;
			break;
		}
	}

	if (!isMagicValid) {
		let containsUtf8Replacement = false;
		for (let i = 0; i < ciphertext.length - 2; i++) {
			if (ciphertext[i] === 0xef && ciphertext[i + 1] === 0xbf && ciphertext[i + 2] === 0xbd) {
				containsUtf8Replacement = true;
				break;
			}
		}

		if (containsUtf8Replacement) {
			throw new Error(
				'Invalid Rclone header magic string. File was corrupted because raw binary ciphertext was opened and saved as text.'
			);
		}

		throw new Error(
			'Invalid Rclone header magic string. File is either not encrypted with Rclone or corrupted.'
		);
	}

	const initialNonce = ciphertext.subarray(8, 32);
	let currentNonce = new Uint8Array(initialNonce);

	const decryptedChunks: Uint8Array[] = [];
	let offset = 32;

	while (offset < ciphertext.length) {
		const end = Math.min(offset + ENCRYPTED_BLOCK_SIZE, ciphertext.length);
		const chunk = ciphertext.subarray(offset, end);

		const cipher = xsalsa20poly1305(dataKey, currentNonce);
		const decryptedChunk = cipher.decrypt(chunk);
		decryptedChunks.push(decryptedChunk);

		currentNonce = new Uint8Array(incrementNonce(currentNonce));
		offset = end;
	}

	const totalLen = decryptedChunks.reduce((acc, c) => acc + c.length, 0);
	const result = new Uint8Array(totalLen);

	let writeOffset = 0;
	for (const chunk of decryptedChunks) {
		result.set(chunk, writeOffset);
		writeOffset += chunk.length;
	}

	return result;
}
