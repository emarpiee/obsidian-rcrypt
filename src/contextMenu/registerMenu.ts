import { Menu, Platform, TAbstractFile, TFile, TFolder } from 'obsidian';
import { getText } from '../i18n/i18n';
import RCryptPlugin from '../main';
import { CryptProfile, getFolderEncryptionMode } from '../types';
import { ConfirmEncryptModal, PassphraseModal, ProgressModal } from '../ui/modals';

export function registerContextMenu(plugin: RCryptPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
			addMenuItems(plugin, menu, [file]);
		})
	);

	plugin.registerEvent(
		plugin.app.workspace.on('files-menu', (menu: Menu, files: TAbstractFile[]) => {
			addMenuItems(plugin, menu, files);
		})
	);
}

function isEncryptedFileSync(plugin: RCryptPlugin, file: TFile): boolean {
	const name = file.name;
	if (name.endsWith('.rcrypt')) return true;

	for (const p of plugin.settings.profiles) {
		const suffix = getEffectiveSuffix(p.encryptedExtension, p.filenameEncryptionMode);
		if (suffix && name.endsWith(suffix)) return true;
	}

	if (Platform.isDesktop) {
		try {
			const win = window as unknown as { require?: (mod: string) => typeof import('fs') };
			if (typeof win.require === 'function') {
				const fsModule = win.require('fs');
				const adapter = plugin.app.vault.adapter as { getFullPath?: (p: string) => string };
				if (typeof adapter.getFullPath === 'function') {
					const fullPath = adapter.getFullPath(file.path);
					if (fullPath && fsModule.existsSync(fullPath)) {
						const fd = fsModule.openSync(fullPath, 'r');
						const buffer = Buffer.alloc(8);
						const bytesRead = fsModule.readSync(fd, buffer, 0, 8, 0);
						fsModule.closeSync(fd);

						if (bytesRead >= 8) {
							return (
								buffer[0] === 0x52 &&
								buffer[1] === 0x43 &&
								buffer[2] === 0x4c &&
								buffer[3] === 0x4f &&
								buffer[4] === 0x4e &&
								buffer[5] === 0x45 &&
								buffer[6] === 0x00 &&
								buffer[7] === 0x00
							);
						}
					}
				}
			}
		} catch {
			// Ignore sync read errors
		}
	}

	return false;
}

function hasEncryptedContent(plugin: RCryptPlugin, items: TAbstractFile[]): boolean {
	for (const item of items) {
		if (item instanceof TFile) {
			if (isEncryptedFileSync(plugin, item)) return true;
		} else if (item instanceof TFolder) {
			const files: TFile[] = [];
			collectFolderFiles(item, files);
			for (const f of files) {
				if (isEncryptedFileSync(plugin, f)) return true;
			}
		}
	}
	return false;
}

function addMenuItems(plugin: RCryptPlugin, menu: Menu, files: TAbstractFile[]): void {
	if (!files || files.length === 0) return;

	const t = getText();
	const isFolder = files.length === 1 && files[0] instanceof TFolder;
	const count = files.length;
	const resolvedProfile = plugin.engine.getProfileForPath(files[0]?.path);
	const showDecrypt = hasEncryptedContent(plugin, files);

	menu.addItem((item) => {
		item
			.setTitle(
				count > 1
					? t.encryptItems(count)
					: isFolder
					? t.encryptFolder
					: t.encryptFile
			)
			.setIcon('lock')
			.onClick(() => {
				void processItems(plugin, files, 'encrypt', false, resolvedProfile.id);
			});
	});

	if (showDecrypt) {
		menu.addItem((item) => {
			item
				.setTitle(
					count > 1
						? t.decryptItems(count)
						: isFolder
						? t.decryptFolder
						: t.decryptFile
				)
				.setIcon('unlock')
				.onClick(() => {
					void processItems(plugin, files, 'decrypt', true, resolvedProfile.id);
				});
		});
	}
}

