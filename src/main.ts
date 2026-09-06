import { Plugin } from 'obsidian';

export default class RCryptPlugin extends Plugin {
	async onload(): Promise<void> {
		console.log('Loading RCrypt plugin');
	}

	onunload(): void {
		console.log('Unloading RCrypt plugin');
	}
}
