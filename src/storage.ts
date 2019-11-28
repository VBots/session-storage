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
    store: Lowdb.LowdbAsync<any>;
}

export default class SessionStorage implements ISessionStorage {
	public name: IMemoryStorageOptions['name'];
	public path: IMemoryStorageOptions['path'];
	public pathFile: IMemoryStorageOptions['pathFile'];
	public defaultValue: IMemoryStorageOptions['defaultValue'];
	private store: IMemoryStorageOptions['store'] | null;

    /**
     * 
     */
	constructor({ name = 'dbOne', path = './data/', defaultValue = {} }: Partial<IMemoryStorageOptions> = {}) {
		this.name = name;

		this.path = Path.normalize(path);
		this.pathFile = Path.resolve(this.path, `${this.name}.json`);
        this.defaultValue = defaultValue;
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
        
        await this.store.defaults({ users: [] }).write();
	}

    /**
     * Get users collection
     */
    get users(): any {
        return this.store!.get('users');
    }
    
    get size() {
        return this.users.size().value();
    }

	async get(key: string) {
        const userData = await this.users.getById(key);
        const { data } =
			userData.value() ||
			(await this.users
				.insert({
					id: key,
					data: this.defaultValue,
					action: 'created_get'
				})
				.write());

		return data;
	}

	async set(key: string, value: any) {        
        let isExist = this.users.getById(key).value();
        let collect = null;

        if(isExist) {
            collect = this.users.updateById(key, { data: value, action: 'updated_set' });
        }
        else {
            collect = this.users.insert({ id: key, data: value, action: 'created_set' });
        }

        const { data } = await collect.write();
		return data;
	}

	async delete(key: string) {
        const { data } = this.users.removeById(key).write() || {};
		return data;
	}

	async touch() {
        
	}
}