import { http } from "@/core/http/axios";

const axiosInstance = http();
import type { ClassUpdate, Comment } from "./types";

export async function getClassUpdates(): Promise<ClassUpdate[]> {
  const { data } = await axiosInstance.get("/class-updates");
  // Backend returns paginated response with updates array
  const updates = data.updates || data.items || data;
  
  // Transform backend response to match frontend types
  return updates.map((update: any) => {
    // Transform reactions from backend format to frontend format
    let reactions: ClassUpdate['reactions'] = [];
    if (update.reactions) {
      // Backend format: { '👍': { count: 5, users: ['id1', 'id2'] } }
      // or seed format: { '👍': 5, '❤️': 3 }
      reactions = Object.entries(update.reactions).flatMap(([emoji, data]: [string, any]) => {
        if (typeof data === 'object' && 'count' in data) {
          // Backend format with count and users array
          if (data.users && data.users.length > 0) {
            // Has actual users
            return data.users.map((userId: string) => ({
              id: `${update.id}-${emoji}-${userId}`,
              emoji,
              userId,
              userName: 'User'
            }));
          } else {
            // Has count but empty users array - create dummy reactions
            return Array.from({ length: data.count }, (_, i) => ({
              id: `${update.id}-${emoji}-${i}`,
              emoji,
              userId: `user-${i}`,
              userName: 'User'
            }));
          }
        } else if (typeof data === 'number') {
          // Seed format with just count - create dummy reactions
          return Array.from({ length: data }, (_, i) => ({
            id: `${update.id}-${emoji}-${i}`,
            emoji,
            userId: `user-${i}`,
            userName: 'User'
          }));
        }
        return [];
      });
    }
    
    return {
      id: update.id,
      title: update.title,
      content: update.content,
      createdAt: update.created_at,
      updatedAt: update.updated_at,
      className: update.class_name || update.className, // Support both formats
      author: {
        id: update.author.id,
        name: `${update.author.first_name} ${update.author.last_name}`.trim(),
        avatar: update.author.avatar_url,
      },
      reactions,
      comments: update.comments,
      attachments: update.attachments?.map((att: any) => ({
        id: att.id,
        name: att.originalName || att.fileName,
        url: att.url,
        type: att.mimeType,
        size: att.size,
      })),
    };
  });
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
