import { useEffect, useState, useRef } from "react";
import Input from "@/components/Common/Input/Input";
import Dropdown from "@/components/Common/Dropdown/Dropdown";
import InputBox from "@/components/Common/Input/InputBox";
import clsx from "clsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Button from "@/components/Common/Button/Button";
import { BaseModal } from "@/components/Common/Modal";
import ModalHeader from "@/components/Common/Modal/ModalHeader";
import ModalFooter from "@/components/Common/Modal/ModalFooter";
import { formatDate } from "@/utils/date";
import { frequencyToEnum } from "@/constants/frequency";
import { FrequencyType } from "@/types/schemas";
import { useForm } from "react-hook-form";
import { getFrequencyText } from "@/utils/frequency";
import { TaskForEdit } from "@/lib/types/task";
import { toast } from "react-toastify";

export interface CreateTaskForm {
  name: string;
  description?: string;
  startDate: Date;
  frequencyType: "DAILY" | "WEEKLY" | "MONTHLY" | "ONCE";
  weekDays?: number[];
  monthDay?: number;
}

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreateTaskForm) => void;
  taskToEdit?: TaskForEdit | null;
  isPending?: boolean;
}

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function TaskCreateModal({
  isOpen,
  onClose,
  onSubmit,
  taskToEdit,
  isPending = false,
}: TaskCreateModalProps) {
  const today = new Date();
  const isEditMode = !!taskToEdit;

  const {
    setValue,
    watch,
    handleSubmit,
    reset,
    register,
    formState: { errors, isValid },
  } = useForm<CreateTaskForm>({
    defaultValues: {
      name: "",
      description: "",
      startDate: today,
      frequencyType: "ONCE",
    },
    mode: "onChange",
  });

  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState<number | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // 모달이 닫힐 때 DatePicker 상태 초기화
  useEffect(() => {
    if (!isOpen) setShowDatePicker(false);
  }, [isOpen]);

  // 생성 모드로 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen && !taskToEdit) {
      reset({
        name: "",
        description: "",
        startDate: new Date(),
        frequencyType: "ONCE",
      });
      setWeekDays([]);
      setMonthDay(undefined);
    }
  }, [isOpen, taskToEdit, reset]);

  // 수정 모드일 때 데이터 채우기
  useEffect(() => {
    if (taskToEdit) {
      reset({
        name: taskToEdit.name,
        description: taskToEdit.description,
        startDate: new Date(taskToEdit.date),
      });
      setWeekDays(taskToEdit.weekDays ?? []);
      setMonthDay(taskToEdit.monthDay ?? new Date(taskToEdit.date).getDate());
    }
  }, [taskToEdit, reset]);

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch is required for real-time form value tracking
  const watchStartDate = watch("startDate");
  const watchFrequency = watch("frequencyType");

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    }

    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);

  const submitHandler = async (form: CreateTaskForm) => {
    try {
      if (isPending) return;

      // 유효성 검사
      if (
        form.frequencyType === "WEEKLY" &&
        (!weekDays || weekDays.length === 0)
      ) {
        toast.error("최소 하나의 요일을 선택해주세요");
        return;
      }

      if (form.frequencyType === "MONTHLY" && !monthDay) {
        toast.error("날짜를 선택해주세요");
        return;
      }

      // 시간을 9시로 고정
      const year = form.startDate.getFullYear();
      const month = form.startDate.getMonth();
      const date = form.startDate.getDate();

      const localDateTime = new Date(year, month, date, 9, 0, 0, 0);

      await onSubmit({
        ...form,
        startDate: localDateTime,
        weekDays,
        monthDay,
      });

      onClose();
      reset();
    } catch {
      toast.error("할일 생성/수정에 실패했습니다.");
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="px-16 py-32">
      <ModalHeader title={isEditMode ? "할 일 수정하기" : "할 일 만들기"} />
      <div className="text-center text-text-default text-md font-medium pt-16 pb-24">
        할 일은 실제로 행동 가능한 작업 중심으로 <br /> 작성해주시면 좋습니다.
      </div>

      <div className="h-400 overflow-y-auto custom-scrollbar">
        <form className="flex flex-col gap-24 mb-32 mr-12">
          <section className="w-full">
            <Input
              full
              label="할 일 제목"
              labelClassName="text-lg font-medium text-text-primary mb-16"
              placeholder="할 일 제목을 입력해주세요."
              variant="default"
              size="large"
              type="text"
              {...register("name", {
                required: "제목은 필수입니다.",
                minLength: {
                  value: 1,
                  message: "제목은 최소 1글자 이상 입력해주세요.",
                },
                maxLength: {
                  value: 100,
                  message: "제목은 최대 100자까지 입력 가능합니다.",
                },
              })}
            />
            {errors.name && (
              <p className="text-status-danger text-xs mt-4 ml-4">
                {errors.name.message}
              </p>
            )}
          </section>

          {!isEditMode && (
            <>
              <section>
                <h3 className="text-lg font-medium text-text-primary mb-16">
                  시작 날짜
                </h3>
                <div className="relative" ref={datePickerRef}>
                  <Input
                    full
                    label="시작 날짜"
                    labelClassName="sr-only"
                    placeholder={formatDate(today.toISOString())}
                    readOnly
                    value={formatDate(watchStartDate.toISOString())}
                    onClick={() => {
                      setShowDatePicker(!showDatePicker);
                    }}
                    className="cursor-pointer"
                  />

                  {showDatePicker && (
                    <div className="absolute sm:w-full top-full mt-8 z-50 border border-interaction-hover bg-background-secondary rounded-xl">
                      <div className="p-8 shadow-xl">
                        <DatePicker
                          selected={watchStartDate}
                          onChange={(date: Date | null) => {
                            if (!date) return;
                            setValue("startDate", date);
                            setShowDatePicker(false);
                          }}
                          inline
                          formatWeekDay={(day) => day.substring(0, 3)}
                          minDate={new Date()}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          <section
            className={clsx(isEditMode && "pointer-events-none opacity-50")}
          >
            <h3 className="text-lg font-medium text-text-primary mb-16">
              반복 설정
            </h3>
            <Dropdown
              options={Object.keys(frequencyToEnum)}
              onSelect={(label) => {
                const enumValue =
                  frequencyToEnum[label as keyof typeof frequencyToEnum];
                setValue("frequencyType", enumValue);

                // 선택에 따라 추가 필드 초기화
                if (enumValue === "WEEKLY") {
                  setWeekDays([]);
                } else if (enumValue === "MONTHLY") {
                  setMonthDay(watchStartDate.getDate());
                } else {
                  setWeekDays([]);
                  setMonthDay(undefined);
                }
              }}
              trigger="text"
              size="md"
              value={getFrequencyText(watchFrequency)}
              background="primary"
              listPosition="top-full mt-2"
            />

            {/* WEEKLY UI */}
            {watchFrequency === FrequencyType.WEEKLY && (
              <div className="flex mt-8 justify-between text-md font-medium">
                {WEEK_LABELS.map((label, idx) => (
                  <Button
                    key={idx}
                    label={label}
                    variant={weekDays.includes(idx) ? "solid" : "unselected"}
                    size="large"
                    width="44px"
                    onClick={() => {
                      setWeekDays(
                        weekDays.includes(idx)
                          ? weekDays.filter((d) => d !== idx)
                          : [...weekDays, idx]
                      );
                    }}
                  />
                ))}
              </div>
            )}

            {/* MONTHLY UI */}
            {watchFrequency === FrequencyType.MONTHLY && (
              <div className="mt-8 w-120">
                <Dropdown
                  options={Array.from({ length: 31 }, (_, i) => `${i + 1}일`)}
                  onSelect={(label) => {
                    const day = Number(label.replace("일", ""));
                    setMonthDay(day);
                  }}
                  trigger="text"
                  size="md"
                  value={monthDay ? `${monthDay}일` : "날짜 선택"}
                  background="primary"
                  listPosition="top-full mt-2"
                />
              </div>
            )}
          </section>

          <section>
            <InputBox
              full
              label="할 일 메모"
              labelClassName="text-lg font-medium text-text-primary mb-16"
              placeholder="메모를 입력해주세요."
              {...register("description", {
                maxLength: {
                  value: 1000,
                  message: "메모는 최대 1000자까지 입력 가능합니다.",
                },
              })}
            />
            {errors.description && (
              <p className="text-status-danger text-xs mt-4 ml-4">
                {errors.description.message}
              </p>
            )}
          </section>
        </form>
      </div>

      <ModalFooter
        primaryButton={{
          label: isEditMode ? "수정하기" : "만들기",
          onClick: handleSubmit(submitHandler),
          disabled: !isValid || isPending,
          loading: isPending,
        }}
      />
    </BaseModal>
  );
}
