"use client";

import { getGroup } from "@/lib/api/group";
import { createTaskList, getTaskList } from "@/lib/api/tasklist";
import { useEffect, useMemo, useState } from "react";
import List from "@/components/Tasklist/List/List";
import DateNavigator from "@/components/Tasklist/DateNavigator";
import TaskDetailsContainer from "./tasks/TaskDetailsContainer";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TaskCreateModal, {
  CreateTaskForm,
} from "@/components/Tasklist/TaskCreateModal";
import TaskCreateButton from "../../components/Tasklist/TaskCreateButton";
import {
  CreateTaskRequestBody,
  GetTaskListResponse,
  Task,
} from "@/lib/types/task";
import { createTasks, deleteTaskRecurring, updateTask } from "@/lib/api/task";
import ListCreateButton from "@/components/Tasklist/ListCreateButton";
import TabList from "@/components/Tasklist/Tab/TabList";
import { toast } from "react-toastify";
import { useHeaderStore } from "@/store/headerStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTodayDate } from "@/utils/date";

interface TaskListPageContainerProps {
  groupId: string;
}

export default function TaskListPageContainer({
  groupId,
}: TaskListPageContainerProps) {
  const isLogin = useHeaderStore((set) => set.isLogin);
  const isHydrated = useHeaderStore((set) => set.isHydrated);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    data: groupData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const response = await getGroup(groupId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    staleTime: Infinity, // 자주 변경되지 않는 그룹 데이터의 staleTime을 무한대로 설정하여 불필요한 refetch 방지 + 새로고침 시 다시 fetch 가능
  });
  const taskLists = groupData?.taskLists ?? [];

  const taskListId =
    searchParams.get("tab") || taskLists[0]?.id.toString() || "";

  const date = searchParams.get("date") || getTodayDate();

  const {
    data: taskListData,
    isLoading: isTaskListLoading,
    isError: isTaskListError,
  } = useQuery({
    queryKey: ["tasklist", { groupId, taskListId, date }],
    queryFn: async () => {
      const response = await getTaskList(groupId, taskListId, { date });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!taskListId,
  });

  const queryClient = useQueryClient();

  const { mutate: toggleTask } = useMutation({
    mutationFn: ({ taskId, done }: { taskId: number; done: boolean }) =>
      updateTask(groupId, taskListId, taskId, { done }),
    onMutate: async ({ taskId, done }) => {
      await queryClient.cancelQueries({
        queryKey: ["tasklist", { groupId, taskListId, date }],
      });

      const previousTaskList = queryClient.getQueryData([
        "tasklist",
        { groupId, taskListId, date },
      ]);

      queryClient.setQueryData<GetTaskListResponse>(
        ["tasklist", { groupId, taskListId, date }],
        (oldTaskListData) => {
          if (!oldTaskListData) return oldTaskListData;
          return {
            ...oldTaskListData,
            tasks: oldTaskListData.tasks.map((t) =>
              t.id === taskId
                ? { ...t, doneAt: done ? new Date().toISOString() : null }
                : t
            ),
          };
        }
      );

      return { previousTaskList };
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.done ? "완료되었습니다." : "완료가 취소되었습니다."
      );
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ["tasklist", { groupId, taskListId, date }],
        context?.previousTaskList
      );
      toast.error("완료 상태 변경 중 오류가 발생했습니다.");
    },
    onSettled: () => {
      // 최종 동기화
      queryClient.invalidateQueries({
        queryKey: ["tasklist", { groupId, taskListId, date }],
      });
    },
  });

  const { mutate: updateTaskMutate } = useMutation({
    mutationFn: ({
      taskId,
      ...updates
    }: {
      taskId: number;
    } & Partial<Task>) => updateTask(groupId, taskListId, taskId, updates),
    onMutate: async ({ taskId, ...updates }) => {
      await queryClient.cancelQueries({
        queryKey: ["tasklist", { groupId, taskListId, date }],
      });

      const previousTaskList = queryClient.getQueryData([
        "tasklist",
        { groupId, taskListId, date },
      ]);

      queryClient.setQueryData<GetTaskListResponse>(
        ["tasklist", { groupId, taskListId, date }],
        (oldTaskListData) => {
          if (!oldTaskListData) return oldTaskListData;
          return {
            ...oldTaskListData,
            tasks: oldTaskListData.tasks.map((t) =>
              t.id === taskId ? { ...t, ...updates } : t
            ),
          };
        }
      );

      return { previousTaskList };
    },
    onSuccess: () => {
      toast.success("할 일이 수정되었습니다.");
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ["tasklist", { groupId, taskListId, date }],
        context?.previousTaskList
      );
      toast.error("할 일 수정 중 오류가 발생했습니다.");
    },
    onSettled: () => {
      // 최종 동기화
      queryClient.invalidateQueries({
        queryKey: ["tasklist", { groupId, taskListId, date }],
      });
    },
  });

  const { mutate: deleteTaskMutate } = useMutation({
    mutationFn: ({
      taskId,
      recurringId,
    }: {
      taskId: number;
      recurringId: number;
    }) => deleteTaskRecurring(groupId, taskListId, taskId, recurringId),
    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({
        queryKey: ["tasklist", { groupId, taskListId, date }],
      });

      const previousTaskList = queryClient.getQueryData([
        "tasklist",
        { groupId, taskListId, date },
      ]);

      queryClient.setQueryData<GetTaskListResponse>(
        ["tasklist", { groupId, taskListId, date }],
        (oldTaskListData) => {
          if (!oldTaskListData) return oldTaskListData;
          return {
            ...oldTaskListData,
            tasks: oldTaskListData.tasks.filter((t) => t.id !== taskId),
          };
        }
      );
      return { previousTaskList };
    },
    onSuccess: () => {
      toast.success("할 일이 삭제되었습니다.");
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ["tasklist", { groupId, taskListId, date }],
        context?.previousTaskList
      );
      toast.error("할 일 삭제 중 오류가 발생했습니다.");
    },
    onSettled: () => {
      // 최종 동기화
      queryClient.invalidateQueries({
        queryKey: ["tasklist", { groupId, taskListId, date }],
      });
    },
  });

  const { mutate: createTaskMutate, isPending: isTaskCreating } = useMutation({
    mutationFn: (newTask: CreateTaskRequestBody) =>
      createTasks(Number(groupId), Number(taskListId), newTask),
    onSuccess: (_, variables) => {
      const targetDate = variables.startDate.split("T")[0];
      const currentDate = searchParams.get("date") ?? getTodayDate();

      if (targetDate !== currentDate) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("date", targetDate);
        router.push(`${pathname}?${params.toString()}`);
      } else {
        queryClient.invalidateQueries({
          queryKey: ["tasklist", { groupId, taskListId, date }],
        });
      }

      toast.success("할 일이 생성되었습니다.");
    },
    onError: () => {
      toast.error("할 일 생성에 실패했습니다.");
    },
  });

  const { mutate: createTaskListMutate, isPending: isTaskListCreating } =
    useMutation({
      mutationFn: (name: string) => createTaskList(groupId, name),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
        toast.success("할 일 목록이 생성되었습니다.");
      },
      onError: () => {
        toast.error("할 일 목록 생성에 실패했습니다.");
      },
    });

  const openTaskId = searchParams.get("task");
  const openTask = taskListData?.tasks.find(
    (task) => task.id.toString() === openTaskId
  );

  const [editTaskId, setEditTaskId] = useState<number | null>(null);

  const editingTask = useMemo(() => {
    return taskListData?.tasks.find((t) => t.id === editTaskId) ?? null;
  }, [taskListData, editTaskId]);

  // // 사이드바 열릴 때 배경 스크롤 방지
  // useEffect(() => {
  //   if (openTask) {
  //     document.body.classList.add("no-scroll");
  //   } else {
  //     document.body.classList.remove("no-scroll");
  //   }

  //   return () => {
  //     document.body.classList.remove("no-scroll");
  //   };
  // }, [openTask]);

  // 1. 초기 로드: 모든 TaskList 가져오기
  useEffect(() => {
    // hydration 전에는 체크하지 않음
    if (!isHydrated) return;
    // 비로그인이면 로그인 페이지로 이동합니다.
    if (!isLogin) {
      router.replace("/login");
      return;
    }
  }, [isHydrated, isLogin, router]);

  // Task 클릭 핸들러 - 상세보기용
  const handleTaskClick = (taskId: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("task", taskId.toString());
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleCloseSidebar = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("task");
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Task 완료 토글 핸들러
  const handleTaskToggle = (taskId: number) => {
    if (!taskListData) return;

    const newToggleTask = taskListData?.tasks.find((t) => t.id === taskId);
    toggleTask({ taskId, done: !newToggleTask?.doneAt });
  };

  // Task 수정 핸들러
  const handleUpdateTask = (taskId: number, updates: Partial<Task>) => {
    if (!taskListData) return;

    updateTaskMutate({ taskId, ...updates });
  };

  // Task 삭제
  const handleDeleteTask = (taskId: number, recurringId: number) => {
    if (!taskListData) return;

    deleteTaskMutate({ taskId, recurringId });
  };

  // Task 편집 (모달 등)
  const handleEditTask = (taskId: number) => {
    setEditTaskId(taskId);
  };

  // handleCreateTask 함수만 수정
  const handleCreateTask = (form: CreateTaskForm) => {
    if (!taskListId) return;

    const createPayload: CreateTaskRequestBody = (() => {
      const basePayload = {
        name: form.name,
        description: form.description,
        startDate: form.startDate.toISOString(),
      };

      switch (form.frequencyType) {
        case "MONTHLY":
          return {
            ...basePayload,
            frequencyType: "MONTHLY" as const,
            monthDay: form.monthDay!,
          };
        case "WEEKLY":
          return {
            ...basePayload,
            frequencyType: "WEEKLY" as const,
            weekDays: form.weekDays!,
          };
        case "DAILY":
          return {
            ...basePayload,
            frequencyType: "DAILY" as const,
          };
        case "ONCE":
          return {
            ...basePayload,
            frequencyType: "ONCE" as const,
          };
      }
    })();

    createTaskMutate(createPayload);
  };

  const handleCreateList = (name: string) => {
    if (!name.trim()) return;

    // 중복 체크: 현재 팀의 task-list 중 같은 이름이 있는지 확인
    const isDuplicate = taskLists.some(
      (list) => list.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast.error("이미 존재하는 목록 이름입니다.");
      return;
    }

    createTaskListMutate(name);
  };

  useEffect(() => {
    if (isError) toast.error("리스트를 가져오는 중 오류가 발생했습니다.");
  }, [isError]);

  useEffect(() => {
    if (isTaskListError) toast.error("할 일 불러오는 중 오류가 발생했습니다.");
  }, [isTaskListError]);

  if (isLoading) return <div>로딩 중 ...</div>;
  if (isError) return null;
  if (isTaskListLoading) return <div>로딩 중 ...</div>;
  if (isTaskListError) return null;

  return (
    <div className="relative max-w-1200 mx-auto my-0 sm:px-24 px-16 mb-80">
      <div id="wrapper" className="flex flex-col gap-24">
        <header className="text-xl font-bold mt-40">할 일</header>

        <div className="flex justify-between">
          <DateNavigator baseDate={date} />
          <ListCreateButton onCreate={handleCreateList} />
        </div>
        <div className="h-20">
          <nav className="overflow-x-auto custom-scrollbar">
            <TabList tabs={taskLists} />
          </nav>
        </div>
        <main className="flex-1">
          {taskListData && (
            <div className="flex flex-col gap-16">
              {taskListData.tasks.length === 0 ? (
                <div className="text-text-default text-center mx-auto my-0 p-100">
                  <p className="hidden md:block">
                    아직 할 일이 없습니다 <br /> 할 일을 추가해보세요.
                  </p>
                  <p className="md:hidden whitespace-nowrap">
                    아직 할 일이 없습니다 <br /> 할 일을 추가해보세요.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-8">
                    {taskListData.tasks.map((task) => (
                      <List
                        {...task}
                        key={task.id}
                        onClick={() => handleTaskClick(task.id)}
                        isToggle={!!task.doneAt}
                        onToggle={handleTaskToggle}
                        variant="detailed"
                        onUpdateTask={() =>
                          handleUpdateTask(task.id, {
                            name: task.name,
                            description: task.description,
                          })
                        }
                        onDeleteTask={() =>
                          handleDeleteTask(task.id, task.recurringId)
                        }
                        onEditTask={handleEditTask}
                        startDate={task.date}
                      />
                    ))}

                    <TaskCreateModal
                      isOpen={editTaskId !== null}
                      onClose={() => setEditTaskId(null)}
                      taskToEdit={editingTask}
                      onSubmit={(form) => {
                        if (editTaskId) {
                          // 수정 시에는 name과 description만 전달
                          handleUpdateTask(editTaskId, {
                            name: form.name,
                            description: form.description,
                          });
                        } else {
                          handleCreateTask(form); // POST
                        }
                      }}
                    />
                  </div>

                  {openTask && (
                    <div
                      onClick={handleCloseSidebar}
                      className="fixed inset-0 bg-black/30 z-50"
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="fixed right-0 top-0 h-full w-full sm:w-600 bg-background-secondary shadow-xl overflow-y-auto"
                      >
                        <TaskDetailsContainer
                          task={openTask}
                          onClose={handleCloseSidebar}
                          onToggleDone={(id) => handleTaskToggle(id)}
                          onTaskUpdated={(update) => {
                            const { id, ...updates } = update;
                            handleUpdateTask(id, updates);
                          }}
                          onTaskDeleted={(id) =>
                            handleDeleteTask(id, openTask.recurringId)
                          }
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
        {!openTask && (
          <div className="fixed bottom-50 z-50 right-[max(1.5rem,calc(50%-600px+1.5rem))]">
            <TaskCreateButton onCreateTask={handleCreateTask} />
          </div>
        )}
      </div>
    </div>
  );
}
