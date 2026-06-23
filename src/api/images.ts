import { apiClient } from "@/api/client";

export async function uploadImage(uri: string, name: string, type: string) {
  const formData = new FormData();
  formData.append("file", { uri, name, type } as unknown as Blob);

  const response = await apiClient.post<{ url: string }>("/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
