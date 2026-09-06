import { App, Modal, Notice, Setting, setIcon } from 'obsidian';

export interface PassphrasePromptResult {
	passphrase: string;
	salt: string;
}

export class PassphraseModal extends Modal {
	private passphrase = '';
	private salt = '';
	private onSubmit: (result: PassphrasePromptResult) => Promise<boolean> | boolean;
	private modalTitle: string;

	constructor(
		app: App,
		modalTitle: string,
		defaultSalt: string,
		onSubmit: (result: PassphrasePromptResult) => Promise<boolean> | boolean
	) {
		super(app);
		this.modalTitle = modalTitle;
		this.salt = defaultSalt;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h3', { text: this.modalTitle });

		const errorDiv = contentEl.createDiv({ cls: 'rcrypt-modal-error' });
		errorDiv.setCssProps({ display: 'none' });

		// Passphrase Input Setting with Toggle Password Visibility button
		const passSetting = new Setting(contentEl)
			.setName('Passphrase')
			.setDesc('Enter the encryption/decryption passphrase')
			.addText((text) => {
				text.setPlaceholder('Enter passphrase...');
				text.inputEl.type = 'password';
				text.onChange((value) => {
					this.passphrase = value;
					errorDiv.setCssProps({ display: 'none' });
				});
				text.inputEl.focus();
			});

		// Add show/hide password toggle button with Obsidian Lucide icon
		passSetting.addButton((btn) => {
			btn.setIcon('eye').setTooltip('Show/hide passphrase').onClick(() => {
				const textComp = passSetting.components.find(c => 'inputEl' in c) as { inputEl: HTMLInputElement } | undefined;
				if (textComp) {
					if (textComp.inputEl.type === 'password') {
						textComp.inputEl.type = 'text';
						setIcon(btn.buttonEl, 'eye-off');
					} else {
						textComp.inputEl.type = 'password';
						setIcon(btn.buttonEl, 'eye');
					}
				}
			});
		});

		// Salt Input Setting (Masked as password) with Toggle Visibility button
		const saltSetting = new Setting(contentEl)
			.setName('Salt')
			.setDesc('Salt / password2 (optional, defaults to settings or "rclone")')
			.addText((text) => {
				text.setValue(this.salt);
				text.setPlaceholder('rclone');
				text.inputEl.type = 'password';
				text.onChange((value) => {
					this.salt = value;
					errorDiv.setCssProps({ display: 'none' });
				});
			});

		saltSetting.addButton((btn) => {
			btn.setIcon('eye').setTooltip('Show/hide salt').onClick(() => {
				const textComp = saltSetting.components.find(c => 'inputEl' in c) as { inputEl: HTMLInputElement } | undefined;
				if (textComp) {
					if (textComp.inputEl.type === 'password') {
						textComp.inputEl.type = 'text';
						setIcon(btn.buttonEl, 'eye-off');
					} else {
						textComp.inputEl.type = 'password';
						setIcon(btn.buttonEl, 'eye');
					}
				}
			});
		});

		new Setting(contentEl).addButton((btn) => {
			btn
				.setButtonText('Confirm')
				.setCta()
				.onClick(async () => {
					if (!this.passphrase) {
						errorDiv.setText('⚠️ Please enter a passphrase.');
						errorDiv.setCssProps({ display: 'block' });
						return;
					}

					try {
						const success = await this.onSubmit({ passphrase: this.passphrase, salt: this.salt });
						if (success) {
							this.close();
						} else {
							errorDiv.setText('❌ Decryption failed. Incorrect passphrase or salt.');
							errorDiv.setCssProps({ display: 'block' });
							new Notice('Decryption failed. Please check your passphrase.');
						}
					} catch (err: unknown) {
						const msg = err instanceof Error ? err.message : 'Invalid passphrase or file error.';
						errorDiv.setText(`❌ ${msg}`);
						errorDiv.setCssProps({ display: 'block' });
					}
				});
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
