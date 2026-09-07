import { CryptoKeys, CryptProfile, RCryptSettings } from '../types';
import { decryptFilename, encryptFilename } from './filenameEngine';
import { deriveRcloneKeys } from './kdf';
import { decryptPayload, encryptPayload } from './payloadEngine';

export class RCryptEngine {
	private settings: RCryptSettings;

	constructor(settings: RCryptSettings) {
		this.settings = settings;
	}

	public updateSettings(settings: RCryptSettings): void {
		this.settings = settings;
	}

	public getActiveProfile(): CryptProfile {
		const profile = this.settings.profiles.find((p) => p.id === this.settings.activeProfileId);
		if (profile) return profile;
		if (this.settings.profiles.length > 0) return this.settings.profiles[0];
		throw new Error('No crypt profile found. Please create a profile in Plugin Settings.');
	}

	public getProfileById(profileId: string): CryptProfile | undefined {
		return this.settings.profiles.find((p) => p.id === profileId);
	}

	/**
	 * Resolves the appropriate CryptProfile for a given file or folder path by checking configured folder mappings.
	 * Falls back to activeProfile if no specific mapping matches.
	 */
	public getProfileForPath(filePath?: string): CryptProfile {
		if (filePath && this.settings.folderMappings && this.settings.folderMappings.length > 0) {
			const normalizedPath = filePath.replace(/^\/+|\/+$/g, '');
			const pathSegments = normalizedPath.split('/');

			// Find longest matching folder path prefix
			const sortedMappings = [...this.settings.folderMappings].sort(
				(a, b) => b.folderPath.length - a.folderPath.length
			);
			for (const mapping of sortedMappings) {
				const mapPath = mapping.folderPath.replace(/^\/+|\/+$/g, '');
				if (!mapPath) continue;

				const targetProfile = this.getProfileById(mapping.profileId);
				if (!targetProfile) continue;

				// Direct match on raw path
				if (normalizedPath === mapPath || normalizedPath.startsWith(mapPath + '/')) {
					return targetProfile;
				}

				// If folder name encryption is enabled on target profile, try decrypting each parent folder segment
				if (targetProfile.filenameEncryptionMode !== 'off') {
					try {
						const decryptedSegments = pathSegments.map((segment) => {
							try {
								return this.decryptName(segment, targetProfile.passphrase, targetProfile.salt, targetProfile);
							} catch {
								return segment;
							}
						});
						const decryptedPath = decryptedSegments.join('/');
						if (decryptedPath === mapPath || decryptedPath.startsWith(mapPath + '/')) {
							return targetProfile;
						}
					} catch {
						// Fall through if decryption attempt fails
					}
				}
			}
		}
		return this.getActiveProfile();
	}

	public getKeysForProfile(profile: CryptProfile): CryptoKeys {
		if (!profile.passphrase) {
			throw new Error(`Profile "${profile.name}" has no passphrase configured.`);
		}
		return deriveRcloneKeys(profile.passphrase, profile.salt);
	}

	public getKeys(customPassphrase?: string, customSalt?: string, profileId?: string): CryptoKeys {
		if (customPassphrase !== undefined || customSalt !== undefined) {
			const active = this.getActiveProfile();
			return deriveRcloneKeys(
				customPassphrase !== undefined ? customPassphrase : active.passphrase,
				customSalt !== undefined ? customSalt : active.salt
			);
		}
		const profile = profileId ? this.getProfileById(profileId) || this.getActiveProfile() : this.getActiveProfile();
		return this.getKeysForProfile(profile);
	}

	/**
	 * Encrypt a file buffer using specified profile or custom credentials.
	 */
	public encryptFile(
		plaintext: Uint8Array,
		customPassphrase?: string,
		customSalt?: string,
		profileId?: string
	): Uint8Array {
		const keys = this.getKeys(customPassphrase, customSalt, profileId);
		return encryptPayload(plaintext, keys.dataKey);
	}

	/**
	 * Decrypt a file buffer using specified profile or custom credentials.
	 */
	public decryptFile(
		ciphertext: Uint8Array,
		customPassphrase?: string,
		customSalt?: string,
		profileId?: string
	): Uint8Array {
		const keys = this.getKeys(customPassphrase, customSalt, profileId);
		return decryptPayload(ciphertext, keys.dataKey);
	}

	/**
	 * Encrypt a single filename.
	 */
	public encryptName(
		filename: string,
		customPassphrase?: string,
		customSalt?: string,
		profileIdOrProfile?: string | CryptProfile
	): string {
		const profile =
			typeof profileIdOrProfile === 'object' && profileIdOrProfile !== null
				? profileIdOrProfile
				: typeof profileIdOrProfile === 'string'
				? this.getProfileById(profileIdOrProfile) || this.getActiveProfile()
				: this.getActiveProfile();
		const keys = this.getKeys(
			customPassphrase,
			customSalt,
			typeof profileIdOrProfile === 'string' ? profileIdOrProfile : undefined
		);
		return encryptFilename(
			filename,
			keys,
			profile.filenameEncryptionMode,
			profile.filenameEncoding
		);
	}

	/**
	 * Decrypt a single filename.
	 */
	public decryptName(
		encryptedName: string,
		customPassphrase?: string,
		customSalt?: string,
		profileIdOrProfile?: string | CryptProfile
	): string {
		const profile =
			typeof profileIdOrProfile === 'object' && profileIdOrProfile !== null
				? profileIdOrProfile
				: typeof profileIdOrProfile === 'string'
				? this.getProfileById(profileIdOrProfile) || this.getActiveProfile()
				: this.getActiveProfile();
		const keys = this.getKeys(
			customPassphrase,
			customSalt,
			typeof profileIdOrProfile === 'string' ? profileIdOrProfile : undefined
		);
		return decryptFilename(
			encryptedName,
			keys,
			profile.filenameEncryptionMode,
			profile.filenameEncoding
		);
	}
}
