import { type FC, useState } from "react";
import { Search, Download, Trash2, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

//  상수 및 타입 임포트
import { CATEGORY_LABEL } from "@/constants/projectConstants";
import type { DocumentCategory } from "@/types/UserType";

// -------------------------------------------------------------
// Props 정의
// -------------------------------------------------------------
interface TableControlsProps {
  searchText: string;
  onSearchChange: (text: string) => void;

  // 권한 필터
  // authFilter: string;
  // authFilterChange: (status: string) => void;
  // authOptions: string[];

  // 상태 필터
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  statusOptions: string[];

  //  분류(Category) 필터
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  //  [수정] string[] -> DocumentCategory[] 로 구체화
  categoryOptions: DocumentCategory[];

  hasSelection: boolean;
  onBulkDownload: () => void;
  onBulkDelete?: () => void;
}

// -------------------------------------------------------------
// FilterDropdown
// -------------------------------------------------------------
interface OptionItem {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  currentFilter: string;
  onFilterChange: (value: string) => void;
  options: OptionItem[];
  defaultLabel: string;
  widthClass?: string;
}

const FilterDropdown: FC<FilterDropdownProps> = ({
  currentFilter,
  onFilterChange,
  options,
  defaultLabel,
  widthClass = "w-full",
}) => {
  const [open, setOpen] = useState(false);

  // 현재 선택된 필터의 라벨 찾기
  const currentLabel =
    options.find((o) => o.value === currentFilter)?.label || defaultLabel;

  return (
    <div className={widthClass}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between opacity-70 border border-blue-100 rounded-2xl p-1.5 focus:outline-none cursor-pointer text-center text-[0.9rem] bg-white"
          >
            {currentLabel}
            <ChevronRight
              className={`ml-auto transition-transform duration-200 ${
                open ? "rotate-90" : ""
              } w-4 h-4 text-gray-500`}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-0 border border-blue-100">
          <Command className="bg-white">
            <CommandList className="p-0">
              <CommandEmpty>옵션이 없습니다.</CommandEmpty>
              <CommandGroup>
                {/* 전체 옵션 */}
                <CommandItem
                  value=""
                  onSelect={() => {
                    onFilterChange("");
                    setOpen(false);
                  }}
                >
                  {defaultLabel}
                  <Check
                    className={cn(
                      "ml-auto",
                      currentFilter === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>

                {/* 개별 옵션들 */}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      // CommandItem은 value를 소문자로 리턴하는 경우가 있어, 원래 값을 찾아서 전달
                      const selected =
                        options.find(
                          (o) =>
                            o.value.toLowerCase() === currentValue.toLowerCase()
                        )?.value || currentValue;
                      onFilterChange(selected);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        currentFilter === option.value
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
};

const TableControls: FC<TableControlsProps> = (props) => {
  //  옵션 데이터를 {value, label} 형태로 변환
  const formattedStatusOptions = props.statusOptions.map((s) => ({
    value: s,
    label: s,
  }));

  //  카테고리는 한글 변환 적용
  // c가 DocumentCategory 타입이므로 CATEGORY_LABEL[c] 접근 시 any 불필요
  const formattedCategoryOptions = props.categoryOptions.map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c] || c,
  }));

  return (
    <div className="flex justify-between items-center py-2 px-10 ">
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-blue-100 rounded-2xl p-1 bg-white w-80">
          <Search size={20} className="text-blue-400 mx-2" />
          <input
            type="text"
            placeholder="문서 이름 검색..."
            value={props.searchText}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="w-full p-1 focus:outline-none text-sm text-gray-500"
          />
        </div>

        {props.hasSelection && (
          <>
            <Button
              onClick={props.onBulkDownload}
              className="gap-1 border border-blue-100 rounded-2xl px-3 py-1 text-blue-900/70 point-hover bg-white hover:bg-gray-100 text-sm"
            >
              <Download size={16} className="text-blue-500" />
              일괄 다운로드
            </Button>

            {props.onBulkDelete && (
              <Button
                onClick={props.onBulkDelete}
                className="gap-1 border border-blue-100 rounded-2xl px-3 py-1 text-red-700/70 point-hover bg-white hover:bg-gray-100 text-sm"
              >
                <Trash2 size={16} className="text-red-500" />
                일괄 삭제
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">권한:</label>
          <FilterDropdown
            currentFilter={props.statusFilter}
            onFilterChange={props.onStatusFilterChange}
            options={formattedStatusOptions}
            defaultLabel="전체 보기"
            widthClass="w-[7.5rem]"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">상태:</label>
          <FilterDropdown
            currentFilter={props.statusFilter}
            onFilterChange={props.onStatusFilterChange}
            options={formattedStatusOptions}
            defaultLabel="전체 상태"
            widthClass="w-[7.5rem]"
          />
        </div>

        <div className="flex items-center gap-4">
          {/*  위치 -> 분류 */}
          <label className="text-sm font-medium text-gray-700">분류:</label>
          <FilterDropdown
            currentFilter={props.categoryFilter}
            onFilterChange={props.onCategoryFilterChange}
            options={formattedCategoryOptions}
            defaultLabel="전체 분류"
            widthClass="w-[7.5rem]"
          />
        </div>
      </div>
    </div>
  );
};

export default TableControls;
