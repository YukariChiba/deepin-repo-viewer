import { Low } from 'lowdb';
import { createApp, MultiDBs } from './app';
import { Data } from './service';
import { Observer } from './observer';
import { JSONFile } from 'lowdb/node';
import fs from 'fs';

let dbs: MultiDBs = {};

for (const file of fs.readdirSync('data')) {
	if (!file.endsWith('.json')) continue;
	let adapter = new JSONFile<Data>(`data/${file}`);
	const observer = new Observer(adapter);
	const db = new Low<Data>(observer, {});
	await db.read();
	dbs[file.replace(/\.json$/, '')] = db;
}

const app = createApp(dbs, { logger: false });

const port = parseInt(process.env.PORT || '') || 1234;

app.listen(port, () => {
	console.log(`JSON Server started on PORT :${port}`);
});
