import { CryptoKeys, RCryptSettings } from '../types';
import { decryptFilename, encryptFilename } from './filenameEngine';
import { deriveRcloneKeys } from './kdf';
import { decryptPayload, encryptPayload } from './payloadEngine';

export class RCryptEngine {
	private keys: CryptoKeys | null = null;
	private settings: RCryptSettings;

	constructor(settings: RCryptSettings) {
		this.settings = settings;
		if (settings.passphrase) {
			this.keys = deriveRcloneKeys(settings.passphrase, settings.salt);
		}
	}

	public updateSettings(settings: RCryptSettings): void {
		this.settings = settings;
		if (settings.passphrase) {
			this.keys = deriveRcloneKeys(settings.passphrase, settings.salt);
		} else {
			this.keys = null;
		}
	}

	public getKeys(customPassphrase?: string, customSalt?: string): CryptoKeys {
		if (customPassphrase !== undefined || customSalt !== undefined) {
			return deriveRcloneKeys(
				customPassphrase !== undefined ? customPassphrase : (this.settings.passphrase || ''),
				customSalt !== undefined ? customSalt : (this.settings.salt || '')
			);
		}
		if (!this.keys) {
			throw new Error(
				'No passphrase configured. Please enter a passphrase in Plugin Settings or prompt.'
			);
		}
		return this.keys;
	}

	/**
	 * Encrypt a file buffer.
	 */
	public encryptFile(
		plaintext: Uint8Array,
		customPassphrase?: string,
		customSalt?: string
	): Uint8Array {
		const keys = this.getKeys(customPassphrase, customSalt);
		return encryptPayload(plaintext, keys.dataKey);
	}

	/**
	 * Decrypt a file buffer.
	 */
	public decryptFile(
		ciphertext: Uint8Array,
		customPassphrase?: string,
		customSalt?: string
	): Uint8Array {
		const keys = this.getKeys(customPassphrase, customSalt);
		return decryptPayload(ciphertext, keys.dataKey);
	}

	/**
	 * Encrypt a single filename.
	 */
	public encryptName(
		filename: string,
		customPassphrase?: string,
		customSalt?: string
	): string {
		const keys = this.getKeys(customPassphrase, customSalt);
		return encryptFilename(
			filename,
			keys,
			this.settings.filenameEncryptionMode,
			this.settings.filenameEncoding
		);
	}

	/**
	 * Decrypt a single filename.
	 */
	public decryptName(
		encryptedName: string,
		customPassphrase?: string,
		customSalt?: string
	): string {
		const keys = this.getKeys(customPassphrase, customSalt);
		return decryptFilename(
			encryptedName,
			keys,
			this.settings.filenameEncryptionMode,
			this.settings.filenameEncoding
		);
	}

}
