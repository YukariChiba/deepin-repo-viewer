import { randomBytes } from 'node:crypto';

import { getProperty } from 'dot-prop';
import inflection from 'inflection';
import { Low } from 'lowdb';
import sortOn from 'sort-on';
import { MultiDBs } from './app';

export type Item = Record<string, unknown>;

export type Data = Record<string, Item[] | Item>;

export function isItem(obj: unknown): obj is Item {
	return typeof obj === 'object' && obj !== null;
}

export function isData(obj: unknown): obj is Record<string, Item[]> {
	if (typeof obj !== 'object' || obj === null) {
		return false;
	}

	const data = obj as Record<string, unknown>;
	return Object.values(data).every((value) => Array.isArray(value) && value.every(isItem));
}

enum Condition {
	lt = 'lt',
	lte = 'lte',
	gt = 'gt',
	gte = 'gte',
	ne = 'ne',
	default = '',
}

function isCondition(value: string): value is Condition {
	return Object.values<string>(Condition).includes(value);
}

export type PaginatedItems = {
	first: number;
	prev: number | null;
	next: number | null;
	last: number;
	pages: number;
	items: number;
	data: Item[];
};

function ensureArray(arg: string | string[] = []): string[] {
	return Array.isArray(arg) ? arg : [arg];
}

function embed(db: Low<Data>, name: string, item: Item, related: string): Item {
	if (inflection.singularize(related) === related) {
		const relatedData = db.data[inflection.pluralize(related)] as Item[];
		if (!relatedData) {
			return item;
		}
		const foreignKey = `${related}Id`;
		const relatedItem = relatedData.find((relatedItem: Item) => {
			return relatedItem['id'] === item[foreignKey];
		});
		return { ...item, [related]: relatedItem };
	}
	const relatedData: Item[] = db.data[related] as Item[];

	if (!relatedData) {
		return item;
	}

	const foreignKey = `${inflection.singularize(name)}Id`;
	const relatedItems = relatedData.filter((relatedItem: Item) => relatedItem[foreignKey] === item['id']);

	return { ...item, [related]: relatedItems };
}

function randomId(): string {
	return randomBytes(2).toString('hex');
}

function fixItemsIds(items: Item[]) {
	items.forEach((item) => {
		if (typeof item['id'] === 'number') {
			item['id'] = item['id'].toString();
		}
		if (item['id'] === undefined) {
			item['id'] = randomId();
		}
	});
}

// Ensure all items have an id
function fixAllItemsIds(data: Data[]) {
	Object.values(data).forEach((value) => {
		if (Array.isArray(value)) {
			fixItemsIds(value);
		}
	});
}

export class Service {
	#dbs: MultiDBs;

	constructor(dbs: MultiDBs) {
		fixAllItemsIds(Object.values(dbs).map((db) => db.data));
		this.#dbs = dbs;
	}

