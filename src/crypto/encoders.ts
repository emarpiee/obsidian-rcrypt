// Official Rclone Crypt Base32 encoding (Extended Hex Alphabet "0123456789abcdefghijklmnopqrstuv" unpadded)
const BASE32_HEX_ALPHABET = '0123456789abcdefghijklmnopqrstuv';

export function encodeBase32(data: Uint8Array): string {
	let bits = 0;
	let value = 0;
	let output = '';

	for (let i = 0; i < data.length; i++) {
		value = (value << 8) | data[i];
		bits += 8;
		while (bits >= 5) {
			output += BASE32_HEX_ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}

	if (bits > 0) {
		output += BASE32_HEX_ALPHABET[(value << (5 - bits)) & 31];
	}

	return output;
}

export function decodeBase32(str: string): Uint8Array {
	const cleanStr = str.toLowerCase().replace(/=+$/, '');
	let bits = 0;
	let value = 0;
	const bytes: number[] = [];

	for (let i = 0; i < cleanStr.length; i++) {
		const idx = BASE32_HEX_ALPHABET.indexOf(cleanStr[i]);
		if (idx === -1) {
			throw new Error(`Invalid Base32 character: "${cleanStr[i]}"`);
		}
		value = (value << 5) | idx;
		bits += 5;
		if (bits >= 8) {
			bytes.push((value >>> (bits - 8)) & 0xff);
			bits -= 8;
		}
	}

	return new Uint8Array(bytes);
}


export function encodeBase64URL(data: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < data.length; i++) {
		binary += String.fromCharCode(data[i]);
	}
	const base64 =
		typeof btoa !== 'undefined'
			? btoa(binary)
			: Buffer.from(data).toString('base64');
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase64URL(str: string): Uint8Array {
	let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
	while (base64.length % 4 !== 0) {
		base64 += '=';
	}
	if (typeof atob !== 'undefined') {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}
	return new Uint8Array(Buffer.from(base64, 'base64'));
}
