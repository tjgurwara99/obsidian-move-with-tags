import {
	App,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TAbstractFile,
	TFile,
} from "obsidian";
import * as path from "path";

// Remember to rename these classes and interfaces!

interface MoveWithTagsSettings {
	targetMapping: Map<string, string>;
}

const DEFAULT_SETTINGS: MoveWithTagsSettings = {
	targetMapping: new Map<string, string>([
		["projects", "1. Projects"],
		["areas", "2. Areas"],
		["resources", "3. Resources"],
		["archive", "4. Archive"],
	]),
};

export default class MoveWithTags extends Plugin {
	settings: MoveWithTagsSettings;

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Move with tags");

		const { targetMapping } = this.settings;
		targetMapping.forEach((value: string, key: string) => {
			this.addCommand({
				id: `move-file-to-${key}`,
				name: `Move file to ${key[0].toUpperCase() + key.substring(1)}`,
				editorCallback: this.moveFileToDestination(value),
			});
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MoveWithTagsSettingsTab(this.app, this));

		this.app.vault.on("modify", (file: TAbstractFile) => {
			if (file instanceof TFile) {
				setTimeout(() => {
					const metadata = this.app.metadataCache.getFileCache(file);
					const tags = metadata?.frontmatter?.tags as string[];
					const tagSet = new Set(tags);
					const mapSet = new Set(this.settings.targetMapping.keys());
					const intersect = new Set(
						[...tagSet].filter((i) => mapSet.has(i))
					);
					if (intersect.size > 1) {
						new Notice(
							`There are more than one tags in this file that satisfy the move criteria.`
						);
						return;
					}
					intersect.forEach((key) => {
						const dir = this.settings.targetMapping.get(key);
						if (dir) {
							this.app.fileManager.renameFile(
								file,
								path.join(dir, file.name)
							);
							new Notice(`Moved ${file.name} to ${dir}`);
						}
					});
				}, 1000);
			}
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	moveFileToDestination(directory: string) {
		return (editor: Editor, view: MarkdownView) => {
			if (view.file) {
				this.app.fileManager.renameFile(
					view.file,
					path.join(directory, view.file.name)
				);
			}
		};
	}
}

class MoveWithTagsSettingsTab extends PluginSettingTab {
	plugin: MoveWithTags;

	constructor(app: App, plugin: MoveWithTags) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) => text.setPlaceholder("Enter your secret"));
	}
}
