export type ItemStatus = "LOST" | "GIVEN" | "TO_BE_DISCARDED" | "DISCARDED";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ItemCategory = "전자기기" | "의류" | "액세서리" | "기타";

export type Place = {
  id: number;
  name: string;
};

export type ItemSummary = {
  id: number;
  name: string;
  image?: string | null;
  imageUrl?: string | null;
  status: ItemStatus;
  category: ItemCategory;
  foundAt: string;
  foundPlace?: string;
  foundPlaceDetail?: string;
  placeDetail?: string;
  reporterName?: string | null;
  reporterStudentCode?: number | null;
  approvalStatus?: ApprovalStatus;
  discardedAt?: string | null;
  disposalDate?: string | null;
};

export type ItemSearchResponse = {
  content: ItemSummary[];
  /**
   * Backward-compatible alias for older mobile screens.
   * New code should read content, matching the web frontend and backend paging shape.
   */
  items: ItemSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
};

export type ItemDetail = ItemSummary & {
  foundPlaceId?: number;
  disposalReason?: string | null;
};

export type ClaimRequest = {
  claimId: number;
  requestId?: number;
  itemId: number;
  itemName: string;
  imageUrl?: string | null;
  requesterName: string;
  requesterType?: string;
  requestedAt: string;
  visitDate: string;
  status: ClaimStatus;
};

export type ClaimRequestsResponse = {
  claims: ClaimRequest[];
  requests?: ClaimRequest[];
  page: number;
  size: number;
  total: number;
};

export type ClaimedItem = {
  id: number;
  name: string;
  foundAt: string;
  foundPlace?: string;
  image?: string | null;
  imageUrl?: string | null;
  requestCount: number;
  visitDate?: string | null;
};

export type ClaimedItemsResponse = {
  items: ClaimedItem[];
};

export type MyClaim = ClaimRequest & {
  image?: string | null;
};

export type MyClaimsResponse = {
  claims: MyClaim[];
  page: number;
  size: number;
  total: number;
};

export type DisposalReasonResponse = {
  reasonId: number;
  reason: string;
  teacherName: string;
  extensionDays: number;
  createdAt?: string;
};
