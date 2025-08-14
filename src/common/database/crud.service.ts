// import { AppUtilities } from '@@/app.utilities';
// import { RequestWithUser } from '@@auth/interfaces';
// import {
//   HttpException,
//   Injectable,
//   NotAcceptableException,
//   NotFoundException,
// } from '@nestjs/common';
// import { Prisma, PrismaClient } from '@prisma/client';
// import { CrudMapType } from '../interfaces/crud-map-type.interface';
// import { Delegate } from '../interfaces/delegate.interface';
// import { Readable } from 'stream';

// type QuerySchema = { key: string; where: (val?: any, obj?: any) => any };

export interface PageCursorsType {
  first?: PageCursorType;
  previous: PageCursorType;
  around?: [PageCursorType];
  next: PageCursorType;
  last?: PageCursorType;
}

interface PageEdgeType {
  cursor: string;
  node: any;
}

export interface PageCursorType {
  cursor: string;
  page: number;
  isCurrent: boolean;
}

export interface PaginationType {
  pageEdges: [PageEdgeType];
  pageCursors: PageCursorsType;
  totalCount: number;
}

// @Injectable()
// export abstract class CrudService<D extends Delegate, T extends CrudMapType> {
//   constructor(protected delegate: D) {}

//   public getDelegate(): D {
//     return this.delegate;
//   }

//   public setDelegate(delegate: D) {
//     this.delegate = delegate;
//   }

//   public async aggregate(data: T['aggregate']) {
//     return await this.delegate.aggregate(data);
//   }

//   public async count(data: T['count']) {
//     return await this.delegate.count(data);
//   }

//   public async create(data: T['create']) {
//     return this.delegate.create(data);
//   }

//   public async createMany(data: T['createMany']) {
//     return this.delegate.createMany(data);
//   }

//   public async delete(data: T['delete'], authUser?: RequestWithUser) {
//     try {
//       return await this.delegate.delete(data);
//     } catch (error) {
//       if (error?.code === 'P2003') {
//         throw new NotAcceptableException(
//           "Record cannot be deleted because it's linked to other record(s)",
//         );
//       }
//       throw error;
//     }
//   }

//   public async deleteMany(data: T['deleteMany']) {
//     return this.delegate.deleteMany(data);
//   }

//   public async findFirst(data: T['findFirst']) {
//     return this.delegate.findFirst(data);
//   }

//   public async findFirstOrThrow(
//     data: T['findFirst'],
//     errorOrMessage?: string | HttpException,
//   ) {
//     const result = await this.delegate.findFirst(data);
//     if (!result) {
//       const error =
//         errorOrMessage && typeof errorOrMessage === 'string'
//           ? new NotFoundException(errorOrMessage)
//           : errorOrMessage;
//       throw error || new NotFoundException('Record not found!');
//     }
//     return result;
//   }

//   public async findMany(data: T['findMany']) {
//     return this.delegate.findMany(data);
//   }

//   public async findUnique(data: T['findUnique']) {
//     return this.delegate.findUnique(data);
//   }

//   public async findUniqueOrThrow(
//     data: T['findUnique'],
//     errorOrMessage?: string | HttpException,
//   ) {
//     const result = await this.delegate.findUnique(data);
//     if (!result) {
//       const error =
//         errorOrMessage && typeof errorOrMessage === 'string'
//           ? new NotFoundException(errorOrMessage)
//           : errorOrMessage;
//       throw error || new NotFoundException('Record not found!');
//     }
//     return result;
//   }

//   public async update(data: T['update']) {
//     return this.delegate.update(data);
//   }

//   public async updateMany(data: T['updateMany']) {
//     return this.delegate.updateMany(data);
//   }

//   public async upsert(data: T['upsert']) {
//     return this.delegate.upsert(data);
//   }

//   public async archive(id: string, authUser: RequestWithUser) {
//     return this.delegate.update({
//       where: { id },
//       data: { status: false, updatedBy: authUser.user.userId },
//     });
//   }

//   public async restoreArchived(id: string, authUser: RequestWithUser) {
//     return this.delegate.update({
//       where: { id },
//       data: { status: true, updatedBy: authUser.user.userId },
//     });
//   }

