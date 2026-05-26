"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useHeaderStore } from "@/store/headerStore";
import { logoutAction, postSignin } from "@/lib/api/auth";
import clsx from "clsx";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Dropdown from "../Dropdown/Dropdown";
import SVGIcon from "../SVGIcon/SVGIcon";
import SideHeaderMobile from "./SideHeader/SideHeaderMobile";
import SideHeaderDesktop from "./SideHeader/SideHeaderDesktop";
import { showErrorToast, showSuccessToast } from "@/utils/error";
import Button from "../Button/Button";
import { SignInRequestBody } from "@/lib/types/auth";
import { useApiMutation } from "@/hooks/useApiMutation";

// 유저 프로필을 누르면 나오는 드롭다운 리스트입니다.
const ACCOUNTLIST = [
  "마이 히스토리",
  "계정 설정",
  "팀 목록",
  "팀 참여",
  "로그아웃",
];

const shouldFetchUrls = [
  "/teamlist",
  "/mypage",
  "/addteam",
  /^\/\d+$/,
  /^\/\d+\/edit$/,
];

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const sideWrapperRef = useRef<HTMLDivElement>(null);

  const [isSideOpen, setIsSideOpen] = useState<boolean>(false);

  const isLogin = useHeaderStore((s) => s.isLogin);
  const teams = useHeaderStore((s) => s.teams);
  const activeTeam = useHeaderStore((s) => s.activeTeam);
  const isHydrated = useHeaderStore((s) => s.isHydrated);

  const fetchUser = useHeaderStore((s) => s.fetchUser);
  const clearUser = useHeaderStore((s) => s.clearUser);

  const checkShouldFetchRules = useCallback(() => {
    const shouldFetch = shouldFetchUrls.some((rule) =>
      typeof rule === "string" ? pathname.startsWith(rule) : rule.test(pathname)
    );

    if (!shouldFetch) return;

    fetchUser();
  }, [pathname, fetchUser]);

  // 토글 버튼 누를시 작동하는 함수입니다. 토클로 여닫음 가능합니다.
  const handleToggle = () => {
    setIsSideOpen((prev) => !prev);
  };

  const handleSideOpen = () => {
    setIsSideOpen(true);
  };

  const handleSideClose = () => {
    setIsSideOpen(false);
  };

  // 최초 마운트 시 유저 정보 fetch (백그라운드에서 최신 데이터 업데이트)
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Pathname이 달라질 때 마다 유저 정보를 다시 갖고올지 고민합니다.
  useEffect(() => {
    checkShouldFetchRules();
  }, [pathname, checkShouldFetchRules]);

  useEffect(() => {
    if (!isSideOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!sideWrapperRef.current) return;

      if (!sideWrapperRef.current.contains(e.target as Node)) {
        setIsSideOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isSideOpen]);

  // 헤더에 있는 팀 이름 클릭하면 작동하는 함수입니다.
  const activeTeamClick = () => {
    if (!activeTeam) return;
    router.push(`/${activeTeam?.teamId}`);
  };

  // 로그아웃 작동하는 함수입니다.
  const handleLogout = async () => {
    try {
      await logoutAction();

      // 메모리 저장된 데이터를 싹 비웁니다.
      useHeaderStore.persist.clearStorage();
      clearUser();
      setIsSideOpen(false);
      showSuccessToast("로그아웃에 성공했습니다.");
      router.push("/");
    } catch (error) {
      showErrorToast("로그아웃에 실패했습니다.");
    }
  };

  /** 게스트용 로그인 기능 */
  const { mutate: mutateLogin } = useApiMutation();
  const handleGuestLogin = async () => {
    const requestData: SignInRequestBody = {
      email: "guest@email.com",
      password: "guest123$",
    };

    await mutateLogin(async () => {
      const response = await postSignin(requestData);
      if (!response.success) {
        return;
      }
      await fetchUser();
      showSuccessToast("로그인에 성공했습니다.");
      router.replace("/3952/tasklist?tab=5427"); // 프론트엔드팀 할일 목록 페이지로 이동
      return response;
    });
  };

  // 우측 프로필을 누르면 작동하는 함수입니다.
  const handleProfileClick = (value: string) => {
    if (value === "마이 히스토리") {
      router.push("/myhistory");
    } else if (value === "계정 설정") {
      router.push("/mypage");
    } else if (value === "팀 목록") {
      router.push("/teamlist");
    } else if (value === "팀 참여") {
      router.push("/jointeam");
    } else {
      handleLogout();
    }
  };

  // Hydration 전에는 전체 헤더를 블록하고 로딩 UI 표시
  if (!isHydrated) {
    return (
      <div className={"bg-background-secondary"}>
        <div
          className={clsx(
            "flex justify-between items-center",
            "max-w-1200 w-full mx-auto py-14",
            "px-19"
          )}
        >
          <div className="flex items-center gap-16">
            <Link href="/" className="pointer-events-none">
              <SVGIcon icon="LogoLarge" width={158} height={36} />
            </Link>
          </div>
          <div className="w-32 h-32 rounded-full bg-background-tertiary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "fixed top-0 left-0 right-0 z-100",
        "bg-background-secondary"
      )}
    >
      <div
        className={clsx(
          "flex justify-between",
          "max-w-1200 w-full mx-auto py-14",
          "px-19"
        )}
      >
        <div className="cursor-pointer flex items-center gap-40">
          <div className="flex items-center gap-16">
            <div className={clsx("sm:hidden")} onClick={handleSideOpen}>
              <SVGIcon icon="gnbMenu" />
            </div>
            <Link href="/">
              <SVGIcon icon="LogoLarge" width={158} height={36} />
            </Link>
          </div>
          {isLogin && (
            <div className="relative">
              {teams.length > 0 ? (
                <div className="hidden sm:flex gap-10">
                  {/* 활성화 된 팀명, 드롭다운으로 클릭할때마다 바뀝니다. */}
                  <div
                    className={clsx(
                      "max-w-100 overflow-hidden text-ellipsis whitespace-nowrap"
                    )}
                    onClick={activeTeamClick}
                  >
                    {activeTeam?.teamName}
                  </div>
                  {/* 토글 버튼 */}
                  <div
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle();
                    }}
                  >
                    <SVGIcon icon="toggle" />
                  </div>
                  <div className="hidden sm:block">
                    <SideHeaderDesktop
                      isOpen={isSideOpen}
                      teams={teams}
                      wrapperRef={sideWrapperRef}
                      onClose={handleSideClose}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={clsx("hidden sm:block")}
                  onClick={() => router.push("/addteam")}
                >
                  팀 추가하기
                </div>
              )}
            </div>
          )}
          <div className={clsx("hidden sm:block")}>
            <Link href="/boards" className="hidden sm:block cursor-pointer">
              자유게시판
            </Link>
          </div>
        </div>
        {/* 팀명 옆 토글 버튼을 누르면 사이드바가 나옵니다 */}
        {isSideOpen && (
          <div className="sm:hidden">
            <SideHeaderMobile
              isOpen={isSideOpen}
              teams={teams}
              wrapperRef={sideWrapperRef}
              onClose={handleSideClose}
            />
          </div>
        )}
        {/* 로그인 상태면 아래 내용이 mount 됩니다. */}
        {isLogin ? (
          <div className="flex items-center">
            <div className={clsx("cursor-pointer flex items-center")}>
              <Dropdown
                options={ACCOUNTLIST}
                onSelect={handleProfileClick}
                size="md"
                trigger="avatar"
                icon="user"
                listPosition="top-47 right-[-15px]"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-16">
            <div
              className={clsx("flex items-center cursor-pointer")}
              onClick={() => router.push("/login")}
            >
              로그인
            </div>
            <Button
              label="게스트로 체험하기"
              width="200"
              variant="gradient"
              type="submit"
              onClick={handleGuestLogin}
            ></Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Header;
