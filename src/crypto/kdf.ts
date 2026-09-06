import { scrypt } from '@noble/hashes/scrypt.js';

import { CryptoKeys } from '../types';

// Rclone default salt if salt is empty: 16-byte fixed default salt array
export const DEFAULT_RCLONE_SALT = new Uint8Array([
	0xa8, 0x0d, 0xf4, 0x3a, 0x8f, 0xbd, 0x03, 0x08,
	0xa7, 0xca, 0xb8, 0x3e, 0x58, 0x1f, 0x86, 0xb1,
]);

/**
 * Derives Rclone 80-byte key (32 bytes dataKey + 32 bytes nameKey + 16 bytes nameTweak) using scrypt.
 * Rclone parameters: N=16384 (1 << 14), r=8, p=1, keyLen=80
 * Default salt fallback in rclone: defaultSalt bytes (if salt string is empty)
 */
export function deriveRcloneKeys(passphrase: string, salt: string): CryptoKeys {
	const saltBytes =
		salt.length > 0
			? new TextEncoder().encode(salt)
			: DEFAULT_RCLONE_SALT;

	if (!passphrase) {
		return {
			dataKey: new Uint8Array(32),
			nameKey: new Uint8Array(32),
			nameTweak: new Uint8Array(16),
		};
	}

	const derived = scrypt(
		new TextEncoder().encode(passphrase),
		saltBytes,
		{
			N: 16384,
			r: 8,
			p: 1,
			dkLen: 80,
		}
	);

	return {
		dataKey: derived.subarray(0, 32),
		nameKey: derived.subarray(32, 64),
		nameTweak: derived.subarray(64, 80),
	};
}