export async function processItems(
	plugin: RCryptPlugin,
	items: TAbstractFile[],
	action: 'encrypt' | 'decrypt',
	useCustomPrompt: boolean,
	profileId?: string,
	openInNewLeaf = false
): Promise<void> {
	const t = getText();
	if (action === 'decrypt' && !hasEncryptedContent(plugin, items)) {
		plugin.showNotice(t.noticeAlreadyDecrypted, 8000);
		return;
	}

	const initialProfile = profileId
		? plugin.engine.getProfileById(profileId) || plugin.engine.getProfileForPath(items[0]?.path)
		: plugin.engine.getProfileForPath(items[0]?.path);

	const executeWithProfile = async (targetProfile: CryptProfile): Promise<void> => {
		const title = action === 'encrypt' ? t.modalTitleEncrypt(items.length) : t.modalTitleDecrypt(items.length);
		if (useCustomPrompt || !targetProfile.passphrase) {
			new PassphraseModal(
				plugin.app,
				title,
				plugin.settings.profiles,
				targetProfile.id,
				async (res) => {
					let selectedProfile: CryptProfile;
					if (res.profileId === 'custom') {
						selectedProfile = {
							id: 'custom',
							name: 'Custom Configuration',
							passphrase: res.passphrase,
							salt: res.salt,
							autoEncryptOnClose: res.autoEncryptOnClose ?? false,
							filenameEncryptionMode: res.customFilenameEncryptionMode || 'standard',
							filenameEncoding: res.customFilenameEncoding || 'base32',
							encryptedExtension: res.customEncryptedExtension || '.rcrypt',
							encryptFolderNames: false,
							savePassphraseOnDisk: false,
						};
					} else {
						const baseProf = plugin.engine.getProfileById(res.profileId) || targetProfile;
						selectedProfile = {
							...baseProf,
							passphrase: res.passphrase,
							salt: res.salt,
							autoEncryptOnClose: res.autoEncryptOnClose ?? false,
						};
					}
					const result = await executeBatchAction(plugin, items, action, res.passphrase, res.salt, selectedProfile, openInNewLeaf);
					if (action === 'decrypt' && result.successCount > 0 && res.autoEncryptOnClose) {
						for (const item of items) {
							if (item instanceof TFile) {
								plugin.registerDecryptedSessionFile(item.path, selectedProfile);
							}
						}
					}
					return result.successCount > 0 && result.failCount === 0;
				},
				items,
				action
			).open();
		} else {
			const res = await executeBatchAction(
				plugin,
				items,
				action,
				targetProfile.passphrase,
				targetProfile.salt,
				targetProfile
			);
			if (action === 'decrypt' && res.successCount > 0) {
				for (const item of items) {
					if (item instanceof TFile) {
						plugin.registerDecryptedSessionFile(item.path, targetProfile);
					}
				}
			}
		}
	};

	if (action === 'encrypt') {
		new ConfirmEncryptModal(
			plugin.app,
			items,
			plugin.settings.profiles,
			initialProfile.id,
			(selectedProfile) => {
				void executeWithProfile(selectedProfile);
			}
		).open();
	} else {
		await executeWithProfile(initialProfile);
	}
}

