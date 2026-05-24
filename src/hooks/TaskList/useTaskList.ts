import { CreateTaskForm } from "@/components/Tasklist/TaskCreateModal";
import { getGroup } from "@/lib/api/group";
import { createTasks, deleteTaskRecurring, updateTask } from "@/lib/api/task";
import {
  createTaskList,
  getTaskList,
  GetTaskListResponse,
} from "@/lib/api/tasklist";
import { CreateTaskRequestBody, Task } from "@/lib/types/task";
import { useHeaderStore } from "@/store/headerStore";
import { getTodayDate } from "@/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

export default function useTaskList({ groupId }: { groupId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isLogin = useHeaderStore((set) => set.isLogin);
  const isHydrated = useHeaderStore((set) => set.isHydrated);

  const {
    data: groupData,
    isLoading: isGroupDataLoading,
    isError: isGroupDataError,
  } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const response = await getGroup(groupId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    staleTime: Infinity, // 자주 변경되지 않는 그룹 데이터의 staleTime을 무한대로 설정하여 불필요한 refetch 방지 + 새로고침 시 다시 fetch 가능
    enabled: isHydrated && isLogin && !!groupId,
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

  // Task 완료 토글 핸들러
  const handleTaskToggle = (taskId: number) => {
    if (!taskListData) return;

    const newToggleTask = taskListData?.tasks.find((t) => t.id === taskId);
    if (!newToggleTask) return;

    toggleTask({ taskId, done: !newToggleTask.doneAt });
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

  return {
    date,
    taskLists,
    taskListData,

    isGroupDataLoading,
    isGroupDataError,
    isTaskListLoading,
    isTaskListError,
    isTaskCreating,
    isTaskListCreating,

    handleTaskToggle,
    handleUpdateTask,
    handleDeleteTask,
    handleCreateTask,
    handleCreateList,
  };
}
