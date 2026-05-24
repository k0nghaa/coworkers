"use client";
import { useEffect, useMemo, useState } from "react";
import List from "@/components/Tasklist/List/List";
import DateNavigator from "@/components/Tasklist/DateNavigator";
import TaskDetailsContainer from "./tasks/TaskDetailsContainer";
import TaskCreateModal from "@/components/Tasklist/TaskCreateModal";
import TaskCreateButton from "../../components/Tasklist/TaskCreateButton";
import ListCreateButton from "@/components/Tasklist/ListCreateButton";
import TabList from "@/components/Tasklist/Tab/TabList";
import { toast } from "react-toastify";
import { useHeaderStore } from "@/store/headerStore";
import useTaskList from "@/hooks/TaskList/useTaskList";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface TaskListPageContainerProps {
  groupId: string;
}

export default function TaskListPageContainer({
  groupId,
}: TaskListPageContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isLogin = useHeaderStore((set) => set.isLogin);
  const isHydrated = useHeaderStore((set) => set.isHydrated);

  const {
    date,
    taskLists,
    taskListData,
    isGroupDataError,
    isGroupDataLoading,
    isTaskListError,
    isTaskListLoading,
    handleCreateList,
    handleCreateTask,
    handleDeleteTask,
    handleTaskToggle,
    handleUpdateTask,
  } = useTaskList({ groupId });

  const openTaskId = searchParams.get("task");
  const openTask = taskListData?.tasks.find(
    (task) => task.id.toString() === openTaskId
  );

  const [editTaskId, setEditTaskId] = useState<number | null>(null);

  const editingTask = useMemo(() => {
    return taskListData?.tasks.find((t) => t.id === editTaskId) ?? null;
  }, [taskListData, editTaskId]);

  useEffect(() => {
    // hydration 전에는 체크하지 않음
    if (!isHydrated) return;
    if (!isLogin) router.replace("/login");
  }, [isHydrated, isLogin, router]);

  useEffect(() => {
    if (isGroupDataError)
      toast.error("리스트를 가져오는 중 오류가 발생했습니다.");
  }, [isGroupDataError]);

  useEffect(() => {
    if (isTaskListError) toast.error("할 일 불러오는 중 오류가 발생했습니다.");
  }, [isTaskListError]);

  // 사이드바 열릴 때 배경 스크롤 방지
  useEffect(() => {
    if (openTask) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [openTask]);

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

  // Task 편집 (모달 등)
  const handleEditTask = (taskId: number) => {
    setEditTaskId(taskId);
  };

  if (isGroupDataLoading) return <div>로딩 중 ...</div>;
  if (isGroupDataError) return null;
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