//   public parseQueryFilter(
//     { term, ...filters }: Record<string, any>,
//     querySchema: (string | QuerySchema)[],
//   ) {
//     let parsedTermFilters;
//     const parsedFilters = {
//       ...this.parseProps(filters, querySchema),
//       ...this.parseOneToOne(filters, querySchema),
//       ...this.parseOneToMany(filters, querySchema),
//       ...this.parseFilterFunction(filters, querySchema),
//     };
//     if (term) {
//       const parsedFilters = {
//         ...this.parseProps({ term }, querySchema),
//         ...this.parseOneToOne({ term }, querySchema),
//         ...this.parseOneToMany({ term }, querySchema),
//         ...this.parseFilterFunction({ term }, querySchema),
//       };
//       parsedTermFilters = {
//         OR: Object.entries(parsedFilters || {}).map(([key, val]) => ({
//           [key]: val,
//         })),
//       };
//     }
//     return {
//       ...parsedFilters,
//       ...parsedTermFilters,
//     };
//   }

//   public parseRawQueryFilter(
//     { term, ...filters }: Record<string, any>,
//     querySchema: (string | QuerySchema)[],
//   ) {
//     let parsedTermFilters = '';
//     const parsedFilters = [
//       ...this.parseRawProps(filters, querySchema),
//       ...this.parseRawFilterFunction(filters, querySchema),
//     ];

//     if (term) {
//       const parsedFilters = [...this.parseRawProps({ term }, querySchema)];
//       parsedTermFilters = `(${parsedFilters.join(' OR ')})`;
//     }

//     const query = term
//       ? ` ${[...parsedFilters, parsedTermFilters].join(' AND ')}`
//       : ` ${[...parsedFilters].join(' AND ')}`;

//     return query;
//   }

//   public async findManyPaginate(
//     args: any,
//     params: any = {},
//     dataMapper?: (row: any, data?: any[], cachedData?: any) => any,
//   ) {
//     const {
//       size = 25,
//       cursor,
//       // buttonNum,
//       orderBy: mOrderBy = args?.orderBy || 'createdAt',
//       direction = 'desc',
//       isPaginated = 'true',
//       paginationType,
//       page = 1,
//     } = params;

//     const orderBy =
//       typeof mOrderBy === 'string' ? { [mOrderBy]: direction } : mOrderBy;

//     if (isPaginated.toString().toLowerCase() === 'false') {
//       return this.findMany({ ...args, orderBy });
//     }

//     if (paginationType === 'page') {
//       const paginateData = {} as { skip?: number; take?: number };
//       const take = size ? parseInt(size) : 25;
//       paginateData.skip = (parseInt(page) - 1) * take; //limit  10);
//       paginateData.take = take;
//       const orderByCol = typeof mOrderBy === 'string' ? mOrderBy : undefined;

//       let results = await this.findMany({
//         ...args,
//         ...paginateData,
//         orderBy: {
//           [orderByCol || 'createdAt']: direction ? direction : 'desc',
//         },
//       });
//       const count =
//         (
//           await this.count({
//             select: { id: true },
//             where: args.where,
//           })
//         )?.id || 0;

//       if (dataMapper && Array.isArray(results)) {
//         let $__cachedData = {};
//         results = await Promise.all(
//           results.map(async (result) => {
//             const { $__cachedData: sharedCachedData, ...mResult } =
//               await dataMapper(result, results, $__cachedData);
//             if (sharedCachedData) {
//               $__cachedData = sharedCachedData;
//             }

//             return mResult;
//           }),
//         );
//       }

//       return {
//         pageItems: results,
//         pageMeta: {
//           itemCount: results.length,
//           totalItems: count,
//           itemsPerPage: take,
//           totalPages: Math.ceil(count / take),
//           currentPage: page,
//         },
//       };
//     }

//     const totalCount =
//       (
//         await this.delegate.count({
//           select: { id: true },
//           where: args.where,
//         })
//       )?.id || 0;

//     let decodedCursor: any = {};
//     if (cursor) {
//       try {
//         decodedCursor = JSON.parse(AppUtilities.decode(cursor));
//         args = {
//           ...args,
//           orderBy,
//           skip: decodedCursor.id ? 1 : 0,
//           take:
//             (((decodedCursor.last && totalCount % Number(size)) ||
//               Number(size)) +
//               1) *
//             decodedCursor.dir,
//           ...(decodedCursor.id && { cursor: { id: decodedCursor.id } }),
//         };
//       } catch (error) {
//         throw new NotAcceptableException('Invalid cursor!');
//       }
//     } else {
//       args.take = size + 1;
//       args.orderBy = orderBy;
//     }

//     let results = await this.delegate.findMany(args);
//     if (dataMapper && Array.isArray(results)) {
//       let $__cachedData = {};
//       results = await Promise.all(
//         results.map(async (result) => {
//           const { $__cachedData: sharedCachedData, ...mResult } =
//             await dataMapper(result, results, $__cachedData);
//           if (sharedCachedData) {
//             $__cachedData = sharedCachedData;
//           }

