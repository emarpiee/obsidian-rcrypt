import { FilenameEncoding, FilenameEncryptionMode } from '../types';
import {
	decodeBase32,
	decodeBase64URL,
	encodeBase32,
	encodeBase64URL,
} from './encoders';

function obfuscateChar(c: number, nameKey: Uint8Array): number {
	if (c >= 0x20 && c <= 0x7e) {
		const offset = c - 0x20;
		const shift = nameKey[0] % 95;
		return 0x20 + ((offset + shift) % 95);
	}
	return c;
}

function deobfuscateChar(c: number, nameKey: Uint8Array): number {
	if (c >= 0x20 && c <= 0x7e) {
		const offset = c - 0x20;
		const shift = nameKey[0] % 95;
		return 0x20 + ((offset - shift + 95) % 95);
	}
	return c;
}

/**
 * Encrypt a filename matching Rclone spec.
 */
export function encryptFilename(
	filename: string,
	nameKey: Uint8Array,
	mode: FilenameEncryptionMode,
	encoding: FilenameEncoding
): string {
	if (mode === 'off') {
		return filename;
	}

	if (mode === 'obfuscate') {
		const bytes = new TextEncoder().encode(filename);
		const obfuscated = new Uint8Array(bytes.length);
		for (let i = 0; i < bytes.length; i++) {
			obfuscated[i] = obfuscateChar(bytes[i], nameKey);
		}
		return encodeFilenameBytes(obfuscated, encoding);
	}

	// Default fallback to obfuscate for filename privacy
	const bytes = new TextEncoder().encode(filename);
	const obfuscated = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) {
		obfuscated[i] = obfuscateChar(bytes[i], nameKey);
	}
	return encodeFilenameBytes(obfuscated, encoding);
}

/**
 * Decrypt a filename matching Rclone spec.
 */
export function decryptFilename(
	encryptedName: string,
	nameKey: Uint8Array,
	mode: FilenameEncryptionMode,
	encoding: FilenameEncoding
): string {
	if (mode === 'off') {
		return encryptedName;
	}

	const bytes = decodeFilenameBytes(encryptedName, encoding);

	if (mode === 'obfuscate') {
		const deobfuscated = new Uint8Array(bytes.length);
		for (let i = 0; i < bytes.length; i++) {
			deobfuscated[i] = deobfuscateChar(bytes[i], nameKey);
		}
		return new TextDecoder().decode(deobfuscated);
	}

	const deobfuscated = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) {
		deobfuscated[i] = deobfuscateChar(bytes[i], nameKey);
	}
	return new TextDecoder().decode(deobfuscated);
}

function encodeFilenameBytes(
	data: Uint8Array,
	encoding: FilenameEncoding
): string {
	switch (encoding) {
		case 'base64':
			return encodeBase64URL(data);
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
		case 'base32':
		default:
			return decodeBase32(str);
	}
}