export async function executeBatchAction(
	plugin: RCryptPlugin,
	items: TAbstractFile[],
	action: 'encrypt' | 'decrypt',
	passphrase: string,
	salt: string,
	profile: CryptProfile,
	openInNewLeaf = false
): Promise<{ successCount: number; failCount: number }> {
	const t = getText();
	let successCount = 0;
	let failCount = 0;
	let innerLayerDetectedCount = 0;

	const allFiles: TFile[] = [];
	const topFolders: TFolder[] = [];
	const decryptedFiles: TFile[] = [];

	for (const item of items) {
		if (item instanceof TFile) {
			allFiles.push(item);
		} else if (item instanceof TFolder) {
			topFolders.push(item);
			collectFolderFiles(item, allFiles);
		}
	}

	const filesToProcess: TFile[] = [];
	if (action === 'decrypt') {
		for (const file of allFiles) {
			if (isEncryptedFileSync(plugin, file)) {
				filesToProcess.push(file);
			}
		}
	} else {
		filesToProcess.push(...allFiles);
	}

	let firstErrorMessage = '';
	const filesToDeleteOnSuccess: TFile[] = [];

	let progressModal: ProgressModal | undefined;
	if (filesToProcess.length >= 1) {
		progressModal = new ProgressModal(plugin.app, action, filesToProcess.length);
		progressModal.open();
	}

	let processedIndex = 0;
	for (const file of filesToProcess) {
		if (progressModal?.checkCancelled()) {
			break;
		}
		processedIndex++;
		progressModal?.updateProgress(processedIndex, file.name);

		try {
			if (action === 'encrypt') {
				const content = new Uint8Array(await plugin.app.vault.readBinary(file));
				const encryptedBytes = plugin.engine.encryptFile(content, passphrase, salt, profile.id);

				const encName = plugin.engine.encryptName(file.name, passphrase, salt, profile);
				const suffix = getEffectiveSuffix(profile.encryptedExtension, profile.filenameEncryptionMode);
				const targetPath = `${file.parent ? file.parent.path + '/' : ''}${encName}${suffix}`;

				await plugin.app.vault.createBinary(
					targetPath,
					toArrayBuffer(encryptedBytes)
				);

				filesToDeleteOnSuccess.push(file);
				successCount++;
			} else {
				// Decrypt action
				let rawEncName = file.name;

				// In 'off' mode, strip configured/effective suffix or extension (e.g. file.md.bin -> file.md)
				// In 'standard' or 'obfuscate' mode, the full encrypted name (e.g. '1.554.498.498.txt') is decrypted directly by the filename cipher
				if (profile.filenameEncryptionMode === 'off') {
					const effectiveSuffix = getEffectiveSuffix(profile.encryptedExtension, profile.filenameEncryptionMode);
					const configuredExt = (profile.encryptedExtension || '.rcrypt').toLowerCase();

					if (effectiveSuffix && file.name.endsWith(effectiveSuffix)) {
						rawEncName = file.name.slice(0, -effectiveSuffix.length);
					} else if (configuredExt && configuredExt !== 'none' && file.name.endsWith(configuredExt)) {
						rawEncName = file.name.slice(0, -configuredExt.length);
					} else if (file.name.endsWith('.rcrypt')) {
						rawEncName = file.name.slice(0, -7);
					} else {
						const lastDotIdx = file.name.lastIndexOf('.');
						if (lastDotIdx > 0) {
							rawEncName = file.name.slice(0, lastDotIdx);
						}
					}
				}

				let decName = rawEncName;

				// Read file content first
				const content = new Uint8Array(await plugin.app.vault.readBinary(file));

				// 1. Decrypt filename if filename encryption mode is enabled ('standard' or 'obfuscate')
				if (profile.filenameEncryptionMode !== 'off') {
					try {
						decName = plugin.engine.decryptName(rawEncName, passphrase, salt, profile);
					} catch {
						// If filename decryption fails under standard/obfuscate mode, test if payload decrypts with plain filename
						try {
							plugin.engine.decryptFile(content, passphrase, salt, profile.id);
							decName = rawEncName; // Plain filename
						} catch {
							throw new Error('Incorrect passphrase, salt, or filename mode.');
						}
					}
				}

				// 2. Decrypt file payload strictly using selected profile
				const decryptedBytes = plugin.engine.decryptFile(content, passphrase, salt, profile.id);
				if (hasRcloneMagicHeader(decryptedBytes)) {
					innerLayerDetectedCount++;
				}

				// 3. Save decrypted file
				const parentDir = file.parent && file.parent.path !== '/' ? `${file.parent.path}/` : '';
				const targetPath = `${parentDir}${decName}`;
				let decryptedFileObj: TFile | null = null;

				if (targetPath === file.path) {
					// In-place decryption
					await plugin.app.vault.modifyBinary(file, toArrayBuffer(decryptedBytes));
					decryptedFileObj = file;
				} else {
					const existingTarget = plugin.app.vault.getAbstractFileByPath(targetPath);
					if (existingTarget instanceof TFile) {
						await plugin.app.vault.modifyBinary(existingTarget, toArrayBuffer(decryptedBytes));
						if (plugin.settings.autoDeleteSource) {
							await plugin.app.vault.delete(file, true);
						}
						decryptedFileObj = existingTarget;
					} else {
						decryptedFileObj = await plugin.app.vault.createBinary(
							targetPath,
							toArrayBuffer(decryptedBytes)
						);
						if (plugin.settings.autoDeleteSource) {
							await plugin.app.vault.delete(file, true);
						}
					}
				}
				if (decryptedFileObj) {
					decryptedFiles.push(decryptedFileObj);
				}
				successCount++;
			}
		} catch (err: unknown) {
			failCount++;
			if (!firstErrorMessage) {
				firstErrorMessage = err instanceof Error ? err.message : 'Unknown error';
			}
		}
	}

	if (progressModal) {
		progressModal.close();
	}

	// Only delete original unencrypted files after ALL files in batch encrypt successfully without errors
	if (action === 'encrypt' && plugin.settings.autoDeleteSource && failCount === 0 && !progressModal?.checkCancelled()) {
		for (const f of filesToDeleteOnSuccess) {
			try {
				await plugin.app.vault.delete(f, true);
			} catch {
				// Ignore deletion errors for already deleted files
			}
		}
	}

	if (action === 'decrypt' && decryptedFiles.length > 0) {
		for (const f of decryptedFiles) {
			plugin.registerDecryptedSessionFile(f.path, profile);
		}
		const leaf = plugin.app.workspace.getLeaf(openInNewLeaf);
		if (leaf) {
			void leaf.openFile(decryptedFiles[0]);
		}
	}

	// Rename target folder(s) if folder name encryption is enabled
	const folderEncMode = getFolderEncryptionMode(profile.encryptFolderNames);
	if (folderEncMode !== 'off' && topFolders.length > 0) {
		const foldersToRename: TFolder[] = [];
		if (folderEncMode === 'all') {
			for (const topFolder of topFolders) {
				collectFoldersPostOrder(topFolder, foldersToRename);
			}
		} else {
			foldersToRename.push(...topFolders);
		}

		for (const folder of foldersToRename) {
			try {
				if (action === 'encrypt') {
					const encFolderName = plugin.engine.encryptName(folder.name, passphrase, salt, profile.id);
					const parentPath = folder.parent ? folder.parent.path : '';
					const targetFolderPath = parentPath && parentPath !== '/' ? `${parentPath}/${encFolderName}` : encFolderName;
					if (targetFolderPath !== folder.path) {
						await plugin.app.fileManager.renameFile(folder, targetFolderPath);
					}
				} else if (profile.filenameEncryptionMode !== 'off') {
					let decFolderName = folder.name;
					try {
						decFolderName = plugin.engine.decryptName(folder.name, passphrase, salt, profile.id);
					} catch {
						// Ignore if folder name wasn't encrypted
					}

					if (decFolderName !== folder.name) {
						const parentPath = folder.parent ? folder.parent.path : '';
						const targetFolderPath = parentPath && parentPath !== '/' ? `${parentPath}/${decFolderName}` : decFolderName;
						if (targetFolderPath !== folder.path) {
							await plugin.app.fileManager.renameFile(folder, targetFolderPath);
						}
					}
				}
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : 'Folder rename error';
				console.error(`Error renaming folder ${folder.path}: ${msg}`);
			}
		}
	}

	if (successCount > 0 || failCount > 0) {
		if (failCount > 0 && successCount === 0) {
			plugin.showNotice(
				action === 'encrypt'
					? t.noticeEncryptFailed(failCount, firstErrorMessage)
					: t.noticeDecryptFailed(failCount, firstErrorMessage),
				12000
			);
		} else if (failCount > 0) {
			plugin.showNotice(
				t.noticeActionFinishedWithErrors(action, successCount, failCount, firstErrorMessage),
				12000
			);
		} else {
			if (action === 'decrypt' && innerLayerDetectedCount > 0) {
				const noticeFn = t.noticeDecryptSuccessInnerLayer || t.noticeDecryptSuccess;
				plugin.showNotice(noticeFn(successCount), 10000);
			} else {
				plugin.showNotice(
					action === 'encrypt'
						? t.noticeEncryptSuccess(successCount)
						: t.noticeDecryptSuccess(successCount),
					8000
				);
			}
		}
	} else {
		// Informative notice when no items were modified (e.g. already encrypted/decrypted)
		if (allFiles.length === 0) {
			plugin.showNotice(t.noticeNoFilesFound, 8000);
		} else if (action === 'encrypt') {
			plugin.showNotice(t.noticeAlreadyEncrypted, 8000);
		} else {
			plugin.showNotice(t.noticeAlreadyDecrypted, 8000);
		}
	}

	return { successCount, failCount };
}

