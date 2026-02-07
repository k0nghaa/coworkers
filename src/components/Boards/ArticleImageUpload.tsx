"use client";

import clsx from "clsx";
import Image from "next/image";
import SVGIcon from "../Common/SVGIcon/SVGIcon";
import { useRef, useEffect } from "react";
import { useSvgImage } from "@/hooks/useSvgImage";

interface ArticleImageProps {
  image?: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
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

// 이미지 용량 제한 10mb로 임시 설정하였습니다.
const MAXSIZE = 10 * 1024 * 1024;

// 게시글 이미지 입로드 할 수 있는 컴포넌트입니다.
function ArticleImageUpload({ image = null, onChange }: ArticleImageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { processedUrl, isLoading, error, isSvg } = useSvgImage(
    image ?? undefined
  );
  const shouldUseNextImage =
    !isSvg && processedUrl ? isAllowedNextImageUrl(processedUrl) : false;

  const handleImageClick = () => {
    if (!image) {
      inputRef.current?.click();
    }
  };

  // 이미지를 선택을 반영하는 함수입니다.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > MAXSIZE) {
      alert("이미지 크기는 10MB 이하여야합니다.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onChange(file, previewUrl);
  };

  // 선택한 이미지를 삭제하는 함수입니다.
  const deleteImage = () => {
    onChange(null, null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // 이전 이미지 URL을 해제하는 함수, 메모리 누수 방지
  useEffect(() => {
    return () => {
      if (image && image.startsWith("blob:")) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  return (
    <div
      onClick={handleImageClick}
      className={clsx(
        "w-160 h-160 sm:w-282 sm:h-282 bg-background-secondary",
        "border border-border-primary hover:border-brand-primary",
        "rounded-xl cursor-pointer relative",
        "overflow-hidden",
        "flex items-center justify-center"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {image ? (
        <>
          {isLoading ? (
            <div className="w-full h-full bg-slate-700 animate-pulse" />
          ) : error || !processedUrl ? (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
              <span className="text-xs">이미지 로드 실패</span>
            </div>
          ) : isSvg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={processedUrl}
              alt="preview image"
              className="w-full h-full object-cover"
            />
          ) : shouldUseNextImage ? (
            <Image
              src={processedUrl}
              alt="preview image"
              fill
              className="object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={processedUrl}
              alt="preview image"
              className="w-full h-full object-cover"
            />
          )}
          <div
            className={clsx(
              "flex flex-col gap-12 items-center",
              "absolute top-60 right-40 sm:top-110 sm:right-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              deleteImage();
            }}
          >
            <SVGIcon icon="x" size="md" />
            <div className="text-gray-400 text-base">이미지 삭제</div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-12 items-center">
          <SVGIcon icon="plus" size="md" />
          <div className="text-gray-400 text-base">이미지 등록</div>
        </div>
      )}
    </div>
  );
}

export default ArticleImageUpload;
