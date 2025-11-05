export interface ClassUpdate {
  id: string;
  classId?: string;
  title: string;
  content: string;
  updateType?: 'announcement' | 'homework' | 'reminder' | 'event';
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
  className?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  reactions?: Reaction[];
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}
