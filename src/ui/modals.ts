import { App, Modal, Notice, Setting, setIcon } from 'obsidian';
import { getText } from '../i18n/i18n';

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
		const t = getText();
		contentEl.empty();

		contentEl.createEl('h3', { text: this.modalTitle });

		const errorDiv = contentEl.createDiv({ cls: 'rcrypt-modal-error' });
		errorDiv.setCssProps({ display: 'none' });

		// Passphrase Input Setting with Toggle Password Visibility button
		const passSetting = new Setting(contentEl)
			.setName(t.modalPassphraseName)
			.setDesc(t.modalPassphraseDesc)
			.addText((text) => {
				text.setPlaceholder(t.modalPassphrasePlaceholder);
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
			.setName(t.modalSaltName)
			.setDesc(t.modalSaltDesc)
			.addText((text) => {
				text.setValue(this.salt);
				text.setPlaceholder(t.defaultSaltPlaceholder);
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
				.setButtonText(t.modalConfirmBtn)
				.setCta()
				.onClick(async () => {
					if (!this.passphrase) {
						errorDiv.setText(t.modalErrPassphraseRequired);
						errorDiv.setCssProps({ display: 'block' });
						return;
					}

					try {
						const success = await this.onSubmit({ passphrase: this.passphrase, salt: this.salt });
						if (success) {
							this.close();
						} else {
							errorDiv.setText(t.modalErrDecryptFailed);
							errorDiv.setCssProps({ display: 'block' });
							new Notice(t.modalErrDecryptFailed);
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
