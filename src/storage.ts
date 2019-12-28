import Path from 'path';
import Fs from 'fs-extra';
// @ts-ignore
import lodashId from 'lodash-id';
import Lowdb from 'lowdb';
import { default as FileAsync } from 'lowdb/adapters/FileAsync';


export interface ISessionStorage {
	get(key: string): Promise<object | null>;
	set(key: string, value: object): Promise<boolean>;
	delete(key: string): Promise<boolean>;
	touch(key: string): Promise<void>;
}

export interface IMemoryStorageOptions {
    name: string;
    path: string;
    pathFile: string;
    defaultValue: any;
    defaultStoreName: string;
    store: Lowdb.LowdbAsync<any>;
}

export default class SessionStorage implements ISessionStorage {
	public name: IMemoryStorageOptions['name'];
	public path: IMemoryStorageOptions['path'];
	public pathFile: IMemoryStorageOptions['pathFile'];
	public defaultValue: IMemoryStorageOptions['defaultValue'];
	public defaultStoreName: IMemoryStorageOptions['defaultStoreName'];
	private store: IMemoryStorageOptions['store'] | null;

    /**
     * 
     */
	constructor({ name = 'dbOne', path = './data/', defaultValue = {}, defaultStoreName = 'users' }: Partial<IMemoryStorageOptions> = {}) {
		this.name = name;

		this.path = Path.normalize(path);
		this.pathFile = Path.resolve(this.path, `${this.name}.json`);
        this.defaultValue = defaultValue;
        this.defaultStoreName = defaultStoreName;
        this.store = null;
	}

    /**
     * File initialization
     */
	async init() {
        // @ts-ignore
		await Fs.mkdir(this.path, { recursive: true });

		const adapter = new FileAsync(this.pathFile, {
			// serialize: data => encrypt(JSON.stringify(data)),
			// deserialize: data => JSON.parse(decrypt(data))
		});
		this.store = await Lowdb(adapter);
        this.store._.mixin(lodashId);
        
        await this.store.defaults({ [this.defaultStoreName]: [] }).write();
	}

    /**
     * Get store collection
     */
    async storeByName(name: string, defaultValue: any = this.defaultValue) {
		if(!this.store!.has(name).value()) {
			await this.store!.set(name, defaultValue).write();
		}
        return this.store!.get(name);
	}
	
	getStore() {
		return this.store;
	}

    get defaultStore(): any {
        return this.store!.get(this.defaultStoreName);
	}
    
    get size() {
        return this.defaultStore.size().value();
    }

	async get(key: string) {
        const storeData = await this.defaultStore.getById(key);
        const { data } =
			storeData.value() ||
			(await this.defaultStore
				.insert({
					id: key,
					data: this.defaultValue,
					action: 'created_get'
				})
				.write());

		return data;
	}

	async set(key: string, value: any, storeName: string | null = null) {
		const store = storeName ? (await this.storeByName(storeName)) : this.defaultStore;
        let isExist = store.getById(key).value();
        let collect = null;

        if(isExist) {
            collect = store.updateById(key, { data: value, action: 'updated_set' });
        }
        else {
            collect = store.insert({ id: key, data: value, action: 'created_set' });
        }

        const { data } = await collect.write();
		return !!data;
	}

	async delete(key: string) {
        const { data } = this.defaultStore.removeById(key).write() || {};
		return !!data;
	}

	async touch(key: string) {
        await this.get(key);
	}
}