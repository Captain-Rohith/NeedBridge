import { categoryStyles } from "@/lib/constants";
import { NeedCategory, NeedStatus } from "@/lib/types";
import { cn, formatCategory } from "@/lib/utils";

export function CategoryBadge({ category }: { category: NeedCategory }) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", categoryStyles[category])}>
      {formatCategory(category)}
    </span>
  );
}

export function StatusBadge({ status }: { status: NeedStatus }) {
  const style =
    status === "open"
      ? "bg-amber-100 text-amber-900"
      : status === "assigned"
        ? "bg-sky-100 text-sky-900"
        : "bg-emerald-100 text-emerald-900";

  return <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", style)}>{status}</span>;
}
