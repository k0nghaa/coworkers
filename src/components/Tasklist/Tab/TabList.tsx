"use client";

import TabItem from "./TabItem";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TaskListResponse } from "@/lib/types/tasklist";

interface TabsProps {
  tabs: TaskListResponse[];
}

export default function TabList({ tabs }: TabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 어떤 탭을 실제로 보여줄지 결정(UI)
  const activeTabId =
    searchParams.get("tab") ??
    (tabs[0]?.id !== undefined ? String(tabs[0].id) : undefined);

  const switchTab = (tabId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tabId);

    // 날짜 유지
    if (searchParams.get("date")) {
      params.set("date", searchParams.get("date")!);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  if (tabs.length === 0) {
    return (
      <div className="text-text-default text-md font-medium text-center mx-auto my-0 p-50">
        아직 할 일 목록이 없습니다. <br /> 새로운 목록을 추가해주세요.
      </div>
    );
  }

  return (
    <div role="tablist" className="flex gap-12">
      {tabs.map((tab) => {
        const isActive = String(tab.id) === activeTabId;
        return (
          <TabItem
            key={tab.id}
            name={tab.name}
            isActive={isActive}
            ariaSelected={isActive}
            onClick={() => switchTab(String(tab.id))}
            tabIndex={isActive ? 0 : -1}
          />
        );
      })}
    </div>
  );
}
