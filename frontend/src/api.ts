export type Emotion =
  | "very_happy"
  | "happy"
  | "neutral"
  | "sad"
  | "very_sad"
  | "angry"
  | "anxious"
  | "tired"
  | "excited";
export type Weather = "sunny" | "cloudy" | "rainy" | "snowy";
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
  tags: {
    list: () => request<Tag[]>("/tags"),
    create: (name: string) =>
      request<Tag>("/tags", { method: "POST", body: JSON.stringify({ name }) }),
  },
};
