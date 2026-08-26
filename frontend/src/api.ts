export type Emotion =
  | "happy"
  | "calm"
  | "sad"
  | "angry"
  | "anxious"
  | "tired"
  | "excited"
  | "very_happy"
  | "neutral"
  | "very_sad";
export type Weather =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "sunny_cloudy"
  | "sunny_rainy"
  | "cloudy_rainy";
export type Tag = { id: string; name: string };
export type EntryImage = {
  id: string;
  originalFileName: string;
  sortOrder: number;
};
export type Entry = {
  id: string;
  content: string;
  recordedAt: string;
  emotion: Emotion | null;
  weather: Weather | null;
  location: string | null;
  images: EntryImage[];
  entryTags: { id: string; tagId: string; tag: Tag }[];
};
export type EntryInput = {
  content: string;
  recordedAt: string;
  emotion: Emotion | null;
  weather: Weather | null;
  location: string | null;
};
export type PurchaseCategory = {
  id: string;
  name: string;
  sortOrder: number;
};
export type PurchaseImage = {
  id: string;
  originalFileName: string;
  sortOrder: number;
};
export type Purchase = {
  id: string;
  name: string;
  purchaseCategoryId: string;
  purchasedAt: string;
  price: number;
  shop: string | null;
  description: string | null;
  purchaseCategory: PurchaseCategory;
  images: PurchaseImage[];
};
export type PurchaseInput = {
  name: string;
  purchaseCategoryId: string;
  purchasedAt: string;
  price: number;
  shop: string | null;
  description: string | null;
};
export type Theme = "light" | "dark" | "capture";
export type SettingKey = "image.root_path" | "appearance.theme";
export type AppSetting = {
  id: string;
  key: SettingKey;
  value: string | null;
  description: string | null;
};
type Failure = { message?: string | string[] };
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers:
      init?.body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Failure;
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(" ")
        : (body.message ?? "リクエストに失敗しました。"),
    );
  }
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}
export const api = {
  entries: {
    list: () => request<Entry[]>("/entries"),
    get: (id: string) => request<Entry>(`/entries/${id}`),
    create: (input: EntryInput) =>
      request<Entry>("/entries", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: EntryInput) =>
      request<Entry>(`/entries/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<void>(`/entries/${id}`, { method: "DELETE" }),
    attachTag: (entryId: string, tagId: string) =>
      request<void>(`/entries/${entryId}/tags/${tagId}`, { method: "POST" }),
    detachTag: (entryId: string, tagId: string) =>
      request<void>(`/entries/${entryId}/tags/${tagId}`, { method: "DELETE" }),
    uploadImages: (id: string, files: File[]) => {
      const body = new FormData();
      files.forEach((file) => body.append("images", file));
      return request<void>(`/entries/${id}/images`, { method: "POST", body });
    },
    removeImage: (entryId: string, imageId: string) =>
      request<void>(`/entries/${entryId}/images/${imageId}`, {
        method: "DELETE",
      }),
    imageUrl: (entryId: string, imageId: string) =>
      `/api/entries/${entryId}/images/${imageId}`,
  },
  purchases: {
    list: () => request<Purchase[]>("/purchases"),
    get: (id: string) => request<Purchase>(`/purchases/${id}`),
    create: (input: PurchaseInput) =>
      request<Purchase>("/purchases", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: PurchaseInput) =>
      request<Purchase>(`/purchases/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<void>(`/purchases/${id}`, { method: "DELETE" }),
    listCategories: () => request<PurchaseCategory[]>("/purchase-categories"),
    uploadImages: (id: string, files: File[]) => {
      const body = new FormData();
      files.forEach((file) => body.append("images", file));
      return request<PurchaseImage[]>(`/purchases/${id}/images`, {
        method: "POST",
        body,
      });
    },
    removeImage: (purchaseId: string, imageId: string) =>
      request<void>(`/purchases/${purchaseId}/images/${imageId}`, {
        method: "DELETE",
      }),
    imageUrl: (purchaseId: string, imageId: string) =>
      `/api/purchases/${purchaseId}/images/${imageId}`,
  },
  tags: {
    list: () => request<Tag[]>("/tags"),
    create: (name: string) =>
      request<Tag>("/tags", { method: "POST", body: JSON.stringify({ name }) }),
  },
  settings: {
    list: () => request<AppSetting[]>("/settings"),
    update: (key: SettingKey, value: string) =>
      request<AppSetting>(`/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      }),
  },
};
