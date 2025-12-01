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

import { CATEGORY_LABEL, STATUS_LABEL } from "@/constants/projectConstants";
import type { DocumentCategory, DocumentStatus } from "@/types/UserType";

// -------------------------------------------------------------
// Props 정의
// -------------------------------------------------------------
export interface OptionItem {
  value: string;
  label: string;
}

interface TableControlsProps {
  searchText: string;
  onSearchChange: (text: string) => void;

  //  [수정] 권한 필터 삭제 -> 프로젝트 필터 추가
  projectFilter: string; // 프로젝트 ID (string)
  onProjectFilterChange: (projectId: string) => void;
  projectOptions: OptionItem[]; // { value: id, label: name }

  // 상태 필터
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  statusOptions: DocumentStatus[];

  // 분류(Category) 필터
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  categoryOptions: DocumentCategory[];

  hasSelection: boolean;
  onBulkDownload: () => void;
  onBulkDelete?: () => void;
}

// -------------------------------------------------------------
// FilterDropdown (재사용 컴포넌트)
// -------------------------------------------------------------
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
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between opacity-70 border border-blue-100 rounded-2xl p-1.5 px-3 focus:outline-none cursor-pointer text-center text-[0.8rem] bg-white h-9"
          >
            <span className="truncate">{currentLabel}</span>
            <ChevronRight
              className={`ml-2 transition-transform duration-200 ${
                open ? "rotate-90" : ""
              } w-4 h-4 text-gray-500 shrink-0`}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[200px] p-0 border border-blue-100"
          align="start"
        >
          <Command className="bg-white">
            <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
              <CommandEmpty>옵션이 없습니다.</CommandEmpty>
              <CommandGroup>
                {/* 전체 옵션 */}
                <CommandItem
                  value="all_reset_option" // 고유한 값 사용
                  onSelect={() => {
                    onFilterChange("");
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {defaultLabel}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentFilter === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>

                {/* 개별 옵션들 */}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} // 검색을 위해 label 사용 (Shadcn Command 특성)
                    onSelect={() => {
                      onFilterChange(option.value);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    {option.label}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
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
  // 옵션 데이터 변환
  const formattedStatusOptions = props.statusOptions.map((s) => ({
    value: s,
    label: STATUS_LABEL[s] || s,
  }));

  const formattedCategoryOptions = props.categoryOptions.map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c] || c,
  }));

  return (
    <div className="flex justify-between items-center py-2 px-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-blue-100 rounded-2xl p-1 bg-white w-72 shadow-sm">
          <Search size={18} className="text-blue-400 mx-2 " />
          <input
            type="text"
            placeholder="문서 이름 검색..."
            value={props.searchText}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="w-full p-1 focus:outline-none text-sm text-gray-500 bg-transparent "
          />
        </div>

        {props.hasSelection && (
          <>
            <Button
              onClick={props.onBulkDownload}
              className="gap-1 border border-blue-100 rounded-2xl px-3 py-1 text-blue-900/70 point-hover bg-white hover:bg-gray-100 text-xs h-8"
            >
              <Download size={14} className="text-blue-500" />
              다운로드
            </Button>

            {props.onBulkDelete && (
              <Button
                onClick={props.onBulkDelete}
                className="gap-1 border border-blue-100 rounded-2xl px-3 py-1 text-red-700/70 point-hover bg-white hover:bg-gray-100 text-xs h-8"
              >
                <Trash2 size={14} className="text-red-500" />
                삭제
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/*  권한 -> 프로젝트 필터로 변경 */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500">프로젝트:</label>
          <FilterDropdown
            currentFilter={props.projectFilter}
            onFilterChange={props.onProjectFilterChange}
            options={props.projectOptions} // 상위에서 전달받음
            defaultLabel="전체 프로젝트"
            widthClass="w-40"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500">상태:</label>
          <FilterDropdown
            currentFilter={props.statusFilter}
            onFilterChange={props.onStatusFilterChange}
            options={formattedStatusOptions}
            defaultLabel="전체 상태"
            widthClass="w-32"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500">분류:</label>
          <FilterDropdown
            currentFilter={props.categoryFilter}
            onFilterChange={props.onCategoryFilterChange}
            options={formattedCategoryOptions}
            defaultLabel="전체 분류"
            widthClass="w-32"
          />
        </div>
      </div>
    </div>
  );
};

export default TableControls;
