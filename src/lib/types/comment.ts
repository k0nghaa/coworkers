export type CommentResponse = {
  user: { image: string | null; nickname: string; id: number };
  userId: number;
  taskId: number;
  updatedAt: string;
  createdAt: string;
  content: string;
  id: number;
};

export type CreateCommentRequestBody = {
  content: string;
};
