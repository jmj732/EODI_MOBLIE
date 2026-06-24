import { apiClient } from "@/api/client";

export type IntroduceResponse = {
  content: string;
  updatedAt?: string | null;
};

export async function getIntroduce() {
  const response = await apiClient.get<IntroduceResponse>("/introduce");
  return response.data;
}

export async function updateIntroduce(content: string) {
  const response = await apiClient.patch<IntroduceResponse>("/introduce", { content });
  return response.data;
}
