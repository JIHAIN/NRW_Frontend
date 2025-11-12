// TableControls.tsx
import { type FC } from "react";
// 필요한 아이콘 및 UI 컴포넌트 임포트
import { ChevronRight, Search, Check, Download, Trash2 } from "lucide-react";
import * as React from "react";

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

// -------------------------------------------------------------
// TableControlsProps (체크박스/일괄관리 기능 포함)
// -------------------------------------------------------------
interface TableControlsProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  locationFilter: string;
  onLocationFilterChange: (location: string) => void;
  statusOptions: string[];
  locationOptions: string[];

  // 체크박스 기능 관련 Props 추가
  hasSelection: boolean;
  onBulkDownload: () => void;
  onBulkDelete: () => void;
}
// -------------------------------------------------------------

// -------------------------------------------------------------
// 재사용 가능한 필터 드롭다운 컴포넌트 (FilterDropdown)
// -------------------------------------------------------------
interface OptionItem {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  currentFilter: string;
  onFilterChange: (value: string) => void;
  options: string[];
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
  const [open, setOpen] = React.useState(false);
  const displayLabel = currentFilter || defaultLabel;

  // 옵션 데이터 포맷
  const formattedOptions: OptionItem[] = [
    { value: "", label: defaultLabel },
    ...options.map((o) => ({ value: o, label: o })),
  ];

  return (
    <div className={widthClass}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between opacity-70 border border-blue-100 rounded-2xl p-1.5 focus:outline-none cursor-pointer text-center text-[0.9rem] bg-white
            "
          >
            {displayLabel}
            <ChevronRight
              className={`
              ml-auto transition-transform duration-200 
              ${open ? "rotate-90" : ""} 
              w-4 h-4 text-gray-500
            `}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-0 border border-blue-100">
          <Command className="bg-white">
            <CommandList className="p-0">
              <CommandEmpty>옵션이 없습니다.</CommandEmpty>
              <CommandGroup>
                {formattedOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onFilterChange(currentValue);
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
// -------------------------------------------------------------

const TableControls: FC<TableControlsProps> = (props) => {
  return (
    <div className="flex justify-between items-center py-2 px-10 ">
      {/* 문서 이름 검색 및 일괄 관리 버튼 그룹 */}
      <div className="flex items-center gap-3">
        {/* 검색창 */}
        <div className="flex items-center border border-blue-100 rounded-2xl p-1 bg-white w-80">
          <Search size={20} className="text-blue-400 mx-2" />
          <input
            type="text"
            placeholder="문서 이름 검색..."
            value={props.searchText}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="w-full p-1 focus:outline-none"
          />
        </div>

        {/* 일괄 관리 버튼 (선택된 항목이 있을 때만 표시) */}
        {props.hasSelection && (
          <>
            <Button
              onClick={props.onBulkDownload}
              className="gap-1 border border-blue-100 rounded-2xl px-3 py-1 text-blue-900/70 point-hover bg-white hover:bg-gray-100 text-sm"
            >
              <Download size={16} className="text-blue-500" />
              일괄 다운로드
            </Button>
            <Button
              onClick={props.onBulkDelete}
              className="gap-1 border border-blue-100 rounded-2xl px-3 py-1 text-red-700/70 point-hover bg-white hover:bg-gray-100 text-sm"
            >
              <Trash2 size={16} className="text-red-500" />
              일괄 삭제
            </Button>
          </>
        )}
      </div>

      {/* 상태 필터 드롭다운 및 위치 필터 */}
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">상태:</label>

          <FilterDropdown
            currentFilter={props.statusFilter}
            onFilterChange={props.onStatusFilterChange}
            options={props.statusOptions}
            defaultLabel="전체 상태"
            widthClass="w-[10rem]"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">위치:</label>

          <FilterDropdown
            currentFilter={props.locationFilter}
            onFilterChange={props.onLocationFilterChange}
            options={props.locationOptions}
            defaultLabel="전체 위치"
            widthClass="w-[10rem]"
          />
        </div>
      </div>
    </div>
  );
};

export default TableControls;
