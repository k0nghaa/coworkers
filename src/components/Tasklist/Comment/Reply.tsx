"use client";

import ReplyItem from "./ReplyItem";
import InputReply from "./InputReply";
import useComments from "@/hooks/TaskList/useComments";

type ReplyProps = {
  taskId: number;
};

export default function Reply({ taskId }: ReplyProps) {
  const {
    commentData,
    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment,
  } = useComments(taskId);

  return (
    <div>
      <InputReply onCreate={handleCreateComment} />

      {commentData?.map((comment) => (
        <ReplyItem
          key={comment.id}
          comment={comment}
          onUpdate={handleUpdateComment}
          onRemove={handleDeleteComment}
        />
      ))}
    </div>
  );
}
