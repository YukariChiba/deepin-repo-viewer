import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { App, type Request } from '@tinyhttp/app';
import { cors } from '@tinyhttp/cors';
import { Low } from 'lowdb';
import { json } from 'milliparsec';
import sirv from 'sirv';

import { Data, Service } from './service';

const isProduction = process.env['NODE_ENV'] === 'production';

type QueryValue = Request['query'][string] | number;
type Query = Record<string, QueryValue>;

export type AppOptions = {
	logger?: boolean;
	static?: string[];
};

export type MultiDBs = { [id: string]: Low<Data> };

export function createApp(dbs: MultiDBs, options: AppOptions = {}) {
	// Create service
	const service = new Service(dbs);

	// Create app
	const app = new App();

	// Static files
	app.use(sirv('public', { dev: !isProduction }));
	options.static
		?.map((path) => (isAbsolute(path) ? path : join(process.cwd(), path)))
		.forEach((dir) => app.use(sirv(dir, { dev: !isProduction })));

	// CORS
	app
		.use((req, res, next) => {
			return cors({
				allowedHeaders: req.headers['access-control-request-headers']?.split(',').map((h) => h.trim()),
			})(req, res, next);
		})
		.options('*', cors());

	// Body parser
	app.use(json());

	app.get('/:db', (req, res, next) => {
		const { db = '' } = req.params;
		const query: Query = {};

		Object.keys(req.query).forEach((key) => {
			let value: QueryValue = req.query[key];

			if (['_start', '_end', '_limit', '_page', '_per_page'].includes(key) && typeof value === 'string') {
				value = parseInt(value);
			}

			if (!Number.isNaN(value)) {
				query[key] = value;
			}
		});
		res.locals['data'] = service.find(db, '', query);
		next?.();
	});

	app.get('/:db/:name', (req, res, next) => {
		const { db = '', name = '' } = req.params;
		const query: Query = {};

		Object.keys(req.query).forEach((key) => {
			let value: QueryValue = req.query[key];

			if (['_start', '_end', '_limit', '_page', '_per_page'].includes(key) && typeof value === 'string') {
				value = parseInt(value);
			}

			if (!Number.isNaN(value)) {
				query[key] = value;
			}
		});
		res.locals['data'] = service.find(db, name, query);
		next?.();
	});

	app.get('/:db/:name/:id', (req, res, next) => {
		const { db = '', name = '', id = '' } = req.params;
		res.locals['data'] = service.findById(db, name, id, req.query);
		next?.();
	});


	app.use('/:db/:name?', (req, res) => {
		const { data } = res.locals;
		if (data === undefined) {
			res.sendStatus(404);
		} else {
			if (req.method === 'POST') res.status(201);
			res.json(data);
		}
	});

	return app;
}
