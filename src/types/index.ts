export type FilenameEncryptionMode = 'standard' | 'obfuscate' | 'off';
export type FilenameEncoding = 'base32' | 'base64' | 'base32768';

export interface RCryptSettings {
	passphrase: string;
	salt: string;
	filenameEncryptionMode: FilenameEncryptionMode;
	filenameEncoding: FilenameEncoding;
	encryptedExtension: string;
	autoDeleteSource: boolean;
	rememberSessionPassphrase: boolean;
	encryptFolderNames: boolean;
}

export const DEFAULT_SETTINGS: RCryptSettings = {
	passphrase: '',
	salt: '',
	filenameEncryptionMode: 'standard',
	filenameEncoding: 'base32',
	encryptedExtension: '.rcrypt',
	autoDeleteSource: true,
	rememberSessionPassphrase: true,
	encryptFolderNames: false,
};

export interface CryptoKeys {
	dataKey: Uint8Array; // 32 bytes
	nameKey: Uint8Array; // 32 bytes
	nameTweak: Uint8Array; // 16 bytes
}