function toArrayBuffer(uint8: Uint8Array): ArrayBuffer {
	return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
}

function collectFolderFiles(folder: TFolder, out: TFile[]): void {
	for (const child of folder.children) {
		if (child instanceof TFile) {
			out.push(child);
		} else if (child instanceof TFolder) {
			collectFolderFiles(child, out);
		}
	}
}

function getEffectiveSuffix(configuredSuffix: string, mode: string): string {
	if (mode !== 'off') {
		return '';
	}
	if (configuredSuffix && configuredSuffix.toLowerCase() === 'none') {
		return '';
	}
	return configuredSuffix || '.bin';
}

function collectFoldersPostOrder(folder: TFolder, out: TFolder[]): void {
	for (const child of folder.children) {
		if (child instanceof TFolder) {
			collectFoldersPostOrder(child, out);
		}
	}
	out.push(folder);
}

function hasRcloneMagicHeader(bytes: Uint8Array): boolean {
	if (bytes.length < 8) return false;
	return (
		bytes[0] === 0x52 &&
		bytes[1] === 0x43 &&
		bytes[2] === 0x4c &&
		bytes[3] === 0x4f &&
		bytes[4] === 0x4e &&
		bytes[5] === 0x45 &&
		bytes[6] === 0x00 &&
		bytes[7] === 0x00
	);
}


