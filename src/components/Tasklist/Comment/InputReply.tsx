"use client";

import { useState } from "react";
import SVGIcon from "../../Common/SVGIcon/SVGIcon";

type InputReplyProps = {
  onCreate: (content: string) => void;
};

export default function InputReply({ onCreate }: InputReplyProps) {
  const [commentText, setCommentText] = useState("");
  const isActive = commentText.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate(commentText);
        setCommentText("");
      }}
      className="flex items-start border-y border-y-border-primary py-13"
    >
      <textarea
        placeholder="댓글을 달아주세요"
        value={commentText}
        onChange={(e) => {
          setCommentText(e.target.value);
        }}
        className="flex-1 resize-none field-sizing-content placeholder-text-default text-text-primary text-md font-regular outline-none focus:outline-none"
      ></textarea>
      <button type="submit" disabled={!isActive}>
        <SVGIcon icon={isActive ? "btnEnterActive" : "btnEnterDefault"} />
      </button>
    </form>
  );
}
