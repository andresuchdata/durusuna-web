import { http } from "@/core/http/axios";

const axiosInstance = http();
import type { ClassUpdate, Comment } from "./types";

export async function getClassUpdates(): Promise<ClassUpdate[]> {
  const { data } = await axiosInstance.get("/class-updates");
  // Backend returns paginated response with updates array
  return data.updates || data.items || data;
}

export async function getClassUpdate(id: string): Promise<ClassUpdate> {
  const { data } = await axiosInstance.get(`/class-updates/${id}`);
  return data;
}

export async function addComment(updateId: string, text: string): Promise<Comment> {
  const { data } = await axiosInstance.post(`/class-updates/${updateId}/comments`, { text });
  return data;
}

export async function addReaction(updateId: string, emoji: string): Promise<void> {
  await axiosInstance.post(`/class-updates/${updateId}/reactions`, { emoji });
}

export async function removeReaction(updateId: string, reactionId: string): Promise<void> {
  await axiosInstance.delete(`/class-updates/${updateId}/reactions/${reactionId}`);
}
