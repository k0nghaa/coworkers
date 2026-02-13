"use server";

import { fetchApi } from "@/utils/api";
import { ApiResult } from "@/lib/types/api";
import { BASE_URL } from ".";
import {
  CreateTaskRequestBody,
  CreateTaskResponse,
  GetTasksParams,
  GetTasksResponse,
  Task,
  TaskPatch,
  UpdateTaskRequestBody,
} from "../types/task";
import { revalidatePath } from "next/cache";

/**
 * 할 일 생성
 */
export async function createTasks(
  groupId: string,
  taskListId: string,
  data: CreateTaskRequestBody
): Promise<ApiResult<CreateTaskResponse>> {
  try {
    const response = await fetchApi(
      `${BASE_URL}/groups/${groupId}/task-lists/${taskListId}/tasks`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "할일 생성에 실패했습니다.",
      }));

      return {
        success: false,
        error: error.message || "할 일 생성에 실패했습니다.",
      };
    }

    const result = (await response.json()) as CreateTaskResponse;
    return { success: true, data: result };
  } catch {
    return {
      success: false,
      error: "서버 오류가 발생했습니다.",
    };
  }
}

/**
 * 할 일 목록 조회 (사용안함)
 */
export async function getTasks(
  groupId: string,
  taskListId: string,
  params?: GetTasksParams
): Promise<ApiResult<GetTasksResponse>> {
  try {
    const queryString = params?.date ? `?date=${params.date}` : "";
    const response = await fetchApi(
      `${BASE_URL}/groups/${groupId}/task-lists/${taskListId}/tasks${queryString}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "할일 리스트를 가져오는데 실패했습니다.",
      }));
      return {
        success: false,
        error: error.message || "할일 리스트를 가져오는데 실패했습니다.",
      };
    }

    const data = (await response.json()) as GetTasksResponse;
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: "서버 오류가 발생했습니다.",
    };
  }
}

/**
 * 할 일 상세 정보 조회 (사용안함)
 */
export async function getTask(
  groupId: string,
  taskListId: string,
  taskId: string
): Promise<ApiResult<Task>> {
  try {
    const response = await fetchApi(
      `${BASE_URL}/groups/${groupId}/task-lists/${taskListId}/tasks/${taskId}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "할일 상세 정보를 가져오는데 실패했습니다.",
      }));
      return {
        success: false,
        error: error.message || "할일 상세 정보를 가져오는데 실패했습니다.",
      };
    }

    const data = (await response.json()) as Task;
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: "서버 오류가 발생했습니다.",
    };
  }
  /**
   * 할 일 수정 (개별)
   */
}

export async function updateTask(
  groupId: string,
  taskListId: string,
  taskId: string,
  data: UpdateTaskRequestBody
): Promise<ApiResult<TaskPatch>> {
  try {
    const response = await fetchApi(
      `${BASE_URL}/groups/${groupId}/task-lists/${taskListId}/tasks/${taskId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "(개별)할 일 수정에 실패했습니다.",
      }));
      return {
        success: false,
        error: error.message || "(개별)할 일 수정에 실패했습니다.",
      };
    }

    const result = (await response.json()) as TaskPatch;

    // 할 일 완료/취소 시 캐시 무효화
    if (data.done !== undefined) {
      revalidatePath("/myhistory");
    }

    return { success: true, data: result };
  } catch {
    return {
      success: false,
      error: "서버 오류가 발생했습니다.",
    };
    /**
     * 할 일 삭제 (개별)
     */
  }
}

export async function deleteTask(
  groupId: string,
  taskListId: string,
  taskId: string
): Promise<ApiResult<void>> {
  try {
    const response = await fetchApi(
      `${BASE_URL}/groups/${groupId}/task-lists/${taskListId}/tasks/${taskId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "(개별)할 일 삭제에 실패했습니다.",
      }));
      return {
        success: false,
        error: error.message || "(개별)할 일 삭제에 실패했습니다.",
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

/**
 * 반복 할 일 삭제
 * task 객체의 recurringId 필드를 사용하여 반복설정 자체를 삭제
 */
export async function deleteTaskRecurring(
  groupId: string,
  taskListId: string,
  taskId: string,
  recurringId: string
): Promise<ApiResult<void>> {
  try {
    const response = await fetchApi(
      `${BASE_URL}/groups/${groupId}/task-lists/${taskListId}/tasks/${taskId}/recurring/${recurringId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "(반복)할 일 삭제에 실패했습니다.",
      }));
      return {
        success: false,
        error: error.message || "(반복)할 일 삭제에 실패했습니다.",
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
