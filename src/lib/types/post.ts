export interface Post {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  comments: number;
  // Optional fields that may be used for event conversion
  title?: string | undefined;
  endDate?: Date | undefined;
  location?: string | undefined;
  eventDetails?: Record<string, unknown> | undefined;
}
