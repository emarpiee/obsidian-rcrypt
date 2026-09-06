import { Menu, Notice, TAbstractFile, TFile, TFolder } from 'obsidian';
import RCryptPlugin from '../main';
import { DecryptedPreviewModal, PassphraseModal } from '../ui/modals';

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

function addMenuItems(plugin: RCryptPlugin, menu: Menu, files: TAbstractFile[]): void {
	if (!files || files.length === 0) return;

	const isSingleFile = files.length === 1 && files[0] instanceof TFile;
	const singleFile = files.length === 1 && files[0] instanceof TFile ? files[0] : null;
	const isEncrypted = singleFile
		? singleFile.name.endsWith(plugin.settings.encryptedExtension)
		: false;

	if (isSingleFile && singleFile && isEncrypted) {
		menu.addItem((item) => {
			item
				.setTitle('Safe view encrypted file (in-memory)')
				.setIcon('eye')
				.onClick(() => {
					void previewFile(plugin, singleFile);
				});
		});
	}

	menu.addItem((item) => {
		item
			.setTitle(files.length > 1 ? `Encrypt ${files.length} items (rclone crypt)` : 'Encrypt (rclone crypt)')
			.setIcon('lock')
			.onClick(() => {
				void processItems(plugin, files, 'encrypt', false);
			});
	});

	menu.addItem((item) => {
		item
			.setTitle('Encrypt with custom passphrase...')
			.setIcon('key')
			.onClick(() => {
				void processItems(plugin, files, 'encrypt', true);
			});
	});

	menu.addItem((item) => {
		item
			.setTitle(files.length > 1 ? `Decrypt ${files.length} items (rclone crypt)` : 'Decrypt (rclone crypt)')
			.setIcon('unlock')
			.onClick(() => {
				void processItems(plugin, files, 'decrypt', false);
			});
	});

	menu.addItem((item) => {
		item
			.setTitle('Decrypt with custom passphrase...')
			.setIcon('key')
			.onClick(() => {
				void processItems(plugin, files, 'decrypt', true);
			});
	});
}

async function previewFile(plugin: RCryptPlugin, file: TFile): Promise<void> {
	try {
		const raw = await plugin.app.vault.readBinary(file);
		const bytes = new Uint8Array(raw);

		const pass = plugin.settings.passphrase;
		const salt = plugin.settings.salt;

		if (!pass) {
			new PassphraseModal(
				plugin.app,
				'Enter passphrase to preview',
				salt,
				(res) => {
					try {
						const decrypted = plugin.engine.decryptFile(bytes, res.passphrase, res.salt);
						new DecryptedPreviewModal(plugin.app, file.name, decrypted).open();
						return true;
					} catch {
						return false;
					}
				}
			).open();
			return;
		}

		const decrypted = plugin.engine.decryptFile(bytes, pass, salt);
		new DecryptedPreviewModal(plugin.app, file.name, decrypted).open();
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : 'Unknown preview error';
		new Notice(`Failed to preview encrypted file: ${msg}`);
	}
}

async function processItems(
	plugin: RCryptPlugin,
	items: TAbstractFile[],
	action: 'encrypt' | 'decrypt',
	useCustomPrompt: boolean
): Promise<void> {
	if (useCustomPrompt || !plugin.settings.passphrase) {
		new PassphraseModal(
			plugin.app,
			`${action === 'encrypt' ? 'Encrypt' : 'Decrypt'} ${items.length} item(s)`,
			plugin.settings.salt,
			async (res) => {
				const result = await executeBatchAction(plugin, items, action, res.passphrase, res.salt);
				return result.successCount > 0 && result.failCount === 0;
			}
		).open();
	} else {
		await executeBatchAction(
			plugin,
			items,
			action,
			plugin.settings.passphrase,
			plugin.settings.salt
		);
	}
}

async function executeBatchAction(
	plugin: RCryptPlugin,
	items: TAbstractFile[],
	action: 'encrypt' | 'decrypt',
	passphrase: string,
	salt: string
): Promise<{ successCount: number; failCount: number }> {
	let successCount = 0;
	let failCount = 0;

	const allFiles: TFile[] = [];
	const topFolders: TFolder[] = [];

	for (const item of items) {
		if (item instanceof TFile) {
			allFiles.push(item);
		} else if (item instanceof TFolder) {
			topFolders.push(item);
			collectFolderFiles(item, allFiles);
		}
	}

	for (const file of allFiles) {
		try {
			if (action === 'encrypt') {
				if (file.name.endsWith(plugin.settings.encryptedExtension)) {
					continue;
				}
				const content = new Uint8Array(await plugin.app.vault.readBinary(file));
				const encryptedBytes = plugin.engine.encryptFile(content, passphrase, salt);

				const encName = plugin.engine.encryptName(file.name, passphrase, salt);
				const targetPath = `${file.parent ? file.parent.path + '/' : ''}${encName}${plugin.settings.encryptedExtension}`;

				await plugin.app.vault.createBinary(
					targetPath,
					toArrayBuffer(encryptedBytes)
				);

				if (plugin.settings.autoDeleteSource) {
					await plugin.app.fileManager.trashFile(file);
				}
				successCount++;
			} else {
				const content = new Uint8Array(await plugin.app.vault.readBinary(file));
				const decryptedBytes = plugin.engine.decryptFile(content, passphrase, salt);

				let decName = file.name;
				if (decName.endsWith(plugin.settings.encryptedExtension)) {
					decName = decName.slice(0, -plugin.settings.encryptedExtension.length);
				}

				try {
					decName = plugin.engine.decryptName(decName, passphrase, salt);
				} catch {
					// Fallback to decName
				}

				const targetPath = `${file.parent ? file.parent.path + '/' : ''}${decName}`;
				await plugin.app.vault.createBinary(
					targetPath,
					toArrayBuffer(decryptedBytes)
				);

				if (plugin.settings.autoDeleteSource) {
					await plugin.app.fileManager.trashFile(file);
				}
				successCount++;
			}
		} catch (err: unknown) {
			failCount++;
			const msg = err instanceof Error ? err.message : 'Unknown processing error';
			console.error(`Error processing file: ${msg}`);
		}
	}

	// Rename target folder(s) if encryptFolderNames is enabled
	if (plugin.settings.encryptFolderNames && topFolders.length > 0) {
		for (const folder of topFolders) {
			try {
				if (action === 'encrypt') {
					const encFolderName = plugin.engine.encryptName(folder.name, passphrase, salt);
					const parentPath = folder.parent ? folder.parent.path : '';
					const targetFolderPath = parentPath && parentPath !== '/' ? `${parentPath}/${encFolderName}` : encFolderName;
					await plugin.app.fileManager.renameFile(folder, targetFolderPath);
				} else {
					let decFolderName = folder.name;
					try {
						decFolderName = plugin.engine.decryptName(folder.name, passphrase, salt);
					} catch {
						// Fallback if folder name was not encrypted
					}
					const parentPath = folder.parent ? folder.parent.path : '';
					const targetFolderPath = parentPath && parentPath !== '/' ? `${parentPath}/${decFolderName}` : decFolderName;
					await plugin.app.fileManager.renameFile(folder, targetFolderPath);
				}
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : 'Folder rename error';
				console.error(`Error renaming folder: ${msg}`);
			}
		}
	}

	if (successCount > 0 || failCount > 0) {
		new Notice(
			`${action === 'encrypt' ? 'Encryption' : 'Decryption'} complete: ${successCount} succeeded, ${failCount} failed.`
		);
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
