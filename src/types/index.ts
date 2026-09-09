import { Menu } from 'obsidian';

export type FilenameEncryptionMode = 'standard' | 'obfuscate' | 'off';
export type FilenameEncoding = 'base32' | 'base64' | 'base32768';
export type FolderEncryptionMode = 'all' | 'off';

declare module 'obsidian' {
	interface MenuItem {
		setSubmenu(): Menu;
	}
}

export interface CryptProfile {
	id: string;
	name: string;
	passphrase: string;
	salt: string;
	passphraseHint?: string;
	filenameEncryptionMode: FilenameEncryptionMode;
	filenameEncoding: FilenameEncoding;
	encryptedExtension: string;
	encryptFolderNames: boolean | FolderEncryptionMode;
	savePassphraseOnDisk?: boolean;
	autoEncryptOnClose?: boolean;
}

export interface FolderProfileMapping {
	folderPath: string;
	profileId: string;
}

export interface RCryptSettings {
	activeProfileId: string;
	profiles: CryptProfile[];
	folderMappings: FolderProfileMapping[];
	autoDeleteSource: boolean;
	rememberSessionPassphrase: boolean;
}

export const DEFAULT_PROFILE: CryptProfile = {
	id: 'default',
	name: 'Default Profile',
	passphrase: '',
	salt: '',
	passphraseHint: '',
	filenameEncryptionMode: 'standard',
	filenameEncoding: 'base32',
	encryptedExtension: '.rcrypt',
	encryptFolderNames: false,
	savePassphraseOnDisk: false,
	autoEncryptOnClose: false,
};

export const DEFAULT_SETTINGS: RCryptSettings = {
	activeProfileId: 'default',
	profiles: [DEFAULT_PROFILE],
	folderMappings: [],
	autoDeleteSource: true,
	rememberSessionPassphrase: true,
};

export interface CryptoKeys {
	dataKey: Uint8Array; // 32 bytes
	nameKey: Uint8Array; // 32 bytes
	nameTweak: Uint8Array; // 16 bytes
}

export function getFolderEncryptionMode(val: boolean | string | undefined): FolderEncryptionMode {
	if (val === true || val === 'all' || val === 'target') return 'all';
	return 'off';
}

