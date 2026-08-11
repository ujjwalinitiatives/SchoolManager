"use client";

import { useTransition } from "react";
import { removeStaffMember } from "./actions";

interface RemoveStaffButtonProps {
  memberId: string;
  memberName: string;
}

export function RemoveStaffButton({ memberId, memberName }: RemoveStaffButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    const confirmed = window.confirm(`Are you sure you want to remove ${memberName}?`);
    if (!confirmed) return;

    startTransition(async () => {
      try {
        const res = await removeStaffMember(memberId);
        if (res && "error" in res && res.error) {
          alert(res.error);
        }
      } catch (err: any) {
        alert(err?.message || "Failed to remove staff member.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
    >
      {isPending ? "Removing..." : "Remove"}
    </button>
  );
}
