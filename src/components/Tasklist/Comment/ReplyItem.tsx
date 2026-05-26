"use client";

import Avatar from "../../Common/Avatar/Avatar";
import Button from "../../Common/Button/Button";
import { Modal } from "../../Common/Modal";
import useKebabMenu from "@/hooks/useKebabMenu";
import Dropdown from "../../Common/Dropdown/Dropdown";
import { CommentResponse } from "@/lib/types/comment";

type CommentItemProps = {
  comment: CommentResponse;
  onUpdate: (id: number, newContent: string) => void;
  onRemove: (id: number) => void;
};

export default function ReplyItem({
  comment,
  onUpdate,
  onRemove,
}: CommentItemProps) {
  const kebab = useKebabMenu({
    initialContent: comment.content,
    onInlineSave: (newContent) => {
      onUpdate(comment.id, newContent);
    },
    onDelete: () => {
      onRemove(comment.id);
    },
    deleteModalTitle: "해당 댓글을 정말 삭제하시겠어요?",
  });

  return (
    <div className="flex flex-col gap-8 mt-16">
      <div className="flex justify-between items-start text-text-primary text-md font-regular">
        {kebab.isEditing ? (
          <textarea
            value={kebab.content}
            onChange={(e) => kebab.setContent(e.target.value)}
            autoFocus
            className="flex-1 resize-none field-sizing-content placeholder-text-default text-text-primary text-md font-regular outline-none focus:outline-none"
          />
        ) : (
          <div>{comment.content}</div>
        )}

        {!kebab.isEditing && (
          <>
            <div className="relative">
              <Dropdown
                options={kebab.dropdownOptions}
                size="md"
                trigger="icon"
                icon="kebabSmall"
                listPosition="absolute right-0 top-full mt-5"
                onSelect={kebab.handleDropdownSelect}
                align="center"
              />
            </div>

            <Modal
              isOpen={kebab.isModalOpen}
              onClose={kebab.handleModalClose}
              title={kebab.deleteModalTitle}
              description={kebab.deleteModalDescription}
              primaryButton={{
                label: "삭제하기",
                onClick: kebab.handleDeleteConfirm,
                variant: "danger",
              }}
              secondaryButton={{
                label: "닫기",
                onClick: kebab.handleModalClose,
              }}
            />
          </>
        )}
      </div>

      {kebab.isEditing ? (
        <div className="flex items-center justify-end gap-20">
          <button
            onClick={kebab.handleCancelEdit}
            className="text-text-default text-md font-semibold"
          >
            취소
          </button>
          <Button
            variant="outlined"
            size="xSmall"
            label="수정하기"
            onClick={kebab.handleSaveEdit}
          />
        </div>
      ) : (
        <div className="flex items-center">
          <Avatar
            imageUrl={comment.user.image ?? undefined}
            altText={`${comment.user.nickname} 프로필`}
            size="large"
          />
          <span className="ml-12 text-text-primary text-md font-medium">
            {comment.user.nickname}
          </span>
          <span className="ml-auto text-text-secondary text-md font-regular">
            {comment.createdAt.slice(0, 10)}
          </span>
        </div>
      )}

      <div className="border border-border-primary mt-5"></div>
    </div>
  );
}
