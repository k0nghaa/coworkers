import clsx from "clsx";
import { ModalFooterProps } from "./types";
import Button from "../Button/Button";

const ModalFooter = ({ primaryButton, secondaryButton }: ModalFooterProps) => {
  if (!primaryButton && !secondaryButton) return null;

  const hasTwoButtons = primaryButton && secondaryButton;
  const isDanger = primaryButton?.variant === "danger";

  return (
    <div
      className={clsx(
        "flex sm:justify-start justify-center",
        hasTwoButtons && "gap-8"
      )}
    >
      {/* Secondary 버튼 (왼쪽) */}
      {secondaryButton && (
        <Button
          label={secondaryButton.label}
          variant={isDanger ? "outlinedSecondary" : "outlined"}
          size="large"
          width="136px"
          full
          disabled={secondaryButton.disabled}
          onClick={(e) => {
            e.stopPropagation();
            secondaryButton.onClick();
          }}
        />
      )}

      {/* Primary 버튼 (오른쪽 또는 중앙) */}
      {primaryButton && (
        <Button
          label={primaryButton.label}
          variant={isDanger ? "danger" : "solid"}
          size="large"
          width={hasTwoButtons ? "136px" : "280px"}
          full
          disabled={primaryButton.disabled || primaryButton.loading}
          loading={primaryButton.loading}
          onClick={primaryButton.onClick}
        />
      )}
    </div>
  );
};

export default ModalFooter;