//           return mResult;
//         }),
//       );
//     }

//     // generate prev & next cursors
//     let first = null;
//     let previous = null;
//     let next = null;
//     let last = null;

//     if (Array.isArray(results) && !!results.length) {
//       const hasPrevious =
//         (decodedCursor.id &&
//           (decodedCursor.dir === 1 || results.length > size)) ||
//         (decodedCursor.last && totalCount > results.length) ||
//         null;

//       const hasNext =
//         (decodedCursor.id && decodedCursor.dir === -1) ||
//         (!decodedCursor.last && results.length > size) ||
//         null;

//       // take out added record
//       if (results.length > size) {
//         [1, undefined].includes(decodedCursor.dir)
//           ? results.pop()
//           : results.shift();
//       }

//       first = hasPrevious && {
//         cursor: AppUtilities.encode(JSON.stringify({ first: true, dir: 1 })),
//       };

//       last = hasNext && {
//         cursor: AppUtilities.encode(
//           JSON.stringify({
//             last: true,
//             dir: -1,
//           }),
//         ),
//       };

//       const previousCursor = AppUtilities.encode(
//         JSON.stringify({ id: results[0].id, dir: -1 }),
//       );
//       previous = hasPrevious && {
//         cursor: previousCursor,
//         page: null,
//         isCurrent: false,
//       };

//       const nextCursor = AppUtilities.encode(
//         JSON.stringify({ id: results[results.length - 1].id, dir: 1 }),
//       );
//       next = hasNext && {
//         cursor: nextCursor,
//         page: null,
//         isCurrent: false,
//       };
//     }

//     return {
//       pageEdges: results.map((result) => ({ cursor: null, node: result })),
//       pageCursors: { first, previous, next, last },
//       totalCount,
//     };
//   }

//   public async findManyRawPaginate(
//     query: Prisma.Sql,
//     prismaClient: PrismaClient,
//     params: any = {},
//     dataMapper?: (row: any, data?: any[], cachedData?: any) => any,
//   ) {
//     const {
//       size = 25,
//       cursor,
//       where,
//       orderBy: mOrderBy,
//       direction = 'desc',
//       isPaginated = 'true',
//       paginationType,
//       page,
//     } = params;

//     const orderBy =
//       typeof mOrderBy === 'string' ? { [mOrderBy]: direction } : mOrderBy;

//     let dCursor: any = {},
//       args = { skip: 0, take: parseInt(size), orderBy } as any;
//     if (cursor) {
//       try {
//         dCursor = JSON.parse(AppUtilities.decode(cursor));
//         args = {
//           ...args,
//           orderBy: orderBy || dCursor.orderBy,
//           skip:
//             dCursor.dir === -1
//               ? Math.max(args.skip * dCursor.skipped - args.take, 0)
//               : args.take * dCursor.skipped + args.take,
//         };
//       } catch (error) {
//         throw new NotAcceptableException('Invalid cursor!');
//       }
//     } else if (paginationType === 'page') {
//       args.skip = (parseInt(page) - 1) * args.take;
//     }

//     if (where && typeof where === 'object' && 'sql' in where) {
//       const whereSql = where.sql.trim();
//       if (whereSql && !whereSql.endsWith('WHERE')) {
//         query = Prisma.sql`SELECT * FROM (${query}) AS sb ${where}`;
//       }
//     } else if (where && typeof where === 'string' && where.trim()) {
//       query = Prisma.sql`SELECT * FROM (${query}) AS sb WHERE ${Prisma.raw(
//         where,
//       )}`;
//     }

//     if (args.orderBy) {
//       const orderByKeys = Object.keys(args.orderBy).join(', ');
//       const orderByValues = Object.values(args.orderBy).join(', ');

//       query = Prisma.sql`${query} ORDER BY "${Prisma.raw(
//         orderByKeys,
//       )}" ${Prisma.raw(orderByValues)}`;
//     }

//     if (isPaginated.toString().toLowerCase() === 'false') {
//       return prismaClient.$queryRaw(query);
//     }

//     const [{ count: totalCount }] = await prismaClient.$queryRaw<
//       [{ count: number }]
//     >(Prisma.sql`SELECT COUNT(*) FROM (${query}) AS subquery`);

//     query = Prisma.sql`${query} OFFSET ${args.skip} LIMIT ${args.take}`;

//     let results: any[] = await prismaClient.$queryRaw(query);

