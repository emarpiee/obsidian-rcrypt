import { App, Modal, Setting } from 'obsidian';

export interface PassphrasePromptResult {
	passphrase: string;
	salt: string;
}

export class PassphraseModal extends Modal {
	private passphrase = '';
	private salt = '';
	private onSubmit: (result: PassphrasePromptResult | null) => void;
	private modalTitle: string;

	constructor(
		app: App,
		modalTitle: string,
		defaultSalt: string,
		onSubmit: (result: PassphrasePromptResult | null) => void
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

		new Setting(contentEl)
			.setName('Passphrase')
			.setDesc('Enter the encryption/decryption passphrase')
			.addText((text) => {
				text.setPlaceholder('Enter passphrase...');
				text.inputEl.type = 'password';
				text.onChange((value) => {
					this.passphrase = value;
				});
				text.inputEl.focus();
			});

		new Setting(contentEl)
			.setName('Salt')
			.setDesc('Salt / password2 (optional, defaults to settings or "rclone")')
			.addText((text) => {
				text.setValue(this.salt);
				text.setPlaceholder('rclone');
				text.onChange((value) => {
					this.salt = value;
				});
			});

		new Setting(contentEl).addButton((btn) => {
			btn
				.setButtonText('Confirm')
				.setCta()
				.onClick(() => {
					if (!this.passphrase) {
						return;
					}
					this.close();
					this.onSubmit({ passphrase: this.passphrase, salt: this.salt });
				});
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class DecryptedPreviewModal extends Modal {
	private filename: string;
	private content: Uint8Array;

	constructor(app: App, filename: string, content: Uint8Array) {
		super(app);
		this.filename = filename;
		this.content = content;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h3', { text: `Preview: ${this.filename}` });
		contentEl.createEl('p', {
			text: '🔒 Safe preview (in-memory only — not saved to disk)',
			cls: 'rcrypt-preview-badge',
		});

		const textDecoder = new TextDecoder('utf-8');
		const text = textDecoder.decode(this.content);

		const container = contentEl.createDiv({ cls: 'rcrypt-preview-container' });
		const pre = container.createEl('pre');
		pre.setText(text);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
