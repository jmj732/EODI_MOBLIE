import { apiClient } from "@/api/client";
import type {
  ClaimedItemsResponse,
  DisposalReasonResponse,
  ItemCategory,
  ItemDetail,
  ItemSearchResponse,
  ItemSummary,
  ItemStatus,
  Place,
} from "@/types/item";

export const itemKeys = {
  all: ["items"] as const,
  search: (filters: ItemSearchParams) => ["items", "search", filters] as const,
  detail: (itemId: number) => ["items", "detail", itemId] as const,
  claimed: ["admin", "claims", "items"] as const,
  disposalReason: (itemId: number) => ["items", "disposalReason", itemId] as const,
  disposalCount: ["admin", "disposal", "count"] as const,
};

export const placeKeys = {
  all: ["places"] as const,
};

export type ItemSearchParams = {
  page?: number;
  size?: number;
  query?: string;
  placeIds?: number[];
  status?: ItemStatus[];
  foundAtFrom?: string;
  foundAtTo?: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  categories?: ItemCategory[];
  sort?: "LATEST" | "OLDEST";
};

export type ItemFormPayload = {
  name: string;
  reporterStudentCode?: number | null;
  reporterName?: string | null;
  foundAt: string;
  placeId: number;
  foundPlaceDetail: string;
  imageUrl?: string | null;
  category: ItemCategory;
};

export async function searchItems(params: ItemSearchParams) {
  const response = await apiClient.get<ItemSearchResponse>("/items/search", { params: toItemSearchApiParams(params) });
  return normalizeItemSearchResponse(response.data);
}

export async function getPlaces() {
  const response = await apiClient.get<Place[]>("/places");
  return response.data;
}

export async function getItemDetail(itemId: number) {
  const response = await apiClient.get<ItemDetail>(`/items/${itemId}`);
  return normalizeItem(response.data);
}

export async function createItem(payload: ItemFormPayload) {
  const response = await apiClient.post<{ itemId: number; message: string }>("/items", payload);
  return response.data;
}

export async function updateItem(itemId: number, payload: ItemFormPayload) {
  await apiClient.put(`/items/${itemId}`, payload);
}

export async function deleteItem(itemId: number) {
  await apiClient.delete(`/items/${itemId}`);
}

export async function giveItem(itemId: number, studentId: number) {
  const response = await apiClient.post<{ message: string }>(`/items/${itemId}/give`, { studentId });
  return response.data;
}

export async function approveItem(itemId: number, result: "APPROVED" | "REJECTED") {
  const response = await apiClient.post<{ message: string }>(`/items/${itemId}/approve`, { result });
  return response.data;
}

export async function getClaimedItems(page = 1, size = 10) {
  const response = await apiClient.get<ClaimedItemsResponse>("/items/claims", {
    params: { page, size },
  });
  return {
    ...response.data,
    items: (response.data.items ?? []).map((item) => ({
      ...item,
      image: item.image ?? item.imageUrl ?? null,
    })),
  };
}

export async function getDisposalReason(itemId: number, params?: { from?: string; to?: string }) {
  const response = await apiClient.get<DisposalReasonResponse>(`/items/${itemId}/disposal-reason`, {
    params,
  });
  return response.data;
}

export async function submitDisposalReason(itemId: number, reason: string, days: number) {
  const response = await apiClient.post<{ reasonId: number; message: string }>(
    `/items/${itemId}/disposal-reason`,
    { reason, days },
  );
  return response.data;
}

export async function extendDisposal(itemId: number, reasonId: number) {
  const response = await apiClient.patch<{ message: string; extendedDisposalDate: string }>(
    `/items/${itemId}/discarded`,
    { reasonId },
  );
  return response.data;
}

export async function getDisposalCount() {
  const response = await apiClient.get<{ count: number }>("/items/disposal/count");
  return response.data;
}

function normalizeItemSearchResponse(data: ItemSearchResponse): ItemSearchResponse {
  const rawContent = data.content ?? data.items ?? [];
  const content = rawContent.map(normalizeItem);

  return {
    ...data,
    content,
    items: content,
  };
}

function normalizeItem<T extends ItemSummary>(item: T): T {
  const image = item.image ?? item.imageUrl ?? null;
  const foundPlaceDetail = item.foundPlaceDetail ?? item.placeDetail;
  return { ...item, image, foundPlaceDetail };
}

function toItemSearchApiParams(params: ItemSearchParams) {
  const { placeIds, foundAtFrom, foundAtTo, approvalStatus, ...rest } = params;
  return {
    ...rest,
    place_ids: placeIds,
    found_at_from: foundAtFrom,
    found_at_to: foundAtTo,
    approval_status: approvalStatus,
  };
}