//     if (dataMapper && Array.isArray(results)) {
//       let $__cachedData = {};
//       results = await Promise.all<any>(
//         results.map(async (result) => {
//           const { $__cachedData: sharedCachedData, ...mResult } =
//             await dataMapper(result, results as any, $__cachedData);
//           if (sharedCachedData) {
//             $__cachedData = sharedCachedData;
//           }

//           return mResult;
//         }),
//       );
//     }

//     if (paginationType === 'page') {
//       return {
//         pageItems: results,
//         pageMeta: {
//           itemCount: results.length,
//           totalItems: Number(totalCount || 0),
//           itemsPerPage: args.take,
//           totalPages: Math.ceil(Number(totalCount || 0) / args.take),
//           currentPage: page,
//         },
//       };
//     }

//     // generate prev & next cursors
//     let previous = null;
//     let next = null;
//     if (Array.isArray(results) && !!results.length) {
//       const skipped = Math.floor(args.skip / args.take) || 0;
//       const hasPrevious = dCursor.dir === 1 || (!!cursor && args.skip) || null;
//       const hasNext =
//         dCursor.dir === -1 || totalCount > size * (skipped + 1) || null;

//       // take out added record
//       if (results.length > size) {
//         [1, undefined].includes(dCursor.dir) ? results.pop() : results.shift();
//       }

//       const previousCursor = AppUtilities.encode(
//         JSON.stringify({
//           id: results[0].id,
//           dir: -1,
//           orderBy,
//           skipped: skipped > 1 ? dCursor.skipped-- : skipped,
//         }),
//       );
//       previous = hasPrevious && {
//         cursor: previousCursor,
//         page: null,
//         isCurrent: false,
//       };

//       const nextCursor = AppUtilities.encode(
//         JSON.stringify({
//           id: results[results.length - 1].id,
//           dir: 1,
//           orderBy,
//           skipped,
//         }),
//       );
//       next = hasNext && {
//         cursor: nextCursor,
//         page: null,
//         isCurrent: false,
//       };
//     }

//     return {
//       pageEdges: results.map((result) => ({ cursor: null, node: result })),
//       pageCursors: { previous, next },
//       totalCount: Number(totalCount || 0),
//     };
//   }

//   public findManyStream(
//     args: any,
//     params: any = {},
//     dataMapper?: (row: any, data?: any[], cachedData?: any) => any,
//   ): Readable {
//     const {
//       batchSize = 1000,
//       idField = 'id',
//       orderBy: mOrderBy = args?.orderBy || 'createdAt',
//       direction = 'desc',
//     } = params;

//     args.orderBy =
//       typeof mOrderBy === 'string' ? { [mOrderBy]: direction } : mOrderBy;

//     let cursorID: number;

//     // eslint-disable-next-line @typescript-eslint/no-this-alias
//     const that = this;

//     return new Readable({
//       objectMode: true,
//       highWaterMark: batchSize,
//       async read() {
//         try {
//           let results = await that.delegate.findMany({
//             ...args,
//             take: batchSize,
//             skip: cursorID ? 1 : 0,
//             cursor: cursorID
//               ? {
//                   [idField]: cursorID,
//                 }
//               : undefined,
//           });

//           if (dataMapper && Array.isArray(results)) {
//             let $__cachedData = {};
//             results = await Promise.all(
//               results.map(async (result) => {
//                 const { $__cachedData: sharedCachedData, ...mResult } =
//                   await dataMapper(result, results, $__cachedData);
//                 if (sharedCachedData) {
//                   $__cachedData = sharedCachedData;
//                 }

//                 return mResult;
//               }),
//             );
//           }

//           this.push(results);

//           if (results.length < batchSize) {
//             this.push(null);
//             return;
//           }
//           cursorID = (<any>results[results.length - 1])[idField];
//         } catch (err: any) {
//           console.error(err);
//           this.destroy(err);
//         }
//       },
//     });
//   }

//   private parseProps(
//     { term, ...filters }: Record<string, string | number>,
//     querySchema: (string | QuerySchema)[],
//   ) {
//     return querySchema.reduce((acc, q) => {
//       const [key, modifier = 'contains'] = String(q).split('|');
//       if (
//         typeof q === 'string' &&
//         !q.match(/[\.:]/) &&
//         (typeof filters[String(key)] !== 'undefined' ||
//           (!!term && modifier === 'contains'))
//       ) {
//         const mode = modifier === 'contains' ? { mode: 'insensitive' } : {};
//         acc[String(key)] = {
//           [modifier]: filters[String(key)] || term,
//           ...mode,
//         };
//       }
//       return acc;
//     }, {});
//   }

