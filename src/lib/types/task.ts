export interface User {
  id: number;
  nickname: string;
  image: string | null;
}

// 정규화 결과
export interface Task {
  id: number;
  name: string;
  description?: string;

  // 정규화된 내부 모델
  startDate: string; // SSOT
  date: string; // 호환용: 항상 startDate와 동일

  doneAt?: string | null;
  updatedAt?: string;
  user?: User | null;
  recurringId: number;
  deletedAt?: string | null;
  displayIndex: number;
  writer?: User | null;
  doneBy?: {
    user: User | null;
  };
  commentCount: number;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "ONCE";
}

export type GetTasksResponse = Task[];

// 쿼리 파라미터 타입
export interface GetTasksParams {
  date?: string; // YYYY-MM-DD
}

// POST 응답은 recurring으로 감싸져 있음
export interface CreateTaskResponse {
  recurring: {
    writerId: number;
    groupId: number;
    taskListId: number;
    monthDay?: number;
    weekDays?: number[];
    frequencyType: "DAILY" | "WEEKLY" | "MONTHLY" | "ONCE";
    startDate: string;
    updatedAt: string;
    createdAt: string;
    description: string;
    name: string;
    id: number;
  };
}

// 요청 타입들
export interface TaskRecurringCreateDto {
  MonthlyRecurringCreateBody: {
    name: string;
    description?: string;
    startDate: string;
    frequencyType: "MONTHLY";
    monthDay: number;
  };
  WeeklyRecurringCreateBody: {
    name: string;
    description?: string;
    startDate: string;
    frequencyType: "WEEKLY";
    weekDays: number[];
  };
  DailyRecurringCreateBody: {
    name: string;
    description?: string;
    startDate: string;
    frequencyType: "DAILY";
  };
  OnceRecurringCreateBody: {
    name: string;
    description?: string;
    startDate: string;
    frequencyType: "ONCE";
  };
}

// (POST body 분기 타입 정확하게)
export type CreateTaskRequestBody =
  | TaskRecurringCreateDto["MonthlyRecurringCreateBody"]
  | TaskRecurringCreateDto["WeeklyRecurringCreateBody"]
  | TaskRecurringCreateDto["DailyRecurringCreateBody"]
  | TaskRecurringCreateDto["OnceRecurringCreateBody"];

/* tasklist */
export interface GetTaskListResponse {
  displayIndex: number;
  groupId: number;
  updatedAt: string;
  createdAt: string;
  name: string;
  id: number;
  tasks: Task[];
}

export interface UpdateTaskRequestBody {
  name?: string;
  description?: string;
  done?: boolean;
}

// 모달에서 수정할 때 사용하는 확장 타입
export interface TaskForEdit extends Task {
  weekDays?: number[]; // recurring에서 가져온 정보
  monthDay?: number; // recurring에서 가져온 정보
}

// 서버가 업데이트 결과로 부분 필드만 주더라도 받기(user, writer / userId, writerId 문제 해결)
export type TaskPatch = Pick<Task, "id"> & Partial<Task>;
