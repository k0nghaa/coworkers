import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from "@/lib/api/comment";
import { CommentResponse, CreateCommentRequestBody } from "@/lib/types/comment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export default function useComments(taskId: number) {
  const {
    data: commentData,
    isLoading: isCommentLoading,
    isError: isCommentError,
  } = useQuery({
    queryKey: ["comment", taskId],
    queryFn: async () => {
      const response = await getComments(taskId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  const queryClient = useQueryClient();

  /**
   * 댓글 생성 Mutation
   */
  const { mutate: createCommentMutate, isPending: isCommentCreating } =
    useMutation({
      mutationFn: (newComment: CreateCommentRequestBody) =>
        createComment(taskId, newComment),

      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["comment", taskId] });
        toast.success("댓글이 등록되었습니다");
      },
      onError: () => {
        toast.error("댓글 생성 중 오류가 발생했습니다.");
      },
    });

  /**
   * 댓글 수정 Mutation
   */
  const { mutate: updateCommentMutate } = useMutation({
    mutationFn: ({
      comment,
      commentId,
    }: {
      comment: CreateCommentRequestBody;
      commentId: number;
    }) => updateComment(taskId, commentId, comment),
    onMutate: async ({ commentId, comment }) => {
      await queryClient.cancelQueries({
        queryKey: ["comment", taskId],
      });

      const previousComments = queryClient.getQueryData(["comment", taskId]);

      queryClient.setQueryData<CommentResponse[]>(
        ["comment", taskId],
        (oldComments) => {
          if (!oldComments) return oldComments;
          return oldComments.map((c) =>
            c.id === commentId ? { ...c, content: comment.content } : c
          );
        }
      );

      return { previousComments };
    },
    onSuccess: () => {
      toast.success("댓글이 수정되었습니다.");
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["comment", taskId], context?.previousComments);
      toast.error("댓글 수정 중 오류가 발생했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["comment", taskId],
      });
    },
  });

  /**
   * 댓글 삭제 Mutation
   */
  const { mutate: deleteCommentMutate } = useMutation({
    mutationFn: ({ commentId }: { commentId: number }) =>
      deleteComment(taskId, commentId),
    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({
        queryKey: ["comment", taskId],
      });

      const previousComments = queryClient.getQueryData(["comment", taskId]);

      queryClient.setQueryData<CommentResponse[]>(
        ["comment", taskId],
        (oldComments) => {
          if (!oldComments) return oldComments;
          return oldComments.filter((c) => c.id !== commentId);
        }
      );
      return { previousComments };
    },
    onSuccess: () => {
      toast.success("댓글이 삭제되었습니다.");
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["comment", taskId], context?.previousComments);
      toast.error("댓글 삭제 중 오류가 발생했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["comment", taskId],
      });
    },
  });

  const handleCreateComment = (content: string) => {
    const MIN = 1;
    const MAX = 200;

    const trimmed = content.trim();
    if (trimmed.length < MIN) {
      toast.error(`댓글은 최소 ${MIN}자 이상 입력해주세요.`);
      return;
    }
    if (trimmed.length > MAX) {
      toast.error(`댓글은 최대 ${MAX}자까지 입력 가능합니다.`);
      return;
    }
    createCommentMutate({ content: trimmed });
  };

  const handleUpdateComment = (commentId: number, content: string) => {
    updateCommentMutate({ commentId, comment: { content } });
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutate({ commentId });
  };

  return {
    commentData,
    isCommentLoading,
    isCommentError,
    isCommentCreating,

    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment,
  };
}