//   private parseOneToOne(
//     { term, ...filters }: Record<string, string | number>,
//     querySchema: (string | QuerySchema)[],
//   ) {
//     return querySchema.reduce((acc, q) => {
//       if (typeof q !== 'string' || q.indexOf('.') === -1) {
//         return acc;
//       }
//       const [key, modifier = 'contains'] = String(q).split('|');
//       const [parent, relation] = String(key).split('.');
//       if (
//         (typeof filters[relation] === 'undefined' && !term) ||
//         (!!term && modifier !== 'contains')
//       ) {
//         return acc;
//       }
//       const mode = modifier === 'contains' ? { mode: 'insensitive' } : {};
//       if (!acc[parent]) {
//         acc[parent] = term ? { OR: [] } : { AND: [] };
//       }
//       const aggregator = term ? acc[parent].OR : acc[parent].AND;
//       aggregator.push({
//         [relation]: {
//           [modifier]: filters[relation] || term,
//           ...mode,
//         },
//       });

//       return acc;
//     }, {});
//   }

//   private parseRawProps(
//     { term, ...filters }: Record<string, string | number>,
//     querySchema: (string | QuerySchema)[],
//   ) {
//     return querySchema.reduce((acc, q) => {
//       const [key, modifier = 'contains'] = String(q).split('|');

//       // Sanitize and convert values to strings safely
//       const filterValue = filters[String(key)];
//       const termValue = term;

//       // Strict type checking and value conversion
//       const val =
//         filterValue !== undefined
//           ? String(filterValue).trim()
//           : termValue !== undefined
//             ? String(termValue).trim()
//             : '';

//       if (
//         typeof q === 'string' &&
//         !q.match(/[\.:]/) &&
//         (filterValue !== undefined || (!!termValue && modifier === 'contains'))
//       ) {
//         // Escape special characters to prevent SQL injection
//         const escapedVal = val.replace(/'/g, "''");

//         const whereClause =
//           modifier === 'contains'
//             ? ` "${key}" ILIKE '%${escapedVal}%' `
//             : ` "${key}" = '${escapedVal}' `;

//         acc.push(whereClause);
//       }
//       return acc;
//     }, []);
//   }

//   private parseRawFilterFunction(
//     filters: Record<string, string | number>,
//     querySchema: (string | QuerySchema)[],
//   ): string[] {
//     const parsed = querySchema.reduce((acc, q) => {
//       // Ensure q is not a string and has a key
//       if (
//         typeof q !== 'string' &&
//         q.key &&
//         typeof filters[q.key] !== 'undefined'
//       ) {
//         try {
//           // Add error handling for custom where function
//           const query = q.where(filters[q.key], filters);
//           if (query) acc.push(query);
//         } catch (error) {
//           console.error(`Error in filter function for key ${q.key}:`, error);
//         }
//       }
//       return acc;
//     }, []);

//     return parsed;
//   }

//   private parseOneToMany(
//     { term, ...filters }: Record<string, string | number>,
//     querySchema: (string | QuerySchema)[],
//   ) {
//     return querySchema.reduce((acc, q) => {
//       // Skip if not a string or doesn't contain ':'
//       if (typeof q !== 'string' || q.indexOf(':') === -1) {
//         return acc;
//       }

//       const [key, modifier = 'contains'] = String(q).split('|');
//       const [parent, relation] = String(key).split(':');

//       // Safely convert values to strings
//       const relationValue =
//         filters[relation] !== undefined
//           ? String(filters[relation]).trim()
//           : term !== undefined
//             ? String(term).trim()
//             : '';

//       if (
//         (filters[relation] === undefined && !term) ||
//         (!!term && modifier !== 'contains')
//       ) {
//         return acc;
//       }

//       const mode = modifier === 'contains' ? { mode: 'insensitive' } : {};
//       acc[parent] = {
//         some: {
//           [relation]: {
//             [modifier]: relationValue,
//             ...mode,
//           },
//         },
//       };

//       return acc;
//     }, {});
//   }

//   private parseFilterFunction(
//     filters: Record<string, string | number>,
//     querySchema: (string | QuerySchema)[],
//   ) {
//     const parsed = querySchema.reduce((acc, q) => {
//       if (typeof q !== 'string' && typeof filters[q.key] !== 'undefined') {
//         const query = q.where(filters[q.key], filters);
//         if (query) acc.push(query);
//       }
//       return acc;
//     }, []);

//     return parsed.length ? { AND: parsed } : undefined;
//   }
// }
