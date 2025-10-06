type FilterDataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'json'
  | 'array'
  | 'enum';

// Enhanced QuerySchema with better type handling
export type QuerySchema = {
  key: string; // The key in the database model
  dataType?: FilterDataType; // The data type of the field
  // For enum type, provide possible values
  enumValues?: string[];
  where: (
    value: unknown,
    filters?: Record<string, unknown>,
  ) => Record<string, unknown>; // A function to generate the query condition
};

// String operation types
type StringOperator = 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'not';

// Numeric operation types
type NumericOperator =
  | 'equals'
  | 'not'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn';

// Improved array operation types
type ArrayOperator =
  | 'has'
  | 'hasEvery'
  | 'hasSome'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'equals'
  | 'array_contains'
  | 'overlap'; // Add PostgreSQL overlap operator

// Improved JSON operation types with more PostgreSQL operators
type JsonOperator =
  | 'path'
  | 'equals'
  | 'contains'
  | 'containedBy'
  | 'hasKey'
  | 'hasAllKeys'
  | 'hasAnyKeys';

// Enum operation types
export type EnumOperator = 'equals' | 'not' | 'in' | 'notIn';

// Union of all operators
export type FilterOperator =
  | StringOperator
  | NumericOperator
  | ArrayOperator
  | JsonOperator
  | EnumOperator;

export interface EnumFilterConfig extends QuerySchema {
  dataType: 'enum';
  enumValues: string[];
}

export interface PaginationParams {
  size?: number;
  cursor?: string;
  orderBy?: string | Record<string, any>;
  direction?: 'asc' | 'desc';
  isPaginated?: string | boolean;
  paginationType?: 'cursor' | 'page';
  page?: number;
  where?: string;
}

export interface QueryArgs {
  where?: Record<string, any>;
  orderBy?: Record<string, any> | Array<Record<string, 'asc' | 'desc'>>;
  skip?: number;
  take?: number;
  cursor?: Record<string, any>;
}

export interface DecodedCursor {
  id: string;
  dir: number;
  last?: string;
}

// Enhanced filters type to support multiple data types
export type FilterValue = string | number | boolean | Date | object | any[];
export type Filters = Record<string, FilterValue | undefined>;

interface CursorLink {
  cursor: string;
  page: null;
  isCurrent: boolean;
}

export interface PaginatedResult<T> {
  pageItems?: T[];
  pageEdges?: T[];
  pageMeta?: {
    itemCount: number;
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
  pageCursors?: {
    first: CursorLink | boolean;
    previous: CursorLink | boolean;
    next: CursorLink | boolean;
    last: CursorLink | boolean;
    hasNext: boolean | string;
    hasPrevious: boolean | string;
  };
  totalCount?: number;
}
