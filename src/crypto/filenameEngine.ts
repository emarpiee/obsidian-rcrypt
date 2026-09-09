import { CryptoKeys, FilenameEncoding, FilenameEncryptionMode } from '../types';
import { EMECipher } from './eme';
import {
	decodeBase32,
	decodeBase32768,
	decodeBase64URL,
	encodeBase32,
	encodeBase32768,
	encodeBase64URL,
} from './encoders';

const OBFUSCATE_QUOTE = '!';

/**
 * 1:1 implementation of Rclone's cipher.obfuscateSegment algorithm.
 */
export function obfuscateSegment(plaintext: string, nameKey: Uint8Array): string {
	if (!plaintext) return '';

	// Calculate initial dir value from sum of UTF-16 code units % 256
	let dir = 0;
	for (let i = 0; i < plaintext.length; i++) {
		dir += plaintext.charCodeAt(i);
	}
	dir %= 256;

	let result = `${dir}.`;

	// Augment dir with sum of nameKey bytes
	for (let i = 0; i < nameKey.length; i++) {
		dir += nameKey[i];
	}

	for (let i = 0; i < plaintext.length; i++) {
		const code = plaintext.charCodeAt(i);

		if (code === OBFUSCATE_QUOTE.charCodeAt(0)) {
			result += '!!';
		} else if (code >= 0x30 && code <= 0x39) {
			// '0' - '9'
			const thisdir = (dir % 9) + 1;
			const newCode = 0x30 + ((code - 0x30 + thisdir) % 10);
			result += String.fromCharCode(newCode);
		} else if (
			(code >= 0x41 && code <= 0x5a) || // 'A' - 'Z'
			(code >= 0x61 && code <= 0x7a) // 'a' - 'z'
		) {
			const thisdir = (dir % 25) + 1;
			let pos = code - 0x41;
			if (pos >= 26) {
				pos -= 6;
			}
			pos = (pos + thisdir) % 52;
			if (pos >= 26) {
				pos += 6;
			}
			result += String.fromCharCode(0x41 + pos);
		} else if (code >= 0xa0 && code <= 0xff) {
			const thisdir = (dir % 95) + 1;
			const newCode = 0xa0 + ((code - 0xa0 + thisdir) % 96);
			result += String.fromCharCode(newCode);
		} else if (code >= 0x100) {
			const thisdir = (dir % 127) + 1;
			const base = code - (code % 256);
			const newCode = base + ((code - base + thisdir) % 256);
			result += String.fromCharCode(newCode);
		} else {
			result += plaintext[i];
		}
	}

	return result;
}

/**
 * 1:1 implementation of Rclone's cipher.deobfuscateSegment algorithm.
 */
export function deobfuscateSegment(ciphertext: string, nameKey: Uint8Array): string {
	if (!ciphertext) return '';

	const dotIdx = ciphertext.indexOf('.');
	if (dotIdx === -1) {
		throw new Error('Not an encrypted file (missing dot in obfuscated filename)');
	}

	const numStr = ciphertext.substring(0, dotIdx);
	const after = ciphertext.substring(dotIdx + 1);

	if (numStr === '!') {
		return after;
	}

	let dir = parseInt(numStr, 10);
	if (isNaN(dir)) {
		throw new Error('Not an encrypted file (invalid rotation prefix)');
	}

	for (let i = 0; i < nameKey.length; i++) {
		dir += nameKey[i];
	}

	let result = '';
	let inQuote = false;

	for (let i = 0; i < after.length; i++) {
		const code = after.charCodeAt(i);

		if (inQuote) {
			result += after[i];
			inQuote = false;
		} else if (code === OBFUSCATE_QUOTE.charCodeAt(0)) {
			inQuote = true;
		} else if (code >= 0x30 && code <= 0x39) {
			const thisdir = (dir % 9) + 1;
			let newCode = code - thisdir;
			if (newCode < 0x30) {
				newCode += 10;
			}
			result += String.fromCharCode(newCode);
		} else if (
			(code >= 0x41 && code <= 0x5a) ||
			(code >= 0x61 && code <= 0x7a)
		) {
			const thisdir = (dir % 25) + 1;
			let pos = code - 0x41;
			if (pos >= 26) {
				pos -= 6;
			}
			pos -= thisdir;
			if (pos < 0) {
				pos += 52;
			}
			if (pos >= 26) {
				pos += 6;
			}
			result += String.fromCharCode(0x41 + pos);
		} else if (code >= 0xa0 && code <= 0xff) {
			const thisdir = (dir % 95) + 1;
			let newCode = code - thisdir;
			if (newCode < 0xa0) {
				newCode += 96;
			}
			result += String.fromCharCode(newCode);
		} else if (code >= 0x100) {
			const thisdir = (dir % 127) + 1;
			const base = code - (code % 256);
			let newCode = code - thisdir;
			if (newCode < base) {
				newCode += 256;
			}
			result += String.fromCharCode(newCode);
		} else {
			result += after[i];
		}
	}

	return result;
}

/**
 * Encrypt a filename matching Rclone spec.
 */
export function encryptFilename(
	filename: string,
	keys: CryptoKeys,
	mode: FilenameEncryptionMode,
	encoding: FilenameEncoding
): string {
	if (mode === 'off') {
		return filename;
	}

	if (mode === 'obfuscate') {
		return obfuscateSegment(filename, keys.nameKey);
	}

	// Standard EME mode (AES-256-EME with PKCS7 padding matching Rclone)
	const rawBytes = new TextEncoder().encode(filename);
	const padLen = 16 - (rawBytes.length % 16);
	const padded = new Uint8Array(rawBytes.length + padLen);
	padded.set(rawBytes);
	padded.fill(padLen, rawBytes.length);

	const eme = new EMECipher(keys.nameKey);
	const encrypted = eme.encrypt(keys.nameTweak, padded);

	return encodeFilenameBytes(encrypted, encoding);
}

/**
 * Decrypt a filename matching Rclone spec.
 */
export function decryptFilename(
	encryptedName: string,
	keys: CryptoKeys,
	mode: FilenameEncryptionMode,
	encoding: FilenameEncoding
): string {
	if (mode === 'off') {
		return encryptedName;
	}

	if (mode === 'obfuscate') {
		return deobfuscateSegment(encryptedName, keys.nameKey);
	}

	// Standard EME mode
	const bytes = decodeFilenameBytes(encryptedName, encoding);
	const eme = new EMECipher(keys.nameKey);
	const decryptedPadded = eme.decrypt(keys.nameTweak, bytes);

	// Strip PKCS7 padding
	const padLen = decryptedPadded[decryptedPadded.length - 1];
	if (padLen < 1 || padLen > 16 || padLen > decryptedPadded.length) {
		throw new Error('Invalid EME padding');
	}
	const unpadded = decryptedPadded.subarray(0, decryptedPadded.length - padLen);
	return new TextDecoder('utf-8', { fatal: true }).decode(unpadded);
}

function encodeFilenameBytes(
	data: Uint8Array,
	encoding: FilenameEncoding
): string {
	switch (encoding) {
		case 'base64':
			return encodeBase64URL(data);
		case 'base32768':
			return encodeBase32768(data);
		case 'base32':
		default:
			return encodeBase32(data);
	}
}

function decodeFilenameBytes(
	str: string,
	encoding: FilenameEncoding
): Uint8Array {
	switch (encoding) {
		case 'base64':
			return decodeBase64URL(str);
		case 'base32768':
			return decodeBase32768(str);
		case 'base32':
		default:
			return decodeBase32(str);
	}
}
