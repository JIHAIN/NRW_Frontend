import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as React from "react";

export function Dropdown({
  children,
  items,
  align = "start",
}: {
  children: React.ReactNode; // ← 필수
  items: { label: string; icon?: React.ReactNode }[];
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-blue-100 text-blue-700"
        >
          {children}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align={align}
        sideOffset={6}
        className="min-w-[180px] rounded-lg border border-blue-100  p-1 shadow-md"
      >
        {items.map((it, i) => (
          <DropdownMenu.Item
            key={i}
            className="group flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-blue-50"
          >
            {it.icon ? <span className="text-blue-700">{it.icon}</span> : null}
            <span>{it.label}</span>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
