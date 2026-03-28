"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { BaseModalProps } from "./types";
import SVGIcon from "../SVGIcon/SVGIcon";
import { useFocusTrap } from "../../../hooks/Team/useFocusTrap";

const BaseModal = ({
  isOpen,
  onClose,
  children,
  showCloseButton = true,
  className = "",
}: BaseModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 포커스 트랩 (ESC 키, Tab 순환)
  useFocusTrap({
    isActive: isOpen,
    containerRef: modalRef,
    onEscape: onClose,
  });

  // 스크롤 잠금
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (!isOpen) {
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex sm:items-center items-end justify-center sm:p-16 p-0">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 카드 */}
      <div
        ref={modalRef}
        className={clsx(
          "relative w-full sm:w-374 lg:w-sm sm:mx-16 mx-0 bg-background-secondary rounded-t-xl sm:rounded-xl shadow-xl",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* X 닫기 버튼 */}
        {showCloseButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-16 top-16 text-text-default cursor-pointer"
            aria-label="닫기"
            data-modal-close
            tabIndex={-1}
          >
            <SVGIcon icon="x" size={24} />
          </button>
        )}

        {children}
      </div>
    </div>
  );

  // Portal로 body에 렌더링
  return createPortal(modalContent, document.body);
};

export default BaseModal;
