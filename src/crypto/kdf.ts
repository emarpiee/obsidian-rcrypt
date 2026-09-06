import { scrypt } from '@noble/hashes/scrypt.js';

import { CryptoKeys } from '../types';

/**
 * Derives Rclone 64-byte key (32 bytes dataKey + 32 bytes nameKey) using scrypt.
 * Rclone parameters: N=16384 (1 << 14), r=8, p=1, keyLen=64
 * Default salt fallback in rclone: "rclone" (if salt string is empty)
 */
export function deriveRcloneKeys(passphrase: string, salt: string): CryptoKeys {
	const effectiveSalt = salt.length > 0 ? salt : 'rclone';

	const derived = scrypt(
		new TextEncoder().encode(passphrase),
		new TextEncoder().encode(effectiveSalt),
		{
			N: 16384,
			r: 8,
			p: 1,
			dkLen: 64,
		}
	);

	return {
		dataKey: derived.subarray(0, 32),
		nameKey: derived.subarray(32, 64),
	};
}
