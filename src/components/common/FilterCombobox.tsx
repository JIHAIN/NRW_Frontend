import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// 제네릭 타입 정의
type ComboboxValue = string | number | null;

interface OptionItem<T extends ComboboxValue> {
  value: T;
  label: string;
}

interface FilterComboboxProps<T extends ComboboxValue> {
  options: OptionItem<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

export function FilterCombobox<T extends ComboboxValue>({
  options = [], // 기본값 방어
  selectedValue,
  onValueChange,
  placeholder,
  className,
  disabled = false,
}: FilterComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);

  // 현재 선택된 라벨 찾기 (null/undefined 안전 처리)
  const selectedLabel = React.useMemo(() => {
    const found = options.find((op) => op.value === selectedValue);
    return found ? found.label : placeholder;
  }, [options, selectedValue, placeholder]);

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between bg-white border-blue-100 hover:bg-blue-50 text-left font-normal",
              !selectedValue && selectedValue !== 0 && "text-muted-foreground", // 0은 유효한 값으로 처리
              className
            )}
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[200px] p-0 bg-white" align="start">
          <Command>
            <CommandList>
              <CommandGroup>
                {options.map((option, index) => {
                  // 1. Key 생성: value가 없거나 중복될 경우를 대비해 index를 붙여 유니크하게 만듦
                  const uniqueKey = `combo-item-${option.value}-${index}`;

                  // 2. Value 생성: 검색 라이브러리(cmdk)가 식별할 수 있도록 "라벨 + 값" 조합 사용
                  const cmdValue = `${option.label} ${option.value}`;

                  // 3. 선택 여부 확인
                  const isSelected = selectedValue === option.value;

                  return (
                    <CommandItem
                      key={uniqueKey}
                      value={cmdValue}
                      onSelect={() => {
                        onValueChange(option.value);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
