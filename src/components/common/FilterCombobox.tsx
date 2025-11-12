// src/components/FilterCombobox.tsx

import { cn } from "@/lib/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Button } from "../ui/button";
import { Check, ChevronRight } from "lucide-react";

// --------------------------------------------------------------------------
// ✨ 제네릭 타입 정의
// T는 string, number, null 중 하나일 수 있어 ProjectManager의 number|null을 수용
// --------------------------------------------------------------------------
type ComboboxValue = string | number | null;

// 💡 OptionItem에 제네릭 T 적용
interface OptionItem<T extends ComboboxValue> {
  value: T;
  label: string;
}

// 💡 Props에도 제네릭 T 적용 및 className 추가
interface FilterComboboxProps<T extends ComboboxValue> {
  options: OptionItem<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  placeholder: string;
  className?: string;
}

// 💡 컴포넌트에도 제네릭 T 적용
export function FilterCombobox<T extends ComboboxValue>({
  options,
  selectedValue,
  onValueChange,
  placeholder,
  className, // 클래스 받기
}: FilterComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  // selectedValue가 null일 때도 처리 가능
  const displayLabel =
    options.find((option) => option.value === selectedValue)?.label ||
    placeholder;

  return (
    <div className={cn("w-full", className)}>
      {" "}
      {/* className 적용 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            role="combobox"
            aria-expanded={open}
            // 기존 Button 스타일을 통합하고 재사용 가능한 형태로 정리
            className="w-full justify-between border-blue-200 bg-white hover:bg-blue-50/50 text-gray-700 min-w-[130px] p-2 h-auto text-sm opacity-80 cursor-pointer"
          >
            {displayLabel}
            <ChevronRight
              className={cn(
                "transition-transform duration-200",
                open ? "rotate-90" : "", // 💡 open 상태에 따라 회전
                "ml-auto h-4 w-4 shrink-0 opacity-50"
              )}
            />
          </Button>
        </PopoverTrigger>
        {/* 💡 PopoverContent의 너비를 Trigger와 동일하게 설정 */}
        <PopoverContent
          className="w-full p-0 border border-blue-100"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command className="bg-white">
            <CommandList className="p-0">
              <CommandEmpty>옵션이 없습니다.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    // T 타입의 value를 string으로 변환하여 key와 CommandItem value로 사용
                    key={String(option.value)}
                    value={String(option.value)}
                    onSelect={(currentValueStr) => {
                      // 💡 옵션 배열에서 문자열 값을 기준으로 실제 T 타입의 option을 찾습니다.
                      const selectedOption = options.find(
                        (opt) => String(opt.value) === currentValueStr
                      );

                      if (selectedOption) {
                        // 선택된 값과 현재 값이 같으면 (필터 해제), 첫 번째 옵션 (전체) 값으로 리셋
                        // 첫 번째 옵션이 필터 리셋 옵션이라고 가정합니다.
                        const resetValue = options[0].value;

                        // onSelect 로직: 값이 같으면 첫 번째 옵션으로 리셋하거나, 새로운 값 선택
                        const newValue =
                          selectedOption.value === selectedValue
                            ? (resetValue as T) // 선택 해제 시 첫 번째 옵션 (전체) 값으로 리셋
                            : selectedOption.value;

                        onValueChange(newValue);
                      }
                      setOpen(false);
                    }}
                  >
                    {option.label}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedValue === option.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
