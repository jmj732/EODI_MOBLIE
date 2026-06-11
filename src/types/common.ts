export type PageMeta = {
  page: number;
  size: number;
};

export type ItemSearchPageMeta = PageMeta & {
  totalElements: number;
  totalPages: number;
  isLast: boolean;
};

export type CountResponse = {
  count: number;
};

export type ApiErrorBody = {
  message?: string;
  error?: string;
  status?: number;
  path?: string;
  timestamp?: string;
};
