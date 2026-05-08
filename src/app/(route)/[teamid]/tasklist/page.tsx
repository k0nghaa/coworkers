import TaskListPageContainer from "@/containers/tasklist/TaskListContainer";
import { getGroup } from "@/lib/api/group";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Metadata } from "next";

type TaskListPageProps = {
  params: Promise<{ teamid: string }>;
  searchParams: Promise<{ tab?: string; date?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamid: string }>;
}): Promise<Metadata> {
  const { teamid: groupId } = await params;

  const taskListsResponse = await getGroup(groupId);
  const teamName = taskListsResponse.success ? taskListsResponse.data.name : "";

  return {
    title: `${teamName}팀의 할 일 리스트`,
    description: `${teamName}팀의 할 일 리스트를 확인할 수 있는 페이지입니다.`,
    openGraph: {
      title: `${teamName}팀의 할 일 리스트`,
      description: `${teamName}팀의 할 일 리스트를 확인할 수 있는 페이지입니다.`,
    },
  };
}

export default async function TaskListPage({ params }: TaskListPageProps) {
  const { teamid: groupId } = await params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const response = await getGroup(groupId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <TaskListPageContainer groupId={groupId} />
    </HydrationBoundary>
  );
}
