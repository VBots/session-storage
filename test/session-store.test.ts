import Fs from 'fs-extra';
import assert from 'assert';
import { SessionStorage } from '../src';

const zleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('SessionStorage', (): void => {
	describe('StorageLoad', (): void => {
		// ...
		const testStorage = new SessionStorage();

		it('Test #0 [Init]', async (): Promise<void> => {
			// console.log('Wait:', Date.now() % 1e4);
			try {
				await Fs.remove(testStorage.pathFile);
			} catch (error) {}

			await testStorage.init();

			// console.log('Wait End:', Date.now() % 1e4);
		});

		it('Test #1', async (): Promise<void> => {
			// ...
			async function writeFile(name: string = 'F1') {
				// console.log('Wait:', name, Date.now() % 1e4);
				for (let i = 0; i < 10; i++) {
					await testStorage.set(`Key:${name}:${i}`, {
						msg: `Test #${i} by ${name}`,
						time: Date.now() % 1e5
					});
				}
				// console.log('Wait End:', name, Date.now() % 1e4);
			}

			await writeFile('F0');

			let steps = 2;
			writeFile('F1').then(() => {
				steps++;
			});
			// writeFile('F2').then(() => { steps++; });
			// writeFile('F3').then(() => { steps++; });

			await new Promise(async resolve => {
				for (; steps < 3; ) {
					await zleep(100);
				}
				resolve();
			});
		});

		it('Test #2', async (): Promise<void> => {
			// ...
			let getData = await testStorage.get(`user_xxx`);
			assert.deepEqual(getData, {});
			await testStorage.set(`nextData`, { a: 22 });

			let time = Date.now();
			let setData = await testStorage.set(`user_xxx`, {
				name: `T-34`,
				time
			});
			assert.equal(setData, true);

			let getData2 = await testStorage.get(`user_xxx`);
			assert.deepEqual(getData2, { name: 'T-34', time });

			await zleep(1e3);

			let deleteData = await testStorage.delete(`user_xxx`);
			assert.equal(deleteData, false);

			let deleteData2 = await testStorage.delete(`user_xxx_Y`);
			assert.equal(deleteData2, false);
		});

		it('Test #3', async (): Promise<void> => {
			// ...
			let myStoreData = await testStorage.storeByName('myStore', []);
			assert.deepEqual(myStoreData.value(), []);

			await testStorage.set('testID', [123, 321], 'myStore');
			assert.equal(
				testStorage
					.getStore()!
					.has('myStore')
					.value(),
				true
			);
			myStoreData = await testStorage.storeByName('myStore');

			assert.deepEqual(myStoreData.value(), [{ action: 'created_set', data: [123, 321], id: 'testID' }]);

			await testStorage
				.getStore()!
				.set('myStore[0].id', 'helloW')
                .write();
            const getData = await testStorage.get('helloW', 'myStore');
			assert.deepEqual(getData, [123, 321]);
		});
	});
});
