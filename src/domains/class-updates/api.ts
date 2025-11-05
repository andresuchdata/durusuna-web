import { http } from "@/core/http/axios";

const axiosInstance = http();
import type { ClassUpdate, Comment } from "./types";

export interface ClassUpdateFilters {
  search?: string;
  class_id?: string;
  author_id?: string;
  update_type?: 'announcement' | 'homework' | 'reminder' | 'event';
  from_date?: string;
  to_date?: string;
}

interface BackendReactionData {
  count: number;
  users: string[];
}

interface BackendAttachment {
  id: string;
  originalName?: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
}

interface BackendAuthor {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface BackendClassUpdate {
  id: string;
  class_id?: string;
  title: string;
  content: string;
  update_type?: 'announcement' | 'homework' | 'reminder' | 'event';
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
  class_name?: string;
  className?: string;
  author: BackendAuthor;
  reactions?: Record<string, BackendReactionData | number>;
  comments?: Comment[];
  attachments?: BackendAttachment[];
}

interface BackendClass {
  id: string;
  name: string;
}

interface BackendComment {
  id: string;
  content: string;
  created_at: string;
  author_id?: string;
  author?: {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

export async function getClassUpdates(filters?: ClassUpdateFilters): Promise<ClassUpdate[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.class_id) params.append('class_id', filters.class_id);
  if (filters?.author_id) params.append('author_id', filters.author_id);
  if (filters?.update_type) params.append('type', filters.update_type);
  if (filters?.from_date) params.append('from_date', filters.from_date);
  if (filters?.to_date) params.append('to_date', filters.to_date);

  const { data } = await axiosInstance.get(`/class-updates${params.toString() ? `?${params.toString()}` : ''}`);
  // Backend returns paginated response with updates array
  const updates: BackendClassUpdate[] = data.updates || data.items || data;
  
  // Transform backend response to match frontend types
  return updates.map((update) => {
    // Transform reactions from backend format to frontend format
    let reactions: ClassUpdate['reactions'] = [];
    if (update.reactions) {
      // Backend format: { '👍': { count: 5, users: ['id1', 'id2'] } }
      // or seed format: { '👍': 5, '❤️': 3 }
      reactions = Object.entries(update.reactions).flatMap(([emoji, data]) => {
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
      classId: update.class_id,
      title: update.title,
      content: update.content,
      updateType: update.update_type,
      isPinned: update.is_pinned,
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
      attachments: update.attachments?.map((att) => ({
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

export async function getComments(updateId: string): Promise<Comment[]> {
  const { data } = await axiosInstance.get(`/class-updates/${updateId}/comments`);
  // Ensure we always return an array and map backend format to frontend
  const comments = Array.isArray(data) ? data : (data?.comments || []);
  
  // Transform backend comment format to frontend format
  return comments.map((comment: BackendComment) => ({
    id: comment.id,
    text: comment.content, // Backend uses 'content', frontend uses 'text'
    createdAt: comment.created_at,
    author: {
      id: comment.author?.id || comment.author_id || '',
      name: comment.author?.name || `${comment.author?.first_name || ''} ${comment.author?.last_name || ''}`.trim(),
      avatar: comment.author?.avatar_url,
    },
  }));
}

export async function addComment(updateId: string, text: string): Promise<Comment> {
  const { data } = await axiosInstance.post(`/class-updates/${updateId}/comments`, { content: text });
  
  // Transform backend comment format to frontend format
  return {
    id: data.id,
    text: data.content, // Backend uses 'content', frontend uses 'text'
    createdAt: data.created_at,
    author: {
      id: data.author?.id || data.author_id,
      name: data.author?.name || `${data.author?.first_name || ''} ${data.author?.last_name || ''}`.trim(),
      avatar: data.author?.avatar_url,
    },
  };
}

export async function addReaction(updateId: string, emoji: string): Promise<void> {
  await axiosInstance.post(`/class-updates/${updateId}/reactions`, { emoji });
}

export async function removeReaction(updateId: string, reactionId: string): Promise<void> {
  await axiosInstance.delete(`/class-updates/${updateId}/reactions/${reactionId}`);
}

export async function getClasses(): Promise<Array<{ id: string; name: string }>> {
  const { data } = await axiosInstance.get('/classes');
  const classes: BackendClass[] = data;
  return classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
  }));
}

interface TeacherContact {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
}

export async function getTeachers(): Promise<Array<{ id: string; name: string }>> {
  const { data } = await axiosInstance.get('/users/contacts?userType=teacher&limit=100');
  // The contacts endpoint returns { contacts: [...], pagination: {...} }
  const teachers: TeacherContact[] = data.contacts || data;
  return teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim(),
  }));
}

export interface CreateClassUpdateData {
  class_id: string;
  title?: string;
  content: string;
  update_type?: 'announcement' | 'homework' | 'reminder' | 'event';
  is_pinned?: boolean;
  attachments?: BackendAttachment[];
}

export async function createClassUpdate(data: CreateClassUpdateData): Promise<ClassUpdate> {
  const { data: response } = await axiosInstance.post(`/classes/${data.class_id}/updates`, {
    class_id: data.class_id, // Required by validation schema
    title: data.title,
    content: data.content,
    update_type: data.update_type || 'announcement',
    is_pinned: data.is_pinned || false,
    attachments: data.attachments || [],
  });
  
  const update = response.update;
  
  // Transform backend response to match frontend types
  let reactions: ClassUpdate['reactions'] = [];
  if (update.reactions) {
    reactions = (Object.entries(update.reactions) as [string, BackendReactionData | number][]).flatMap(([emoji, data]) => {
      if (typeof data === 'object' && 'count' in data) {
        if (data.users && data.users.length > 0) {
          return data.users.map((userId: string) => ({
            id: `${update.id}-${emoji}-${userId}`,
            emoji,
            userId,
            userName: 'User'
          }));
        }
      }
      return [];
    });
  }
  
  return {
    id: update.id,
    classId: update.class_id,
    title: update.title,
    content: update.content,
    updateType: update.update_type,
    createdAt: update.created_at,
    updatedAt: update.updated_at,
    className: update.class_name || update.className,
    author: {
      id: update.author.id,
      name: `${update.author.first_name} ${update.author.last_name}`.trim(),
      avatar: update.author.avatar_url,
    },
    reactions,
    comments: update.comments,
    attachments: update.attachments?.map((att: BackendAttachment) => ({
      id: att.id,
      name: att.originalName || att.fileName,
      url: att.url,
      type: att.mimeType,
      size: att.size,
    })),
  };
}

export async function uploadAttachments(classId: string, files: File[]): Promise<BackendAttachment[]> {
  const formData = new FormData();
  formData.append('class_id', classId);
  
  files.forEach((file) => {
    formData.append('attachments', file);
  });
  
  const { data } = await axiosInstance.post('/class-updates/upload-attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return data.attachments;
}

export async function updateClassUpdate(
  updateId: string,
  data: {
    title?: string;
    content?: string;
    update_type?: 'announcement' | 'homework' | 'reminder' | 'event';
    attachments?: BackendAttachment[];
  }
): Promise<ClassUpdate> {
  const { data: response } = await axiosInstance.put(`/class-updates/${updateId}`, data);
  const update = response.update;
  
  // Transform backend response to match frontend types (same as getClassUpdates)
  let reactions: ClassUpdate['reactions'] = [];
  if (update.reactions) {
    reactions = (Object.entries(update.reactions) as [string, BackendReactionData | number][]).flatMap(([emoji, data]) => {
      if (typeof data === 'object' && 'count' in data) {
        if (data.users && data.users.length > 0) {
          return data.users.map((userId: string) => ({
            id: `${update.id}-${emoji}-${userId}`,
            emoji,
            userId,
            userName: 'User'
          }));
        }
      }
      return [];
    });
  }
  
  return {
    id: update.id,
    classId: update.class_id,
    title: update.title,
    content: update.content,
    updateType: update.update_type,
    isPinned: update.is_pinned,
    createdAt: update.created_at,
    updatedAt: update.updated_at,
    className: update.class_name || update.className,
    author: {
      id: update.author.id,
      name: `${update.author.first_name} ${update.author.last_name}`.trim(),
      avatar: update.author.avatar_url,
    },
    reactions,
    comments: update.comments,
    attachments: update.attachments?.map((att: BackendAttachment) => ({
      id: att.id,
      name: att.originalName || att.fileName,
      url: att.url,
      type: att.mimeType,
      size: att.size,
    })),
  };
}

export async function deleteClassUpdate(updateId: string): Promise<void> {
  await axiosInstance.delete(`/class-updates/${updateId}`);
}

export async function togglePinClassUpdate(updateId: string, isPinned: boolean): Promise<void> {
  await axiosInstance.put(`/class-updates/${updateId}/pin`, { is_pinned: isPinned });
}
