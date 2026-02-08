"use client";

import Avatar from "@/components/Common/Avatar/Avatar";
import Button from "@/components/Common/Button/Button";
import ButtonFloating from "@/components/Common/Button/ButtonFloating";
import Dropdown from "@/components/Common/Dropdown/Dropdown";
import { Modal } from "@/components/Common/Modal";
import SVGIcon from "@/components/Common/SVGIcon/SVGIcon";
import Reply from "@/components/Tasklist/Comment/Reply";
import useKebabMenu from "@/hooks/useKebabMenu";
import { Task } from "@/lib/types/task";
import { formatDate, formatTime } from "@/utils/date";
import { getFrequencyText } from "@/utils/frequency";
import clsx from "clsx";
import { useState } from "react";

type TaskDetailsContainerProps = {
  task: Task;
  onClose?: () => void;
  onToggleDone?: (taskId: number) => void;
  onTaskUpdated?: (updated: Partial<Task> & { id: number }) => void;
  onTaskDeleted?: (taskId: number) => void;
  isPending?: boolean;
};

export default function TaskDetailsContainer({
  task,
  onClose,
  onToggleDone,
  onTaskUpdated,
  onTaskDeleted,
  isPending = false,
}: TaskDetailsContainerProps) {
  // // 수정 모드 (제목 + 메모 함께)
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(task.name);
  const [editedDescription, setEditedDescription] = useState(
    task.description || ""
  );

  const kebab = useKebabMenu({
    initialContent: task.name,
    onSave: (newContent) => {
      // name만 전달
      onTaskUpdated?.({ id: task.id, name: newContent });
    },

    onEdit: () => {
      setEditedName(task.name);
      setEditedDescription(task.description || "");
      setIsEditing(true);
    },

    onDelete: () => onTaskDeleted?.(task.id),

    deleteModalTitle: (
      <>
        &apos;{task.name}&apos;
        <br />할 일을 정말 삭제하시겠어요?
      </>
    ),
    isPending,
  });

  const handleToggle = () => {
    if (isPending) return;
    onToggleDone?.(task.id);
  };

  const handleSave = () => {
    if (isPending) return;
    // name과 description만 전달
    onTaskUpdated?.({
      id: task.id,
      name: editedName,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  return (
    <>
      <div className="flex flex-col gap-16 pt-64 p-50">
        <SVGIcon icon="x" onClick={onClose} className="cursor-pointer" />

        {task.doneAt && (
          <div className="flex items-center gap-6">
            <SVGIcon
              icon="check"
              size="xxs"
              className="[--icon-stroke:var(--color-brand-tertiary)]"
            />
            <span className="text-xs font-medium text-brand-tertiary">
              완료
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-12">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-8">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                autoFocus
                className="flex-1 text-xl font-bold bg-transparent border-b border-brand-primary outline-none px-4 py-2"
                placeholder="할 일 제목을 입력하세요"
              />
            </div>
          ) : (
            <>
              <h3
                className={clsx(
                  "text-xl font-bold",
                  task.doneAt && "line-through"
                )}
              >
                {task.name}
              </h3>

              <div className="relative">
                <Dropdown
                  options={kebab.dropdownOptions}
                  size="md"
                  trigger="icon"
                  icon="kebabLarge"
                  listPosition="absolute right-0 top-full mt-5"
                  onSelect={(value) => {
                    if (isPending) return;
                    kebab.handleDropdownSelect(value);
                  }}
                  align="center"
                />
              </div>
            </>
          )}
          <Modal
            isOpen={kebab.isModalOpen}
            onClose={kebab.handleModalClose}
            title={kebab.deleteModalTitle}
            description={kebab.deleteModalDescription}
            primaryButton={{
              label: "삭제하기",
              onClick: kebab.handleDeleteConfirm,
              variant: "danger",
              disabled: isPending,
              loading: isPending,
            }}
            secondaryButton={{
              label: "닫기",
              onClick: kebab.handleModalClose,
            }}
          />
        </div>
        <div className="flex items-center">
          <Avatar
            imageUrl={task.writer?.image ?? undefined}
            altText={`${task.writer?.nickname} 프로필`}
            size="large"
          />
          <span className="ml-12 text-md font-medium">
            {task.writer?.nickname}
          </span>
          <span className="ml-auto text-text-secondary text-md font-regular">
            {task.updatedAt ? formatDate(task.updatedAt) : "-"}
          </span>
        </div>

        {!task.doneAt && (
          <div className="flex items-center gap-10 text-text-default text-xs font-regular">
            <div className="flex items-center gap-6">
              <SVGIcon icon="calendar" size="xxs" />
              <span>{task.date ? formatDate(task.date) : "-"}</span>
            </div>
            <div className="w-px h-8 bg-background-tertiary" />
            <div className="flex items-center gap-6">
              <SVGIcon icon="iconTime" size="xxs" />
              <span>{task.date ? formatTime(task.date) : "-"}</span>
            </div>
            <div className="w-px h-8 bg-background-tertiary " />
            <div className="flex items-center gap-6">
              <SVGIcon icon="iconRepeat" size="xxs" />
              <span>{getFrequencyText(task.frequency)}</span>
            </div>
          </div>
        )}

        {isEditing ? (
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            autoFocus
            className="min-h-180 flex-1 resize-none placeholder-text-default text-text-primary text-md font-regular focus:outline-none focus:border-b focus:border-brand-primary"
          />
        ) : (
          <div className="min-h-200 text-text-primary text-md font-regular">
            {task.description || "메모가 없습니다."}
          </div>
        )}

        {isEditing && (
          <div className="flex items-center justify-end gap-20">
            <button
              onClick={() => setIsEditing(false)}
              className="text-text-default text-md font-semibold"
            >
              취소
            </button>
            <Button
              variant="outlined"
              size="xSmall"
              label="수정하기"
              onClick={handleSave}
              disabled={isPending}
              loading={isPending}
            />
          </div>
        )}

        <Reply taskId={task.id} />

        <div className="fixed bottom-50 z-50 right-50">
          {task.doneAt ? (
            <ButtonFloating
              label="완료 취소하기"
              icon={<SVGIcon icon="check" size="xxs" className="mr-4" />}
              variant="outlined"
              size="large"
              onClick={handleToggle}
              disabled={isPending}
            />
          ) : (
            <ButtonFloating
              label="완료 하기"
              icon={
                <SVGIcon
                  icon="check"
                  size="xxs"
                  className="[--icon-stroke:var(--color-icon-inverse)] mr-4"
                />
              }
              variant="solid"
              size="large"
              onClick={handleToggle}
              disabled={isPending}
            />
          )}
        </div>
      </div>
    </>
  );
}
