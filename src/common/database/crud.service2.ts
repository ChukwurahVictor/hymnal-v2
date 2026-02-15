import {
  HttpException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import {
  DecodedCursor,
  EnumFilterConfig,
  EnumOperator,
  Filters,
  FilterOperator,
  FilterValue,
  PaginatedResult,
  PaginationParams,
  QueryArgs,
  QuerySchema,
} from '@@/common/interfaces/pagination.interface';
import { Delegate } from '@@/common/interfaces/delegate.interface';
import { CrudMapType } from '@@/common/interfaces/crud-map-type.interface';
import { AppUtilities } from '@@/common/utilities';
import { Prisma, PrismaClient } from '@prisma/client';

const DEFAULT_PAGINATION_SIZE = 25;

@Injectable()
export abstract class CrudService<D extends Delegate, T extends CrudMapType> {
  constructor(protected readonly delegate: D) {}

  /**
   * Retrieves the underlying delegate instance.
   * @returns The delegate object
   */
  getDelegate(): D {
    return this.delegate;
  }

  async aggregate(
    data: T['aggregate'],
  ): Promise<Awaited<ReturnType<D['aggregate']>>> {
    return (await this.delegate.aggregate(data)) as Awaited<
      ReturnType<D['aggregate']>
    >;
  }

  async count(data: T['count']): Promise<Awaited<ReturnType<D['count']>>> {
    return (await this.delegate.count(data)) as Awaited<ReturnType<D['count']>>;
  }

  async create(data: T['create']): Promise<Awaited<ReturnType<D['create']>>> {
    return (await this.delegate.create(data)) as Awaited<
      ReturnType<D['create']>
    >;
  }

  async createMany(
    data: T['createMany'],
  ): Promise<Awaited<ReturnType<D['createMany']>>> {
    return (await this.delegate.createMany(data)) as Awaited<
      ReturnType<D['createMany']>
    >;
  }

  async delete(data: T['delete']): Promise<Awaited<ReturnType<D['delete']>>> {
    return (await this.delegate.delete(data)) as Awaited<
      ReturnType<D['delete']>
    >;
  }

  async deleteMany(
    data: T['deleteMany'],
  ): Promise<Awaited<ReturnType<D['deleteMany']>>> {
    return (await this.delegate.deleteMany(data)) as Awaited<
      ReturnType<D['deleteMany']>
    >;
  }

  async findFirst(
    data: T['findFirst'],
  ): Promise<Awaited<ReturnType<D['findFirst']>>> {
    return (await this.delegate.findFirst(data)) as Awaited<
      ReturnType<D['findFirst']>
    >;
  }

  // Extract error handling to a separate method
  private handleNotFound(errorOrMessage?: string | HttpException): never {
    throw typeof errorOrMessage === 'string'
      ? new NotFoundException(errorOrMessage)
      : errorOrMessage || new NotFoundException('Record not found!');
  }

  /**
   * Finds the first record or throws an exception if not found.
   * @param data - Query data
   * @param errorOrMessage - Custom error message or exception
   * @throws {NotFoundException} If no record is found
   */
  async findFirstOrThrow(
    data: T['findFirst'],
    errorOrMessage?: string | HttpException,
  ): Promise<NonNullable<Awaited<ReturnType<D['findFirst']>>>> {
    const result = (await this.delegate.findFirst(data)) as Awaited<
      ReturnType<D['findFirst']>
    >;
    if (!result) {
      this.handleNotFound(errorOrMessage);
    }
    return result;
  }

  async findMany(
    data: T['findMany'],
  ): Promise<Awaited<ReturnType<D['findMany']>>> {
    return (await this.delegate.findMany(data)) as Awaited<
      ReturnType<D['findMany']>
    >;
  }

  async findUnique(
    data: T['findUnique'],
  ): Promise<Awaited<ReturnType<D['findUnique']>>> {
    return (await this.delegate.findUnique(data)) as Awaited<
      ReturnType<D['findUnique']>
    >;
  }

  /**
   * Finds a unique record or throws an exception if not found.
   * @param data - Query data
   * @param errorOrMessage - Custom error message or exception
   * @throws {NotFoundException} If no record is found
   */
  async findUniqueOrThrow(
    data: T['findUnique'],
    errorOrMessage?: string | HttpException,
  ): Promise<NonNullable<Awaited<ReturnType<D['findUnique']>>>> {
    const result = (await this.delegate.findUnique(data)) as Awaited<
      ReturnType<D['findUnique']>
    >;
    if (!result) {
      this.handleNotFound(errorOrMessage);
    }
    return result;
  }

  async update(data: T['update']): Promise<Awaited<ReturnType<D['update']>>> {
    return (await this.delegate.update(data)) as Awaited<
      ReturnType<D['update']>
    >;
  }

  async updateMany(
    data: T['updateMany'],
  ): Promise<Awaited<ReturnType<D['updateMany']>>> {
    return (await this.delegate.updateMany(data)) as Awaited<
      ReturnType<D['updateMany']>
    >;
  }

  async upsert(data: T['upsert']): Promise<Awaited<ReturnType<D['upsert']>>> {
    return (await this.delegate.upsert(data)) as Awaited<
      ReturnType<D['upsert']>
    >;
  }

  // -- Query Filtering --
  /**
   * Parses query filters based on provided schema, with enhanced type handling.
   * @param filters - Filter conditions
   * @param querySchema - Schema defining filter structure
   * @returns Parsed filter object
   */
  parseQueryFilter(
    filters: Filters,
    querySchema: (string | QuerySchema)[],
  ): Record<string, unknown> {
    const { term, ...restFilters } = filters;
    const fieldFilters = {
      ...this.parseProps(restFilters, querySchema),
      ...this.parseOneToOne(restFilters, querySchema),
      ...this.parseOneToMany(restFilters, querySchema),
      ...this.parseFilterFunction(restFilters, querySchema),
    };

    if (!term) return fieldFilters;

    // Generate term filters from string fields
    const stringTermFilters = Object.entries({
      ...this.parseProps({ term }, querySchema),
      ...this.parseOneToOne({ term }, querySchema),
      ...this.parseOneToMany({ term }, querySchema),
    })?.map(([key, value]) => ({
      [key]: value as FilterValue,
    }));

    // Generate enum filters from schema for term
    const enumFilters = querySchema
      .filter(
        (q): q is QuerySchema => typeof q !== 'string' && q.dataType === 'enum',
      )
      .map((q) => {
        const query = q.where(undefined, { term });
        return query ? { ...query } : null;
      })
      .filter(Boolean);

    // Combine string and enum term filters
    const termFilters = {
      OR: [...stringTermFilters, ...enumFilters],
    };

    return { ...fieldFilters, ...termFilters };
  }

  // -- Enhanced Parsing Methods --
  /**
   * Parses and processes schema fields with appropriate type handling
   * @param filters - Filter values
   * @param querySchema - Schema definition
   * @returns Processed filter conditions
   */
  private parseProps(
    { term, ...filters }: Filters,
    querySchema: (string | QuerySchema)[],
  ): Record<string, unknown> {
    return querySchema?.reduce(
      (acc, q) => {
        if (typeof q !== 'string') return acc;

        const [key, opRaw = 'contains'] = q.split('|');
        const operator = opRaw as FilterOperator;

        // Skip relations or complex formats
        if (q.match(/[.:]/) || !key) return acc;

        // Process only if we have a filter value or are searching with term
        if (
          filters[key] !== undefined ||
          (term && this.isTextSearchOperator(operator))
        ) {
          const value = filters[key] ?? term;
          const inferredType = this.inferDataType(value);

          // Apply filter based on data type
          acc[key] = this.createFilterCondition(operator, value, inferredType);
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  /**
   * Determines if an operator is valid for text search
   */
  private isTextSearchOperator(operator: FilterOperator): boolean {
    return ['contains', 'startsWith', 'endsWith'].includes(operator as string);
  }

  /**
   * Enhanced parseOneToOne with better type handling
   */
  private parseOneToOne(
    { term, ...filters }: Filters,
    querySchema: (string | QuerySchema)[],
  ): Record<string, unknown> {
    return querySchema.reduce(
      (acc, q) => {
        // Skip non-string or non-relation queries
        if (typeof q !== 'string' || !q.includes('.')) return acc;

        const [key, opRaw = 'contains'] = q.split('|');
        const operator = opRaw as FilterOperator;
        const [parent, relation] = key.split('.');

        // Check if we need to process this relation
        if (
          (filters[relation] === undefined && !term) ||
          (term && !this.isTextSearchOperator(operator))
        ) {
          return acc;
        }

        // Set up search mode and query structure
        const value = filters[relation] ?? term;
        const inferredType = this.inferDataType(value);
        const filterCondition = this.createFilterCondition(
          operator,
          value,
          inferredType,
        );

        // Initialize the parent object if needed
        if (!acc[parent]) {
          acc[parent] = term ? { OR: [] } : { AND: [] };
        }

        // Add to the query array based on the condition type
        const queryArray = term
          ? (acc[parent] as { OR: any[]; AND?: any[] }).OR
          : (acc[parent] as { OR?: any[]; AND: any[] }).AND;

        queryArray.push({
          [relation]: filterCondition,
        });

        return acc;
      },
      {} as Record<string, any>,
    );
  }

  /**
   * Enhanced parseOneToMany with better type handling
   */
  private parseOneToMany(
    { term, ...filters }: Filters,
    querySchema: (string | QuerySchema)[],
  ): Record<string, unknown> {
    return querySchema.reduce(
      (acc, q) => {
        // Skip non-string or non-many-relation queries
        if (typeof q !== 'string' || !q.includes(':')) return acc;

        const [key, opRaw = 'contains'] = q.split('|');
        const operator = opRaw as FilterOperator;
        const [parent, relation] = key.split(':');

        const value = filters[relation] ?? term;

        // Skip if no value to filter with or operator incompatible with text search
        if (
          (filters[relation] === undefined && !term) ||
          (term && !this.isTextSearchOperator(operator))
        ) {
          return acc;
        }

        // Create filter condition based on data type
        const inferredType = this.inferDataType(value);
        const filterCondition = this.createFilterCondition(
          operator,
          value,
          inferredType,
        );

        // Create the "some" query for many-relation
        acc[parent] = {
          some: {
            [relation]: filterCondition,
          },
        };

        return acc;
      },
      {} as Record<string, any>,
    );
  }

  /**
   * Enhanced parseFilterFunction with type inference
   */
  private parseFilterFunction(
    filters: Filters,
    querySchema: (string | QuerySchema)[],
  ): Record<string, unknown> | undefined {
    const filterClauses = querySchema.reduce(
      (acc: Record<string, any>[], q) => {
        if (typeof q === 'string' || filters[q.key] === undefined) return acc;

        // If schema specifies a data type, convert the value accordingly
        let value = filters[q.key];
        if (q.dataType) {
          value = this.convertValueToType(value, q.dataType) as FilterValue;
        }

        const query = q.where(value, filters);
        if (query) acc.push(query);

        return acc;
      },
      [] as Record<string, any>[],
    );

    return filterClauses.length ? { AND: filterClauses } : undefined;
  }

  // Raw SQL query support
  /**
   * Generates a raw SQL query string from filters with enhanced type handling.
   * @param filters - Filter conditions
   * @param querySchema - Schema for parsing
   * @returns Raw SQL query string
   */
  public parseRawQueryFilter(
    filters: Filters,
    querySchema: (string | QuerySchema)[],
  ): string {
    const { term, ...restFilters } = filters;

    // Generate base clauses and term clauses separately
    const baseClauses = [
      ...this.parseRawProps(restFilters, querySchema),
      ...this.parseRawFilterFunction(restFilters, querySchema),
    ];

    // Build term clause if term is provided
    let termClause = '';
    if (term) {
      const termClauses = this.parseRawProps({ term }, querySchema);
      if (termClauses.length) {
        termClause = `(${termClauses.join(' OR ')})`;
      }
    }

    // Combine all non-empty clauses with AND
    const allClauses = [...baseClauses, termClause].filter(Boolean);
    return allClauses.length ? allClauses.join(' AND ') : '';
  }

  /**
   * Enhanced parseRawProps with better SQL generation for different data types
   */
  private parseRawProps(
    { term, ...filters }: Filters,
    querySchema: (string | QuerySchema)[],
  ): string[] {
    return querySchema.reduce((clauses: string[], schema) => {
      // Only process string schemas without relations
      if (typeof schema === 'string' && !/[.:]/.test(schema)) {
        const [key, operator = 'contains'] = schema.split('|');

        if (
          filters[key] !== undefined ||
          (term && this.isTextSearchOperator(operator as FilterOperator))
        ) {
          const value = filters[key] ?? term;
          const inferredType = this.inferDataType(value);

          // Generate SQL based on data type and operator
          const clause = this.createRawSqlCondition(
            key,
            operator as FilterOperator,
            value,
            inferredType,
          );
          if (clause) {
            clauses.push(clause);
          }
        }
      }
      return clauses;
    }, []);
  }

  private parseRawFilterFunction(
    filters: Filters,
    querySchema: (string | QuerySchema)[],
  ): string[] {
    return querySchema.reduce((clauses: string[], schema) => {
      if (typeof schema !== 'string' && filters[schema.key] !== undefined) {
        // If schema defines a dataType, convert value accordingly
        let value = filters[schema.key];
        if (schema.dataType) {
          value = this.convertValueToType(
            value,
            schema.dataType,
          ) as FilterValue;
        }

        const clause = schema.where(value, filters);
        if (clause && typeof clause === 'string') clauses.push(clause);
      }
      return clauses;
    }, []);
  }

  // -- Pagination --
  /**
   * Retrieves multiple records with optional pagination.
   * @param args - Query arguments (where, orderBy, etc.)
   * @param params - Pagination parameters (size, cursor, etc.)
   * @param dataMapper - Optional function to transform results
   * @returns Paginated results or all records if pagination is disabled
   * @throws {NotAcceptableException} If cursor is invalid or parameters are incorrect
   */
  async findManyPaginate<R = any>(
    args: QueryArgs,
    params: PaginationParams = {},
    dataMapper?: (row: any, data?: any[], cachedData?: any) => Promise<any>,
  ): Promise<PaginatedResult<R>> {
    const {
      size = DEFAULT_PAGINATION_SIZE,
      cursor,
      paginationType = 'page',
      page = 1,
      direction = 'desc',
      isPaginated = 'true',
      orderBy: requestedOrderBy = 'createdAt',
    } = params;

    // Sanitize orderBy string to allow only alphanumeric and underscore
    // CRITICAL TODO: Replace this with a whitelist validation of allowed sortable fields for the entity.
    const sanitizedOrderByString =
      typeof requestedOrderBy === 'string'
        ? requestedOrderBy.replace(/[^a-zA-Z0-9_]/g, '')
        : undefined;

    const orderBy = sanitizedOrderByString
      ? { [sanitizedOrderByString]: direction }
      : typeof requestedOrderBy === 'object'
        ? requestedOrderBy
        : { createdAt: direction }; // Fallback if string is invalid or object provided

    // Skip pagination if not required
    if (isPaginated.toString().toLowerCase() === 'false') {
      return { pageItems: (await this.findMany({ ...args, orderBy })) as R[] };
    }

    // Get total count once to avoid duplicate queries
    const totalCount = await this.getTotalCount(args?.where);

    // Handle page-based pagination
    if (paginationType === 'page') {
      return this.handlePageBasedPagination<R>(
        args,
        {
          size: Number(size),
          page: Number(page),
          orderBy,
          totalCount,
        },
        dataMapper,
      );
    }

    // Handle cursor-based pagination
    return this.handleCursorPagination<R>(
      args,
      {
        size: Number(size),
        cursor,
        direction,
        orderBy,
        totalCount,
      },
      dataMapper,
    );
  }

  // Helper method to get total count
  private async getTotalCount(where?: Record<string, any>): Promise<number> {
    const countResult =
      ((
        (await this.delegate.count({
          select: { id: true },
          where,
        })) as Record<string, any>
      )?.id as number) || 0;

    return countResult;
  }

  // Handle page-based pagination logic
  /**
   * Handles page-based pagination logic.
   * @param args - Query arguments
   * @param params - Pagination parameters
   * @param totalCount - Total number of records
   * @param dataMapper - Optional result transformation function
   * @returns Page-based pagination result
   */
  private async handlePageBasedPagination<R>(
    args: QueryArgs,
    options: {
      size: number;
      page: number;
      orderBy: Record<string, any>;
      totalCount: number;
    },
    dataMapper?: (row: any, data?: any[], cachedData?: any) => Promise<any>,
  ): Promise<PaginatedResult<R>> {
    const { size, page, orderBy, totalCount } = options;
    const take = size || DEFAULT_PAGINATION_SIZE;
    const skip = (page - 1) * take;

    const results = await this.findMany({ ...args, skip, take, orderBy });
    const mappedResults = dataMapper
      ? await this.mapResults(results as any[], dataMapper)
      : (results as any[]);

    return {
      pageItems: mappedResults,
      pageMeta: {
        itemCount: mappedResults?.length || 0,
        totalItems: totalCount,
        itemsPerPage: take,
        totalPages: Math.ceil(totalCount / take),
        currentPage: page,
      },
    };
  }

  // Handle cursor-based pagination logic
  /**
   * Handles cursor-based pagination logic.
   * @param args - Query arguments
   * @param params - Pagination parameters
   * @param totalCount - Total number of records
   * @param dataMapper - Optional result transformation function
   * @returns Cursor-based pagination result
   * @throws {NotAcceptableException} If cursor is invalid
   */
  private async handleCursorPagination<R>(
    args: QueryArgs,
    options: {
      size: number;
      cursor?: string;
      direction: 'asc' | 'desc';
      orderBy: Record<string, any>;
      totalCount: number;
    },
    dataMapper?: (row: any, data?: any[], cachedData?: any) => Promise<any>,
  ): Promise<PaginatedResult<R>> {
    const { size, cursor, direction, orderBy, totalCount } = options;
    let paginationArgs = { ...args };
    let decodedCursor = {} as DecodedCursor;

    // Process cursor if provided
    if (cursor) {
      try {
        decodedCursor = JSON.parse(
          AppUtilities.decode(cursor),
        ) as DecodedCursor;

        paginationArgs = {
          ...paginationArgs,
          orderBy,
          skip: decodedCursor.id ? 1 : 0,
          take:
            ((decodedCursor.last && totalCount % size) || size + 1) *
            decodedCursor.dir,
          ...(decodedCursor.id && { cursor: { id: decodedCursor.id } }),
        };
      } catch {
        throw new NotAcceptableException('Invalid cursor format');
      }
    } else {
      paginationArgs.take = size + 1;
      paginationArgs.orderBy = orderBy;
    }

    // Ensure stable sort order by appending id
    paginationArgs.orderBy = Array.isArray(paginationArgs.orderBy)
      ? [
          ...(paginationArgs.orderBy as Record<string, any>[]),
          { id: direction },
        ]
      : [paginationArgs.orderBy as Record<string, any>, { id: direction }];

    // Fetch results and apply data mapping
    let results = (await this.delegate.findMany(paginationArgs)) as any[];
    results = dataMapper ? await this.mapResults(results, dataMapper) : results;

    // Generate cursor links
    return this.generateCursorLinks(results, {
      size,
      decodedCursor,
      totalCount,
    });
  }

  // Generate cursor pagination links
  private generateCursorLinks<R>(
    results: R[],
    options: {
      size: number;
      decodedCursor: DecodedCursor;
      totalCount: number;
    },
  ): PaginatedResult<R> {
    const { size, decodedCursor, totalCount } = options;

    if (!results?.length) {
      return {
        pageEdges: [],
        pageCursors: {
          first: false,
          previous: false,
          next: false,
          last: false,
          hasNext: false,
          hasPrevious: false,
        },
        totalCount,
      };
    }

    // Determine if there are previous/next pages
    const hasPrevious =
      decodedCursor?.dir === 1 || (decodedCursor.id && results?.length > size);
    const hasNext = decodedCursor?.dir === -1 || results?.length > size;

    // Handle case when we fetched one extra item to check for more pages
    if (results?.length > size) {
      if (decodedCursor.dir === 1 || decodedCursor.dir === undefined) {
        results.pop();
      } else {
        results.shift();
      }
    }

    // Create cursor links
    const firstId = (results[0] as { id: string })?.id;
    const lastId = (results[results.length - 1] as { id: string })?.id;

    // Encode cursor links
    const firstCursor = hasPrevious && {
      cursor: AppUtilities.encode(JSON.stringify({ id: firstId, dir: 1 })),
      page: null,
      isCurrent: false,
    };

    const lastCursor = hasNext && {
      cursor: AppUtilities.encode(JSON.stringify({ id: lastId, dir: -1 })),
      page: null,
      isCurrent: false,
    };

    const previousCursor = hasPrevious && {
      cursor: AppUtilities.encode(JSON.stringify({ id: firstId, dir: -1 })),
      page: null,
      isCurrent: false,
    };

    const nextCursor = hasNext && {
      cursor: AppUtilities.encode(JSON.stringify({ id: lastId, dir: 1 })),
      page: null,
      isCurrent: false,
    };

    return {
      pageEdges: results,
      pageCursors: {
        first: firstCursor || false,
        previous: previousCursor || false,
        next: nextCursor,
        last: lastCursor,
        hasNext,
        hasPrevious,
      },
      totalCount,
    };
  }

  // Multiple data source pagination
  public async paginateMultipleResult<R>(
    dataArrays: any[][],
    params: PaginationParams = {},
    dataMapper?: (row: any, data?: any[], cachedData?: any) => Promise<any>,
  ): Promise<PaginatedResult<R>> {
    const {
      isPaginated = true,
      page = 1,
      size = DEFAULT_PAGINATION_SIZE,
      orderBy: rawOrderBy,
      direction = 'desc',
    } = params;

    // Format the orderBy parameter
    const orderBy =
      typeof rawOrderBy === 'string' ? { [rawOrderBy]: direction } : rawOrderBy;

    // Flatten arrays using built-in flat
    let mergedResults = dataArrays.flat();

    // Apply sorting if orderBy is provided
    if (orderBy) {
      mergedResults = mergedResults.sort((a, b) =>
        this.sortByOrder(a, b, orderBy),
      );
    }

    // If not paginated, return all results
    if (!isPaginated) {
      const processedResults = dataMapper
        ? await this.mapResults(mergedResults, dataMapper)
        : mergedResults;

      return {
        pageItems: processedResults,
        pageMeta: {
          itemCount: processedResults.length,
          totalItems: processedResults.length,
          itemsPerPage: processedResults.length,
          totalPages: 1,
          currentPage: 1,
        },
      };
    }

    // Paginate results
    const take = Number(size);
    const offset = (Number(page) - 1) * take;
    let paginatedResults = mergedResults.slice(offset, offset + take);

    // Apply data mapping if provided
    paginatedResults = dataMapper
      ? await this.mapResults(paginatedResults, dataMapper)
      : paginatedResults;

    // Build pagination metadata
    const totalItems = mergedResults.length;
    const pageMeta = {
      itemCount: paginatedResults.length,
      totalItems,
      itemsPerPage: take,
      totalPages: Math.ceil(totalItems / take),
      currentPage: Number(page),
    };

    return { pageItems: paginatedResults, pageMeta };
  }

  // -- Helper Method to Map Data --
  /**
   * Maps results in batches to improve performance with large datasets.
   * @param results - Array of results to map
   * @param dataMapper - Transformation function
   * @returns Transformed results
   */
  private async mapResults<T>(
    results: T[],
    dataMapper: (
      row: T,
      data?: T[],
      cachedData?: Record<string, any>,
    ) => Promise<{ $__cachedData?: Record<string, any>; [key: string]: any }>,
  ): Promise<any[]> {
    let cachedData: Record<string, any> = {};

    return Promise.all(
      results?.map(async (result: T) => {
        const { $__cachedData: sharedData, ...mapped } = await dataMapper(
          result,
          results,
          cachedData,
        );

        if (sharedData) cachedData = { ...cachedData, ...sharedData };
        return mapped;
      }),
    );
  }

  /**
   * Executes a paginated raw SQL query with filtering and sorting capabilities
   * @param query - The base SQL query
   * @param prismaClient - Prisma client instance
   * @param params - Pagination, filtering, and sorting parameters
   * @param dataMapper - Optional function to transform result rows
   * @returns Paginated results with metadata
   */
  public async findManyRawPaginate(
    query: Prisma.Sql,
    prismaClient: PrismaClient,
    params: PaginationParams = {},
    dataMapper?: (row: any, data?: any[], cachedData?: any) => any,
  ) {
    // Extract and normalize pagination parameters
    const {
      size = DEFAULT_PAGINATION_SIZE,
      where,
      orderBy: rawOrderBy,
      direction = 'desc',
      isPaginated = 'true',
      page = 1,
    } = params;

    // Validate pagination parameters
    const pageNum = Math.max(1, Number(page));
    const pageSize = Math.max(1, Number(size));

    // Return unpaginated results if pagination is disabled
    if (isPaginated.toString().toLowerCase() === 'false') {
      return prismaClient.$queryRaw(query);
    }

    // Build the query
    let finalQuery = query;

    // Apply WHERE clause if provided
    if (where?.trim?.()) {
      finalQuery = Prisma.sql`SELECT * FROM (${finalQuery}) AS sb WHERE ${Prisma.raw(where)}`;
    }

    // Calculate pagination parameters
    const skip = (pageNum - 1) * pageSize;

    // Normalize orderBy parameter
    const orderBy =
      typeof rawOrderBy === 'string' ? { [rawOrderBy]: direction } : rawOrderBy;

    // Apply ORDER BY clause if provided
    if (orderBy && Object.keys(orderBy).length > 0) {
      const orderEntries = Object.entries(orderBy);

      const orderClauses = orderEntries
        .map(([column, dir]) => `"${column}" ${dir}`)
        .join(', ');

      finalQuery = Prisma.sql`${finalQuery} ORDER BY ${Prisma.raw(orderClauses)}`;
    }

    // Get total count for pagination metadata
    const [{ count }] = await prismaClient.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`SELECT COUNT(*) as count FROM (${finalQuery}) AS count_query`,
    );

    const totalItems = Number(count || 0);

    // Apply pagination limits
    finalQuery = Prisma.sql`${finalQuery} LIMIT ${pageSize} OFFSET ${skip}`;

    // Execute the query
    const results: any[] = await prismaClient.$queryRaw(finalQuery);

    // Map results if a mapper function is provided
    const mappedResults = dataMapper
      ? await this.mapResults(results, dataMapper)
      : results;

    // Return paginated results with metadata
    return {
      pageItems: mappedResults,
      pageMeta: {
        itemCount: mappedResults.length,
        totalItems,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: pageNum,
      },
    };
  }

  /**
   * Converts a value to the specified data type.
   * @param value - The value to convert
   * @param dataType - The target data type
   * @returns Converted value
   */
  protected createEnumFilter(
    key: string,
    enumValues: string[],
  ): EnumFilterConfig {
    return {
      key,
      dataType: 'enum',
      enumValues,
      where(
        value: unknown,
        filters?: Record<string, unknown>,
      ): Record<string, unknown> {
        // Handle term search
        if (filters?.term && typeof filters.term === 'string') {
          const searchTerm = filters.term.toUpperCase();
          if (enumValues.includes(searchTerm)) {
            return { [key]: searchTerm };
          }
        }

        // Handle direct filtering
        if (value) {
          const enumValue = value as string;
          if (enumValues.includes(enumValue)) {
            return { [key]: { in: [enumValue] } };
          }
          return { [key]: enumValue };
        }
        return {};
      },
    };
  }

  /**
   * Sorts two objects based on an orderBy specification.
   * @param a - First object
   * @param b - Second object
   * @param orderBy - Sorting criteria
   * @returns Comparison result (-1, 0, 1)
   */
  private sortByOrder<T extends Record<string, any>>(
    a: T,
    b: T,
    orderBy: Record<string, 'asc' | 'desc'>,
  ): number {
    for (const key of Object.keys(orderBy)) {
      const direction = orderBy[key];
      const valueA = a[key] as string | number;
      const valueB = b[key] as string | number;

      // Handle null/undefined values
      if (valueA == null && valueB != null) return direction === 'asc' ? -1 : 1;
      if (valueA != null && valueB == null) return direction === 'asc' ? 1 : -1;
      if (valueA == null && valueB == null) continue;

      // Compare values based on direction
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    }

    return 0; // Equal
  }

  /**
   * Creates a filter condition based on operator and data type
   */
  private createFilterCondition(
    operator: FilterOperator,
    value: unknown,
    dataType:
      | 'string'
      | 'number'
      | 'boolean'
      | 'date'
      | 'json'
      | 'array'
      | 'enum',
  ): Record<string, unknown> {
    // Text-based operators
    if (this.isTextSearchOperator(operator) && dataType === 'string') {
      return {
        [operator]: value,
        mode: 'insensitive',
      };
    }

    // Handle numeric operators
    if (
      ['gt', 'gte', 'lt', 'lte'].includes(operator) &&
      dataType === 'number'
    ) {
      return { [operator]: Number(value) };
    }

    // Handle 'in' and 'notIn' operators for numbers
    if ((operator === 'in' || operator === 'notIn') && dataType === 'number') {
      const values = Array.isArray(value)
        ? value.map((v) => Number(v))
        : [Number(value)];
      return { [operator]: values };
    }

    // Handle equality across types
    if (operator === 'equals') {
      switch (dataType) {
        case 'number':
          return { equals: Number(value) };
        case 'boolean':
          return { equals: Boolean(value === true || value === 'true') };
        case 'date':
          return {
            equals: value instanceof Date ? value : new Date(value as string),
          };
        case 'json':
          return {
            equals: typeof value === 'string' ? JSON.parse(value) : value,
          };
        case 'array':
          return { equals: Array.isArray(value) ? value : [value] };
        default:
          return { equals: value };
      }
    }

    // Handle array operations with improved support
    if (dataType === 'array') {
      const arrayValue = Array.isArray(value) ? value : [value];

      if (['has', 'hasEvery', 'hasSome'].includes(operator)) {
        return { [operator]: arrayValue };
      }

      if (operator === 'array_contains') {
        // For PostgreSQL array @> operator via Prisma
        return { array_contains: arrayValue };
      }

      if (operator === 'overlap') {
        // For PostgreSQL array && operator (overlap)
        return { array_overlaps: arrayValue };
      }

      if (operator === 'isEmpty') {
        return { isEmpty: true };
      }

      if (operator === 'isNotEmpty') {
        return { isEmpty: false };
      }
    }

    // Handle JSON operations with improved Postgres JSON support
    if (dataType === 'json') {
      if (operator === 'path') {
        // Handle PostgreSQL JSON path queries
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const [path, jsonValue] = Array.isArray(value)
            ? value
            : [value, undefined];
          return jsonValue !== undefined
            ? { path: path, equals: jsonValue }
            : { path: path };
        } catch {
          return { equals: value };
        }
      }

      if (operator === 'contains') {
        // JSON contains using @> operator
        return {
          contains: typeof value === 'string' ? JSON.parse(value) : value,
        };
      }

      if (operator === 'containedBy') {
        // JSON contained by using <@ operator
        return {
          containedBy: typeof value === 'string' ? JSON.parse(value) : value,
        };
      }

      if (operator === 'hasKey') {
        // Check if JSON has a specific key
        return { path: [value] };
      }

      if (operator === 'hasAllKeys' && Array.isArray(value)) {
        // Check if JSON has all specified keys (custom implementation)
        const conditions = value.map((key) => ({ path: [key] }));
        return { AND: conditions };
      }

      if (operator === 'hasAnyKeys' && Array.isArray(value)) {
        // Check if JSON has any of the specified keys
        const conditions = value.map((key) => ({ path: [key] }));
        return { OR: conditions };
      }
    }

    // Handle enum operations
    if (dataType === 'enum') {
      const op = operator as EnumOperator;
      if (op === 'equals') {
        return { equals: value };
      }
      if (op === 'not') {
        return { not: value };
      }
      if (op === 'in' && Array.isArray(value)) {
        return { in: value };
      }
      if (op === 'notIn' && Array.isArray(value)) {
        return { notIn: value };
      }
      return { equals: value }; // Default to equals for enums
    }

    // Default fallback for other operators
    return { [operator]: value };
  }

  /**
   * Creates raw SQL conditions with PostgreSQL-specific syntax
   */
  private createRawSqlCondition(
    key: string,
    operator: FilterOperator,
    value: any,
    dataType:
      | 'string'
      | 'number'
      | 'boolean'
      | 'date'
      | 'json'
      | 'array'
      | 'enum',
  ): string | null {
    // CRITICAL SECURITY WARNING: Manually constructing SQL strings is highly prone to SQL injection.
    // This basic escaping is NOT sufficient. Prefer Prisma ORM methods or Prisma.sql tagged templates.

    const escapeSql = (v: string) => v.replace(/'/g, "''");

    switch (dataType) {
      case 'string':
        if (operator === 'contains') {
          return `${key} ILIKE '%${escapeSql(String(value))}%'`;
        } else if (operator === 'startsWith') {
          return `${key} ILIKE '${escapeSql(String(value))}%'`;
        } else if (operator === 'endsWith') {
          return `${key} ILIKE '%${escapeSql(String(value))}'`;
        } else if (operator === 'equals') {
          return `${key} = '${escapeSql(String(value))}'`;
        } else if (operator === 'not') {
          return `${key} != '${escapeSql(String(value))}'`;
        }
        break;

      case 'number': {
        const numValue = Number(value);
        if (isNaN(numValue)) return null;

        if (['gt', 'lt', 'gte', 'lte', 'equals', 'not'].includes(operator)) {
          const op = {
            gt: '>',
            lt: '<',
            gte: '>=',
            lte: '<=',
            equals: '=',
            not: '!=',
          }[operator as string];
          return `${key} ${op} ${numValue}`;
        } else if (operator === 'in' && Array.isArray(value)) {
          const values = value.map((v) => Number(v)).join(', ');
          return `${key} IN (${values})`;
        } else if (operator === 'notIn' && Array.isArray(value)) {
          const values = value.map((v) => Number(v)).join(', ');
          return `${key} NOT IN (${values})`;
        }
        break;
      }

      case 'boolean': {
        const boolValue = value === true || value === 'true';
        return `${key} = ${boolValue}`;
      }

      case 'date':
        try {
          const dateValue =
            value instanceof Date ? value : new Date(value as string);
          if (operator === 'equals') {
            return `${key}::date = '${dateValue.toISOString()}'::date`;
          } else if (operator === 'not') {
            return `${key}::date != '${dateValue.toISOString()}'::date`;
          } else if (['gt', 'lt', 'gte', 'lte'].includes(operator)) {
            const op = {
              gt: '>',
              lt: '<',
              gte: '>=',
              lte: '<=',
            }[operator as string];
            return `${key}::date ${op} '${dateValue.toISOString()}'::date`;
          }
          return null;
        } catch {
          return null;
        }

      case 'json':
        try {
          if (operator === 'path') {
            // PostgreSQL JSON path queries
            if (Array.isArray(value) && value.length >= 1) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const [path, jsonValue] =
                value.length === 2 ? value : [value[0], undefined];
              const pathStr = String(path);

              // Support for nested paths
              const pathParts = pathStr.split('.');

              if (jsonValue !== undefined) {
                let jsonValueSql;
                if (typeof jsonValue === 'string') {
                  jsonValueSql = `'${escapeSql(jsonValue)}'`;
                } else if (typeof jsonValue === 'number') {
                  jsonValueSql = jsonValue;
                } else if (typeof jsonValue === 'boolean') {
                  jsonValueSql = jsonValue ? 'true' : 'false';
                } else if (jsonValue === null) {
                  jsonValueSql = 'null';
                } else {
                  jsonValueSql = `'${escapeSql(JSON.stringify(jsonValue))}'`;
                }

                if (pathParts.length === 1) {
                  return `${key}->>'${escapeSql(pathParts[0])}' = ${jsonValueSql}`;
                } else {
                  // For nested paths
                  const lastPart = pathParts.pop();
                  const remainingPath = pathParts
                    .map((p) => `'${escapeSql(p)}'`)
                    .join('->');
                  return `${key}->${remainingPath}->>'${escapeSql(lastPart || '')}' = ${jsonValueSql}`;
                }
              } else {
                // Just check if the path exists
                const jsonPathExpr = pathParts
                  .map((p) => `'${escapeSql(p)}'`)
                  .join('->');
                return `${key}->${jsonPathExpr} IS NOT NULL`;
              }
            }
          } else if (operator === 'contains') {
            // JSON contains using @> operator
            const jsonStr =
              typeof value === 'string' ? value : JSON.stringify(value);
            return `${key} @> '${escapeSql(jsonStr)}'::jsonb`;
          } else if (operator === 'containedBy') {
            // JSON contained by using <@ operator
            const jsonStr =
              typeof value === 'string' ? value : JSON.stringify(value);
            return `${key} <@ '${escapeSql(jsonStr)}'::jsonb`;
          } else if (operator === 'hasKey') {
            // Check if JSON has a specific key
            return `${key} ? '${escapeSql(String(value))}'`;
          } else if (operator === 'hasAllKeys' && Array.isArray(value)) {
            // Check if JSON has all specified keys
            const conditions = value.map(
              (k) => `${key} ? '${escapeSql(String(k))}'`,
            );
            return conditions.join(' AND ');
          } else if (operator === 'hasAnyKeys' && Array.isArray(value)) {
            // Check if JSON has any of the specified keys
            const conditions = value.map(
              (k) => `${key} ? '${escapeSql(String(k))}'`,
            );
            return conditions.join(' OR ');
          }
        } catch {
          return null;
        }
        break;

      case 'array':
        if (operator === 'array_contains' || operator === 'has') {
          // PostgreSQL array contains using @> operator
          const arrayItems = Array.isArray(value) ? value : [value];
          return this.formatArrayForSql(key, arrayItems, '@>');
        } else if (operator === 'overlap') {
          // PostgreSQL array overlap using && operator
          const arrayItems = Array.isArray(value) ? value : [value];
          return this.formatArrayForSql(key, arrayItems, '&&');
        } else if (operator === 'hasSome') {
          // Alternative way to express overlap
          const arrayItems = Array.isArray(value) ? value : [value];
          return this.formatArrayForSql(key, arrayItems, '&&');
        } else if (operator === 'hasEvery') {
          // For PostgreSQL <@ operator (array is contained by)
          const arrayItems = Array.isArray(value) ? value : [value];
          return this.formatArrayForSql(key, arrayItems, '<@');
        } else if (operator === 'isEmpty') {
          return `array_length(${key}, 1) IS NULL`;
        } else if (operator === 'isNotEmpty') {
          return `array_length(${key}, 1) IS NOT NULL`;
        } else if (operator === 'equals') {
          const arrayItems = Array.isArray(value) ? value : [value];
          return this.formatArrayForSql(key, arrayItems, '=');
        }
        break;

      case 'enum': {
        const safeStr = (val: unknown): string =>
          typeof val === 'object' && val !== null
            ? JSON.stringify(val)
            : String(val);

        if (operator === 'equals') {
          return `${key}::text = '${escapeSql(safeStr(value))}'`;
        } else if (operator === 'not') {
          return `${key}::text != '${escapeSql(safeStr(value))}'`;
        } else if (operator === 'in' && Array.isArray(value)) {
          const values = value
            .map((v) => `'${escapeSql(safeStr(v))}'`)
            .join(', ');
          return `${key}::text IN (${values})`;
        } else if (operator === 'notIn' && Array.isArray(value)) {
          const values = value
            .map((v) => `'${escapeSql(safeStr(v))}'`)
            .join(', ');
          return `${key}::text NOT IN (${values})`;
        }
        break;
      }
    }

    // Default fallback for any unhandled cases
    return null;
  }

  /**
   * Helper function to properly format array values for SQL based on their types
   */
  private formatArrayForSql(
    key: string,
    items: any[],
    operator: string,
  ): string {
    if (items.length === 0) {
      return operator === '='
        ? `${key} = '{}'::${this.inferArrayType(items)}[]`
        : `${key} ${operator} '{}'::${this.inferArrayType(items)}[]`;
    }

    // Determine array element type
    const arrayType = this.inferArrayType(items);

    // Format array elements based on their type
    const formattedItems = items
      .map((item) => {
        if (typeof item === 'string') return `"${item.replace(/"/g, '\\"')}"`;
        if (typeof item === 'number') return item;
        if (typeof item === 'boolean') return item ? 'true' : 'false';
        if (item === null) return 'NULL';
        if (typeof item === 'object')
          return `"${JSON.stringify(item).replace(/"/g, '\\"')}"`;
        return String(item);
      })
      .join(',');

    // For empty arrays or single element equals comparison, use a simplified syntax
    if (operator === '=' && items.length === 1) {
      return `${key} = ARRAY[${formattedItems}]::${arrayType}[]`;
    }

    return `${key} ${operator} ARRAY[${formattedItems}]::${arrayType}[]`;
  }

  /**
   * Infer the PostgreSQL array type based on array elements
   */
  private inferArrayType(items: any[]): string {
    if (items.length === 0) return 'text'; // Default to text for empty arrays

    const firstNonNull = items.find((item) => item !== null) as unknown;
    if (firstNonNull === undefined) return 'text'; // All nulls, default to text

    if (typeof firstNonNull === 'number') return 'numeric';
    if (typeof firstNonNull === 'boolean') return 'boolean';
    if (firstNonNull instanceof Date) return 'timestamp';
    if (typeof firstNonNull === 'object') return 'jsonb';

    return 'text'; // Default for strings and other types
  }

  /**
   * Determines the data type of a value with improved type detection
   * @param value - The value to check
   * @returns Inferred data type
   */
  private inferDataType(
    value: string | number | boolean | Date | object | null | undefined,
    schema?: QuerySchema,
  ): 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array' | 'enum' {
    // Safe string conversion for objects
    const safeStr = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') {
        try {
          return JSON.stringify(val);
        } catch {
          return Object.prototype.toString.call(val);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return String(val);
    };

    // If schema specifies this is an enum type and has enumValues, validate against them
    if (
      schema?.dataType === 'enum' &&
      schema.enumValues &&
      schema.enumValues.length > 0
    ) {
      const strValue = safeStr(value).toLowerCase();
      if (schema.enumValues.map((v) => v.toLowerCase()).includes(strValue)) {
        return 'enum';
      }
    }

    if (value === null || value === undefined) return 'string';

    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';

    const type = typeof value;
    if (typeof value === 'string') {
      // First check if it's a valid number string
      if (/^-?\d+(\.\d+)?$/.test(value.trim())) {
        return 'number';
      }

      // Check if it's a boolean string
      if (['true', 'false'].includes(value.toLowerCase())) {
        return 'boolean';
      }

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        if (typeof parsed === 'object' && parsed !== null) return 'json';
        if (Array.isArray(parsed)) return 'array';
      } catch {
        // Check if it could be a date (improved date detection)
        if (
          /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/i.test(
            value,
          ) &&
          !isNaN(Date.parse(value))
        ) {
          return 'date';
        }
      }
      return 'string';
    }

    if (type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';
    if (type === 'object') return 'json';

    return 'string'; // default fallback
  }

  /**
   * Converts a value to the specified data type with improved conversion
   */
  private convertValueToType(
    value: string | number | boolean | Date | object | null | undefined,
    dataType:
      | 'string'
      | 'number'
      | 'boolean'
      | 'date'
      | 'json'
      | 'array'
      | 'enum',
    schema?: QuerySchema,
  ): unknown {
    const safeStr = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') {
        try {
          return JSON.stringify(val);
        } catch {
          return Object.prototype.toString.call(val);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return String(val);
    };

    switch (dataType) {
      case 'enum':
        if (schema?.enumValues && schema.enumValues.length > 0) {
          const strValue = safeStr(value).toLowerCase();
          const matchedEnum = schema.enumValues.find(
            (v) => v.toLowerCase() === strValue,
          );
          return matchedEnum || schema.enumValues[0];
        }
        return safeStr(value);
      case 'string':
        return typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : String(value);
      case 'number': {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      } // Return 0 for invalid numbers
      case 'boolean':
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return Boolean(value);
      case 'date':
        if (value instanceof Date) return value;
        try {
          const date = new Date(value as string);
          return isNaN(date.getTime()) ? new Date() : date; // Return current date for invalid dates
        } catch {
          return new Date();
        }
      case 'json':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            return {};
          }
        }
        return value && typeof value === 'object' ? value : {};
      case 'array':
        if (Array.isArray(value)) return value;
        if (value === null || value === undefined) return [];
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value) as Record<string, unknown>;
            return Array.isArray(parsed) ? parsed : [value];
          } catch {
            return [value];
          }
        }
        return [value];
      default:
        return value;
    }
  }
}
