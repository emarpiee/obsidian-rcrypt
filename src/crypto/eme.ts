import { ecb } from '@noble/ciphers/aes.js';

/**
 * multByTwo - GF(2^128) multiplication as specified in EME-32 spec & rfjakob/eme:
 * "Figure 4.1. C code for the multByTwo procedure"
 */
function multByTwo(out: Uint8Array, input: Uint8Array): void {
	if (input.length !== 16) {
		throw new Error('input length must be 16');
	}
	const tmp = new Uint8Array(16);

	tmp[0] = (2 * input[0]) & 0xff;
	if (input[15] >= 128) {
		tmp[0] ^= 135;
	}

	for (let j = 1; j < 16; j++) {
		tmp[j] = (2 * input[j]) & 0xff;
		if (input[j - 1] >= 128) {
			tmp[j] = (tmp[j] + 1) & 0xff;
		}
	}

	out.set(tmp);
}

function xorBuffers(a: Uint8Array, b: Uint8Array): Uint8Array {
	const res = new Uint8Array(a.length);
	for (let i = 0; i < a.length; i++) {
		res[i] = a[i] ^ b[i];
	}
	return res;
}

/**
 * EME (Encrypt-Mix-Encrypt / ECB-Mix-ECB) cipher mode matching rfjakob/eme (used by Rclone).
 */
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

	/**
	 * tabulateL - calculate L_i for messages up to length of m cipher blocks
	 * L_0 = 2 * AESenc(K; 0)
	 * L_i = 2 * L_{i-1}
	 */
	private tabulateL(m: number): Uint8Array[] {
		const eZero = new Uint8Array(16);
		const Li = this.aesEncrypt(eZero);

		const LTable: Uint8Array[] = [];
		for (let i = 0; i < m; i++) {
			multByTwo(Li, Li);
			LTable.push(new Uint8Array(Li));
		}
		return LTable;
	}

	private transform(tweak: Uint8Array, inputData: Uint8Array, isEncrypt: boolean): Uint8Array {
		if (inputData.length % 16 !== 0 || inputData.length === 0 || inputData.length > 16 * 128) {
			throw new Error(`EME data length must be a non-zero multiple of 16 bytes up to 2048 bytes (got ${inputData.length})`);
		}
		if (tweak.length !== 16) {
			throw new Error('EME tweak must be 16 bytes');
		}

		const m = inputData.length / 16;
		const C = new Uint8Array(inputData.length);
		const LTable = this.tabulateL(m);

		for (let j = 0; j < m; j++) {
			const Pj = inputData.subarray(j * 16, (j + 1) * 16);
			const xored = xorBuffers(Pj, LTable[j]);
			const res = isEncrypt ? this.aesEncrypt(xored) : this.aesDecrypt(xored);
			C.set(res, j * 16);
		}

		let MP = xorBuffers(C.subarray(0, 16), tweak);
		for (let j = 1; j < m; j++) {
			MP = xorBuffers(MP, C.subarray(j * 16, (j + 1) * 16));
		}

		const MC = isEncrypt ? this.aesEncrypt(MP) : this.aesDecrypt(MP);

		let M = xorBuffers(MP, MC);
		for (let j = 1; j < m; j++) {
			multByTwo(M, M);
			const CCCj = xorBuffers(C.subarray(j * 16, (j + 1) * 16), M);
			C.set(CCCj, j * 16);
		}

		let CCC1 = xorBuffers(MC, tweak);
		for (let j = 1; j < m; j++) {
			CCC1 = xorBuffers(CCC1, C.subarray(j * 16, (j + 1) * 16));
		}
		C.set(CCC1, 0);

		for (let j = 0; j < m; j++) {
			const block = C.subarray(j * 16, (j + 1) * 16);
			const res = isEncrypt ? this.aesEncrypt(block) : this.aesDecrypt(block);
			C.set(xorBuffers(res, LTable[j]), j * 16);
		}

		return C;
	}

	encrypt(tweak: Uint8Array, data: Uint8Array): Uint8Array {
		return this.transform(tweak, data, true);
	}

	decrypt(tweak: Uint8Array, data: Uint8Array): Uint8Array {
		return this.transform(tweak, data, false);
	}
}
