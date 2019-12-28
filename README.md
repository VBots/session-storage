# SessinStorage Add-on for [Session](https://github.com/negezor/vk-io/tree/master/packages/session) [vk-io](https://github.com/negezor/vk-io) library

[![NPM version][npm-v]][npm-url]
[![Used][used-by]][npm-url]
[![Dependencies][deps]][deps-url]
<!-- [![Build Status][build]][build-url] -->


> Powered by [Lowdb](https://github.com/typicode/lowdb)


## Usage

### NPM
```bash
npm i @vbots/session-storage
```

### Yarn
```bash
yarn add @vbots/session-storage
```

### Example
```js
const { VK } = require('vk-io');
const { SessionManager } = require('@vk-io/session');
const { SessionStorage } = require('@vbots/session-storage');

const vk = new VK({
    token: process.env.TOKEN
});

async function startBot({ updates }) {
    // 
    const storage = new SessionStorage({ name: 'anotherBot' });
    // Init DB folder & file
    await storage.init();

    const sessionManager = new SessionManager({
        storage,
        // For test
        getStorageKey: (context) => context.userId ? (`${context.userId}_${context.userId}`) : (`${context.peerId}_${context.senderId}`)
    });

    // Init user session storage
    updates.on('message', sessionManager.middleware);

    // ...
    updates.hear('/counter', async (context) => {
        const { session } = context;

        if (!session.counter) {
            session.counter = 0;
        }

        session.counter += 1;

        await context.send(`You turned to the bot (${session.counter}) times`);
    });

    // ...
    updates.start().catch(console.error);
}

// ...
startBot(vk);
```



[npm-v]: https://img.shields.io/npm/v/@vbots/session-storage.svg?style=flat-square
[used-by]: https://img.shields.io/npm/dt/@vbots/session-storage?label=used%20by&style=flat-square
[npm-url]: https://www.npmjs.com/package/@vbots/session-storage

[node]: https://img.shields.io/node/v/@vbots/session-storage.svg?style=flat-square
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/vbots/session-storage.svg?style=flat-square
[deps-url]: https://david-dm.org/vbots/session-storage

[build]: https://img.shields.io/travis/vbots/session-storage.svg?style=flat-square
[build-url]: https://travis-ci.org/vbots/session-storage
