"use client";

import { useMemo, useEffect } from "react";
import List from "@/components/Tasklist/List/List";
import { formatDate } from "@/utils/date";
import { FrequencyType } from "@/types/schemas";
import { showErrorToast } from "@/utils/error";
import { Task } from "@/lib/types/task";

interface DoneListContainerProps {
  initialData:
    | {
        tasksDone: Array<{
          displayIndex: number;
          writerId: number;
          userId: number;
          deletedAt?: string | null;
          frequency: string;
          description: string;
          name: string;
          recurringId: number;
          doneAt: string;
          date: string;
          updatedAt: string;
          id: number;
        }>;
      }
    | { error: true; message: string };
}

export default function DoneListContainer({
  initialData,
}: DoneListContainerProps) {
  // 에러 발생 시 토스트 표시
  useEffect(() => {
    if ("error" in initialData) {
      showErrorToast(initialData.message);
    }
  }, [initialData]);

  // 서버에서 받은 데이터를 Task 타입으로 변환
  const tasks = useMemo(() => {
    if ("error" in initialData) {
      return [];
    }

    return initialData.tasksDone.map(
      (task): Task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        doneAt: task.doneAt,
        date: task.date,
        startDate: task.date,
        frequency: task.frequency as FrequencyType,
        displayIndex: task.displayIndex,
        recurringId: task.recurringId,
        updatedAt: task.updatedAt,
        commentCount: 0,
        writer: {
          id: task.writerId,
          nickname: "",
          image: null,
        },
      })
    );
  }, [initialData]);

  const groupedTasks = tasks.reduce(
    (acc, task) => {
      if (!task.doneAt) return acc;

      // doneAt에서 날짜 부분만 추출 (YYYY-MM-DD)
      const dateKey = task.doneAt.split("T")[0];

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  // 날짜 문자열을 내림차순 정렬 (최신 날짜가 먼저)
  const sortedDates = Object.keys(groupedTasks).sort((a, b) =>
    b.localeCompare(a)
  );

  if (sortedDates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-md font-medium text-text-default">
          아직 히스토리가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      {sortedDates.map((date) => (
        <div className="flex flex-col gap-16 mb-40" key={date}>
          <h2 className="text-lg font-medium">{formatDate(date)}</h2>
          {groupedTasks[date].map((task) => (
            <List
              key={task.id}
              id={task.id}
              name={task.name}
              startDate={task.startDate}
              isToggle={true}
              variant="simple"
              hideKebab={true}
              commentCount={task.commentCount ?? 0}
              frequency={task.frequency}
              date={task.date}
              displayIndex={task.displayIndex}
              recurringId={task.recurringId}
            />
          ))}
        </div>
      ))}
    </>
  );
}
