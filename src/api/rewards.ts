import { apiClient } from "@/api/client";
import type {
  RewardEligibleResponse,
  RewardHistoryResponse,
  RewardRequestListResponse,
} from "@/types/reward";

export const rewardKeys = {
  requests: ["rewards", "requests"] as const,
  eligibleCount: ["rewards", "eligible", "count"] as const,
  eligible: (itemId: number) => ["rewards", "eligible", itemId] as const,
  history: (filters: RewardHistoryParams) => ["rewards", "history", filters] as const,
};

export type RewardHistoryParams = {
  userId?: number;
  user_id?: number;
  itemId?: number;
  from?: string;
  to?: string;
  date?: string;
  grade?: number;
  class?: number;
};

export async function getRewardRequests() {
  const response = await apiClient.get<RewardRequestListResponse>("/rewards");
  return response.data;
}

export async function getRewardEligibleCount() {
  const response = await apiClient.get<{ count: number }>("/rewards/eligible/count");
  return response.data;
}

export async function getRewardEligible(itemId: number) {
  const response = await apiClient.get<RewardEligibleResponse>(`/rewards/eligible/${itemId}`);
  return response.data;
}

export async function giveReward(itemId: number) {
  const response = await apiClient.post<{ message: string }>("/rewards", { itemId });
  return response.data;
}

export async function getRewardHistory(params: RewardHistoryParams) {
  const response = await apiClient.get<RewardHistoryResponse>("/rewards/history", { params });
  return response.data;
}
