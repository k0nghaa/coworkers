"use client";

import clsx from "clsx";
import Image from "next/image";
import { useSvgImage } from "@/hooks/useSvgImage";
import Skeleton from "@/components/Common/Skeleton/Skeleton";

interface ArticleImageProps {
  image: string;
  size?: "small" | "large";
}

const S3_HOSTNAME = "sprint-fe-project.s3.ap-northeast-2.amazonaws.com";
const S3_PATH_PREFIX = "/Coworkers/";

function isAllowedNextImageUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  if (url.startsWith("blob:") || url.startsWith("data:")) return false;

  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === S3_HOSTNAME &&
      parsed.pathname.startsWith(S3_PATH_PREFIX)
    ) {
      return true;
    }

    if (typeof window !== "undefined") {
      return parsed.hostname === window.location.hostname;
    }
  } catch {
    return false;
  }

  return false;
}

function ArticleImage({ image, size = "small" }: ArticleImageProps) {
  const { processedUrl, isLoading, error, isSvg } = useSvgImage(image);

  const sizeClasses = size === "large" ? "w-300 h-300" : "w-64 h-64";
  const shouldUseNextImage =
    !isSvg && processedUrl ? isAllowedNextImageUrl(processedUrl) : false;

  // 로딩 중이거나 processedUrl이 없는 경우 스켈레톤 표시
  if (isLoading || !processedUrl) {
    return (
      <div
        className={clsx(
          sizeClasses,
          "relative",
          "border border-slate-600 rounded-lg",
          "overflow-hidden"
        )}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="pulse"
        />
      </div>
    );
  }

  // 에러가 발생한 경우에만 에러 메시지 표시
  if (error) {
    return (
      <div
        className={clsx(
          sizeClasses,
          "relative",
          "border border-slate-600 rounded-lg",
          "overflow-hidden",
          "bg-slate-800 flex items-center justify-center text-slate-500"
        )}
      >
        <span className="text-xs">이미지 로드 실패</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        sizeClasses,
        "relative",
        "border border-slate-600 rounded-lg",
        "overflow-hidden"
      )}
    >
      {isSvg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={processedUrl}
          alt="article"
          className="w-full h-full object-cover"
        />
      ) : shouldUseNextImage ? (
        <Image src={processedUrl} alt="article" fill className="object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={processedUrl}
          alt="article"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

export default ArticleImage;