	#get(db: string, name: string): Item[] | Item | undefined {
		if (name === '') return this.#dbs[db]?.data;
		return this.#dbs[db].data[name];
	}

	has(db: string, name: string): boolean {
		return Object.prototype.hasOwnProperty.call(this.#dbs[db]?.data, name);
	}

	findById(db: string, name: string, id: string, query: { _embed?: string[] | string }): Item | undefined {
		const value = this.#get(db, name);

		if (Array.isArray(value)) {
			let item = value.find((item) => item['id'] === id);
			ensureArray(query._embed).forEach((related) => {
				if (item !== undefined) item = embed(this.#dbs[db], name, item, related);
			});
			return item;
		}

		return;
	}

	find(
		db: string,
		name: string,
		query: {
			[key: string]: unknown;
			_embed?: string | string[];
			_sort?: string;
			_start?: number;
			_end?: number;
			_limit?: number;
			_page?: number;
			_per_page?: number;
		} = {},
	): Item[] | PaginatedItems | Item | undefined {
		let items = this.#get(db, name);

		if (!Array.isArray(items)) {
			return items;
		}

		// Include
		ensureArray(query._embed).forEach((related) => {
			if (items !== undefined && Array.isArray(items)) {
				items = items.map((item) => embed(this.#dbs[db], name, item, related));
			}
		});

		// Return list if no query params
		if (Object.keys(query).length === 0) {
			return items;
		}

		// Handle full-text search with q parameter
		if (query['q'] && typeof query['q'] === 'string') {
			const searchTerm = query['q'].toLowerCase();
			items = items.filter((item: Item) => {
				return this.#searchInItem(db, item, searchTerm);
			});
		}

		// Convert query params to conditions
		const conds: [string, Condition, string | string[]][] = [];
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined || typeof value !== 'string') {
				continue;
			}
			const re = /_(lt|lte|gt|gte|ne)$/;
			const reArr = re.exec(key);
			const op = reArr?.at(1);
			if (op && isCondition(op)) {
				const field = key.replace(re, '');
				conds.push([field, op, value]);
				continue;
			}
			if (['_embed', '_sort', '_start', '_end', '_limit', '_page', '_per_page', 'q'].includes(key)) {
				continue;
			}
			conds.push([key, Condition.default, value]);
		}

		// Loop through conditions and filter items
		let filtered = items;
		for (const [key, op, paramValue] of conds) {
			filtered = filtered.filter((item: Item) => {
				if (paramValue && !Array.isArray(paramValue)) {
					// https://github.com/sindresorhus/dot-prop/issues/95
					const itemValue: unknown = getProperty(item, key);
					switch (op) {
						// item_gt=value
						case Condition.gt: {
							if (!(typeof itemValue === 'number' && itemValue > parseInt(paramValue))) {
								return false;
							}
							break;
						}
						// item_gte=value
						case Condition.gte: {
							if (!(typeof itemValue === 'number' && itemValue >= parseInt(paramValue))) {
								return false;
							}
							break;
						}
						// item_lt=value
						case Condition.lt: {
							if (!(typeof itemValue === 'number' && itemValue < parseInt(paramValue))) {
								return false;
							}
							break;
						}
						// item_lte=value
						case Condition.lte: {
							if (!(typeof itemValue === 'number' && itemValue <= parseInt(paramValue))) {
								return false;
							}
							break;
						}
						// item_ne=value
						case Condition.ne: {
							switch (typeof itemValue) {
								case 'number':
									return itemValue !== parseInt(paramValue);
								case 'string':
									return itemValue !== paramValue;
								case 'boolean':
									return itemValue !== (paramValue === 'true');
							}
							break;
						}
						// item=value
						case Condition.default: {
							switch (typeof itemValue) {
								case 'number':
									return itemValue === parseInt(paramValue);
								case 'string':
									return itemValue === paramValue;
								case 'boolean':
									return itemValue === (paramValue === 'true');
								case 'undefined':
									return false;
							}
						}
					}
				}
				return true;
			});
		}

		// Sort
		const sort = query._sort || '';
		const sorted = sortOn(filtered, sort.split(','));

		// Slice
		const start = query._start;
		const end = query._end;
		const limit = query._limit;
		if (start !== undefined) {
			if (end !== undefined) {
				return sorted.slice(start, end);
			}
			return sorted.slice(start, start + (limit || 0));
		}
		if (limit !== undefined) {
			return sorted.slice(0, limit);
		}

		// Paginate
		let page = query._page;
		const perPage = query._per_page || 10;
		if (page) {
			const items = sorted.length;
			const pages = Math.ceil(items / perPage);

			// Ensure page is within the valid range
			page = Math.max(1, Math.min(page, pages));

			const first = 1;
			const prev = page > 1 ? page - 1 : null;
			const next = page < pages ? page + 1 : null;
			const last = pages;

			const start = (page - 1) * perPage;
			const end = start + perPage;
			const data = sorted.slice(start, end);

			return {
				first,
				prev,
				next,
				last,
				pages,
				items,
				data,
			};
		}

		return sorted.slice(start, end);
	}

	#searchInItem(db: string, item: Item, searchTerm: string): boolean {
		for (const [, value] of Object.entries(item)) {
			if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
				return true;
			}
			if (typeof value === 'object' && value !== null) {
				if (this.#searchInObject(value as Record<string, unknown>, searchTerm)) {
					return true;
				}
			}
		}
		return false;
	}

	#searchInObject(obj: Record<string, unknown>, searchTerm: string): boolean {
		for (const [, value] of Object.entries(obj)) {
			if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
				return true;
			}
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				if (this.#searchInObject(value as Record<string, unknown>, searchTerm)) {
					return true;
				}
			}
			if (Array.isArray(value)) {
				for (const arrayItem of value) {
					if (typeof arrayItem === 'string' && arrayItem.toLowerCase().includes(searchTerm)) {
						return true;
					}
					if (typeof arrayItem === 'object' && arrayItem !== null) {
						if (this.#searchInObject(arrayItem as Record<string, unknown>, searchTerm)) {
							return true;
						}
					}
				}
			}
		}
		return false;
	}
}
