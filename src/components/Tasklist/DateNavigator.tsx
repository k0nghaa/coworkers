"use client";

import SVGIcon from "@/components/Common/SVGIcon/SVGIcon";
import {
  addDaysToKstParam,
  formatListHeaderDate,
  toKstDateParam,
} from "@/utils/date";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import DatePicker from "react-datepicker";

export default function DateNavigator({ baseDate }: { baseDate: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showPicker, setShowPicker] = useState(false);

  const currentDateParam = baseDate;

  const updateDate = (dateParam: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", dateParam);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handlePrev = () => updateDate(addDaysToKstParam(currentDateParam, -1));
  const handleNext = () => updateDate(addDaysToKstParam(currentDateParam, 1));
  const handleSelect = (date: Date | null) => {
    if (!date) return;
    updateDate(toKstDateParam(date));
    setShowPicker(false);
  };

  return (
    <div className="flex gap-12 items-center relative">
      <div className="text-lg font-medium whitespace-nowrap">
        {formatListHeaderDate(baseDate)}
      </div>
      <div className="flex gap-4">
        <button onClick={handlePrev}>
          <SVGIcon icon="btnArrowLeft" size="xxs" />
        </button>
        <button onClick={handleNext}>
          <SVGIcon icon="btnArrowRight" size="xxs" />{" "}
        </button>
      </div>
      <button onClick={() => setShowPicker(!showPicker)}>
        <SVGIcon icon="btnCalendar" size="md" />
      </button>

      {showPicker && (
        <div className="absolute top-full mt-8 z-50">
          <div className="bg-background-secondary rounded-xl p-16 border-interaction-hover">
            <DatePicker
              selected={new Date(`${currentDateParam}T00:00:00+09:00`)}
              onChange={handleSelect}
              inline
              formatWeekDay={(day) => day.substring(0, 3)}
              onClickOutside={() => setShowPicker(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
