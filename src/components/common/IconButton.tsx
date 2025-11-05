import * as Tooltip from "@radix-ui/react-tooltip";

export function IconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-blue-100 text-blue-700"
          >
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content
          sideOffset={6}
          className="rounded-md border border-blue-100 bg-white px-2 py-1 text-xs shadow-sm"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
