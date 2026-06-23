export type RewardRequest = {
  itemId: number;
  itemName: string;
  studentId: number;
  studentName: string;
  studentCode?: number | null;
  rewardGiven: boolean;
  rewardedAt?: string | null;
};

export type RewardRequestListResponse = {
  rewards: RewardRequest[];
};

export type RewardEligibleResponse = {
  userId: number;
  userName: string;
  studentCode?: number | null;
  itemId: number;
  rewardGiven: boolean;
  rewardedAt?: string | null;
};

export type RewardHistoryItem = {
  rewardId: number;
  itemId: number;
  itemName: string;
  givenBy: string;
  givenAt: string;
};

export type RewardHistoryResponse = {
  userId?: number | null;
  rewards: RewardHistoryItem[];
};
