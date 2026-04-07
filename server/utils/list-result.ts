export type PaginatedListResult<T> = {
  data?: T[];
  totalCount?: number;
};

export function extractListData<T>(value: T[] | PaginatedListResult<T> | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && Array.isArray(value.data)) {
    return value.data;
  }

  return [];
}

export function extractListCount<T>(value: T[] | PaginatedListResult<T> | null | undefined): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (value && typeof value.totalCount === "number") {
    return value.totalCount;
  }

  return extractListData(value).length;
}
