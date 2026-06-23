export type ItemStatus = "LOST" | "GIVEN" | "TO_BE_DISCARDED" | "DISCARDED";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ItemCategory = "전자기기" | "의류" | "액세서리" | "기타";

export type Place = {
  id: number;
  place: string;
};

export type ItemSummary = {
  id: number;
  name: string;
  image?: string | null;
  status: ItemStatus;
  category: ItemCategory;
  foundAt: string;
  foundPlace?: string;
  foundPlaceDetail?: string;
  reporterName?: string | null;
  reporterStudentCode?: number | null;
  approvalStatus?: ApprovalStatus;
  discardedAt?: string | null;
};

export type ItemSearchResponse = {
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
  itemId: number;
  itemName: string;
  requesterName: string;
  requestedAt: string;
  visitDate: string;
  status: ClaimStatus;
};

export type ClaimRequestsResponse = {
  claims: ClaimRequest[];
  page: number;
  size: number;
  total: number;
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
