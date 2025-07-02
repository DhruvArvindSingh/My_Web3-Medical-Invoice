const storage = window.localStorage;

export class File {

	constructor(created, modified, content, name, password) {
		this.created = created;
		this.modified = modified;
		this.content = content;
		this.name = name;
		this.password = password;
	}

}

export class Local {

	constructor() {
		this.storage = storage;
		this.token = null;
	}

	_saveFile(file) {
		// console.log(file.password);
		let data = { created: file.created, modified: file.modified, content: file.content, password: file.password };
		this.storage.setItem(file.name, JSON.stringify(data));
	}

	_getFile(name) {
		const rawData = this.storage.getItem(name);
		if (!rawData) {
			return null;
		}

		try {
			return JSON.parse(rawData);
		} catch (error) {
			console.warn(`Failed to parse JSON for localStorage item "${name}":`, error);
			return null;
		}
	}

	_getAllFiles() {
		let arr = {};
		for (let i = 0; i < window.localStorage.length; i++) {
			var fname = window.localStorage.key(i);
			// console.log(fname);
			const data = this._getFile(fname);

			// Only include items that parsed successfully and have the expected structure
			if (data && data.modified) {
				arr[fname] = data.modified;
			}
		}
		return arr;
	}

	_deleteFile(name) {
		console.log("deleting file " + name);
		this.storage.removeItem(name);
	}

}