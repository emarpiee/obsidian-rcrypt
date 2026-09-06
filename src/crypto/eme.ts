import { ecb } from '@noble/ciphers/aes.js';

function doubleGF128(input: Uint8Array): Uint8Array {
	const output = new Uint8Array(16);
	let carry = 0;
	for (let i = 15; i >= 0; i--) {
		const byte = input[i];
		output[i] = ((byte << 1) | carry) & 0xff;
		carry = (byte & 0x80) ? 1 : 0;
	}
	if (carry) {
		output[15] ^= 0x87;
	}
	return output;
}

function xorBuffers(a: Uint8Array, b: Uint8Array): Uint8Array {
	const res = new Uint8Array(a.length);
	for (let i = 0; i < a.length; i++) {
		res[i] = a[i] ^ b[i];
	}
	return res;
}

export class EMECipher {
	private key: Uint8Array;

	constructor(key: Uint8Array) {
		if (key.length !== 32) {
			throw new Error('EME requires a 32-byte AES key');
		}
		this.key = key;
	}

	private aesEncrypt(block: Uint8Array): Uint8Array {
		return new Uint8Array(ecb(this.key, { disablePadding: true }).encrypt(block));
	}

	private aesDecrypt(block: Uint8Array): Uint8Array {
		return new Uint8Array(ecb(this.key, { disablePadding: true }).decrypt(block));
	}

	encrypt(tweak: Uint8Array, data: Uint8Array): Uint8Array {
		if (data.length % 16 !== 0 || data.length === 0 || data.length > 16 * 256) {
			throw new Error(`EME data length must be a non-zero multiple of 16 bytes up to 4096 bytes (got ${data.length})`);
		}
		if (tweak.length !== 16) {
			throw new Error('EME tweak must be 16 bytes');
		}

		const m = data.length / 16;
		const P: Uint8Array[] = [];
		for (let i = 0; i < m; i++) {
			P.push(data.subarray(i * 16, (i + 1) * 16));
		}

		const L = this.aesEncrypt(new Uint8Array(16));
		const LTable: Uint8Array[] = [L];
		for (let i = 1; i <= m; i++) {
			LTable.push(doubleGF128(LTable[i - 1]));
		}

		const PP: Uint8Array[] = [];
		const PPP: Uint8Array[] = [];
		let C = new Uint8Array(16);

		for (let i = 0; i < m; i++) {
			const tmp = xorBuffers(P[i], LTable[i + 1]);
			const encryptedTmp = xorBuffers(this.aesEncrypt(tmp), LTable[i + 1]);
			PP.push(encryptedTmp);
			C = new Uint8Array(xorBuffers(C, encryptedTmp));
		}

		const M = xorBuffers(C, tweak);
		const CCC = this.aesEncrypt(M);

		let MC = new Uint8Array(16);
		for (let i = 0; i < m; i++) {
			if (i === 0) {
				MC = new Uint8Array(xorBuffers(CCC, M));
			} else {
				MC = new Uint8Array(doubleGF128(MC));
			}
			PPP.push(xorBuffers(PP[i], MC));
		}

		const result = new Uint8Array(data.length);
		for (let i = 0; i < m; i++) {
			const tmp = xorBuffers(PPP[i], LTable[i + 1]);
			const encrypted = xorBuffers(this.aesEncrypt(tmp), LTable[i + 1]);
			result.set(encrypted, i * 16);
		}

		return result;
	}

	decrypt(tweak: Uint8Array, data: Uint8Array): Uint8Array {
		if (data.length % 16 !== 0 || data.length === 0 || data.length > 16 * 256) {
			throw new Error(`EME data length must be a non-zero multiple of 16 bytes (got ${data.length})`);
		}
		if (tweak.length !== 16) {
			throw new Error('EME tweak must be 16 bytes');
		}

		const m = data.length / 16;
		const C: Uint8Array[] = [];
		for (let i = 0; i < m; i++) {
			C.push(data.subarray(i * 16, (i + 1) * 16));
		}

		const L = this.aesEncrypt(new Uint8Array(16));
		const LTable: Uint8Array[] = [L];
		for (let i = 1; i <= m; i++) {
			LTable.push(doubleGF128(LTable[i - 1]));
		}

		const PPP: Uint8Array[] = [];
		const PP: Uint8Array[] = [];
		let C_sum = new Uint8Array(16);

		for (let i = 0; i < m; i++) {
			const tmp = xorBuffers(C[i], LTable[i + 1]);
			const decryptedTmp = xorBuffers(this.aesDecrypt(tmp), LTable[i + 1]);
			PPP.push(decryptedTmp);
			C_sum = new Uint8Array(xorBuffers(C_sum, decryptedTmp));
		}

		const M = xorBuffers(C_sum, tweak);
		const CCC = this.aesDecrypt(M);

		let MC = new Uint8Array(16);
		for (let i = 0; i < m; i++) {
			if (i === 0) {
				MC = new Uint8Array(xorBuffers(CCC, M));
			} else {
				MC = new Uint8Array(doubleGF128(MC));
			}
			PP.push(xorBuffers(PPP[i], MC));
		}

		const result = new Uint8Array(data.length);
		for (let i = 0; i < m; i++) {
			const tmp = xorBuffers(PP[i], LTable[i + 1]);
			const decrypted = xorBuffers(this.aesDecrypt(tmp), LTable[i + 1]);
			result.set(decrypted, i * 16);
		}

		return result;
	}
}
