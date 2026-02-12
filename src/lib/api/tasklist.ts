"use server";

import { BASE_URL } from "@/lib/api";
import { fetchApi } from "@/utils/api";
import { ApiResult } from "@/lib/types/api";
import { Task } from "@/lib/types/task";

// 응답 타입 정의
export type TaskListResponse = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  groupId: number;
  displayIndex: number;
};

export type GetTaskListResponse = {
  id: number;
  name: string;
  displayIndex: number;
  groupId: number;
  updatedAt: string;
  createdAt: string;
  tasks: Task[];
};

export type GetTasksParams = {
  date?: string;
};

// Task 기반으로 만들되 서버가 date만 줄 수 있으니 둘다 optional
type TaskFromApi = Omit<Task, "startDate" | "date"> & {
  startDate?: string;
  date?: string;
};

/**
 * 할 일 목록 상세 조회
 */
export async function getTaskList(
  groupId: string,
  id: string,
  params?: GetTasksParams
): Promise<ApiResult<GetTaskListResponse>> {
  try {
    const queryString = params?.date ? `?date=${params.date}` : "";

    const response = await fetchApi(
      `${BASE_URL}/groups/${groupId}/task-lists/${id}${queryString}`
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "할 일 목록을 가져오는데 실패했습니다.",
      }));
      return {
        success: false,
        error: error.message || "할 일 목록을 가져오는데 실패했습니다.",
      };
    }

    const data = (await response.json()) as GetTaskListResponse;

    const tasks = (data.tasks as TaskFromApi[]).reduce<Task[]>((acc, t) => {
      const startDate = t.startDate ?? t.date;
      if (!startDate) return acc; // 이상 응답은 버림 (toast/log는 선택)
      acc.push({
        ...t,
        startDate,
        date: startDate, // 호환용
      });
      return acc;
    }, []);

    const mapped: GetTaskListResponse = {
      ...data,
      tasks,
    };

    return { success: true, data: mapped };
  } catch {
    return {
      success: false,
      error: "서버 오류가 발생했습니다.",
    };
  }
}

/**
 * 할 일 목록 생성
 */
export async function createTaskList(
  groupId: string,
  name: string
): Promise<ApiResult<TaskListResponse>> {
  try {
    const response = await fetchApi(
      `${BASE_URL}/groups/${groupId}/task-lists`,
      {
        method: "POST",
        body: JSON.stringify({ name }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "할 일 목록 생성에 실패했습니다.",
      }));
      return {
        success: false,
        error: error.message || "할 일 목록 생성에 실패했습니다.",
      };
    }

    const data = (await response.json()) as TaskListResponse;
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: "서버 오류가 발생했습니다.",
    };
  }
}

/**
 * 할 일 목록 수정
 */
export async function updateTaskList(
  groupId: string,
  taskListId: number,
  name: string
): Promise<ApiResult<TaskListResponse>> {
  try {
    const response = await fetchApi(
      `${BASE_URL}/groups/${groupId}/task-lists/${taskListId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "할 일 목록 수정에 실패했습니다.",
      }));
      return {
        success: false,
        error: error.message || "할 일 목록 수정에 실패했습니다.",
      };
    }

    const data = (await response.json()) as TaskListResponse;
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: "서버 오류가 발생했습니다.",
    };
  }
}

/**
 * 할 일 목록 삭제
 */
export async function deleteTaskList(
  groupId: string,
  taskListId: number
): Promise<ApiResult<void>> {
  try {
    const response = await fetchApi(
      `${BASE_URL}/groups/${groupId}/task-lists/${taskListId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "할 일 목록 삭제에 실패했습니다.",
      }));
      return {
        success: false,
        error: error.message || "할 일 목록 삭제에 실패했습니다.",
      };
    }

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "서버 오류가 발생했습니다.",
    };
  }
}

/* PATCH /groups/${groupId}/task-lists/${id}/order
할일 목록 순서 변경 API
기능 추가할 때 API 추가
*/
