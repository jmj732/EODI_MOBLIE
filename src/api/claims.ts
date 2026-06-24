import { apiClient } from "@/api/client";
import type { ClaimRequest, ClaimRequestsResponse, ClaimStatus, MyClaimsResponse } from "@/types/item";

export const claimKeys = {
  my: (page?: number) => ["claims", "my", page ?? 1] as const,
  adminList: (filters: ClaimRequestParams) => ["admin", "claims", filters] as const,
  adminCount: ["admin", "claims", "count"] as const,
};

export type ClaimRequestParams = {
  itemId?: number;
  page?: number;
  size?: number;
  status?: ClaimStatus;
  sort?: "LATEST" | "OLDEST";
};

export async function createClaim(itemId: number, visitDate: string) {
  const response = await apiClient.post<{ message: string }>(`/items/${itemId}/claims`, { visitDate });
  return response.data;
}

export async function getMyClaims(page = 1, size = 10) {
  const response = await apiClient.get<MyClaimsResponse>("/items/claims/my", {
    params: { page, size },
  });
  return response.data;
}

export async function cancelClaim(claimId: number) {
  await apiClient.delete(`/items/claims/${claimId}`);
}

export async function getClaimRequests(params: ClaimRequestParams) {
  const response = await apiClient.get<ClaimRequestsResponse>("/items/claims/requests", { params });
  return normalizeClaimRequests(response.data);
}

export async function getClaimCount() {
  const response = await apiClient.get<{ count: number }>("/items/claims/count");
  return response.data;
}

export async function approveClaim(claimId: number) {
  await apiClient.post(`/items/claims/${claimId}/approve`);
}

export async function rejectClaim(claimId: number) {
  await apiClient.post(`/items/claims/${claimId}/reject`);
}

function normalizeClaimRequests(data: ClaimRequestsResponse): ClaimRequestsResponse {
  const rawRequests = data.requests ?? data.claims ?? [];
  const claims = rawRequests.map(normalizeClaimRequest);

  return {
    ...data,
    claims,
    requests: claims,
  };
}

function normalizeClaimRequest(request: ClaimRequest): ClaimRequest {
  const claimId = request.claimId ?? request.requestId;

  return {
    ...request,
    claimId,
    requestId: request.requestId ?? claimId,
  };
}
