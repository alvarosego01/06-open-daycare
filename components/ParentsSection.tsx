"use client";

import { useState, useCallback, useMemo } from "react";
import { kids, type Parent } from "@/data/kids";
import LinkParentDialog, { generateInvitationCode } from "@/components/LinkParentDialog";

type ParentsSectionProps = {
  kidId: string;
  initialParents: Parent[];
};

export default function ParentsSection({
  kidId,
  initialParents,
}: ParentsSectionProps) {
  const [parents, setParents] = useState<Parent[]>(initialParents);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");

  const kidName = useMemo(
    () => kids.find((k) => k.id === kidId)?.name ?? "",
    [kidId]
  );

  const openDialog = () => {
    setInvitationCode(generateInvitationCode());
    setDialogOpen(true);
  };

  const handleParentAdded = useCallback((parent: Parent) => {
    setParents((prev) => [...prev, parent]);
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 px-[18px]">
      <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D] mb-3.5">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-3.5">
        {parents.map((parent) => (
          <div key={parent.id} className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full text-white font-heading font-semibold text-[16px] flex items-center justify-center flex-none"
              style={{ backgroundColor: parent.avatarBgColor }}
            >
              {parent.initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-[14.5px] text-text-primary">
                {parent.name}
              </div>
              <div className="text-[12.5px] text-[#A89A8B]">
                {parent.role} ·{" "}
                {parent.status === "active" ? "activa" : "invitación enviada"}
              </div>
            </div>
            <span
              className={`flex-none text-[10.5px] font-extrabold py-1 px-[9px] rounded-full ${
                parent.status === "active"
                  ? "bg-[#CFEBD8] text-[#3E9B6C]"
                  : "bg-[#F7E7A6] text-[#9A7B1E]"
              }`}
            >
              {parent.status === "active" ? "ACTIVA" : "PENDIENTE"}
            </span>
          </div>
        ))}
        <button
          type="button"
          onClick={openDialog}
          aria-label="Vincular otro padre"
          className="flex items-center gap-3 pt-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5503A]"
        >
          <span className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center text-[#B0A290] flex-none">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="font-extrabold text-[14.5px] text-[#C5503A]">
            Vincular otro padre
          </span>
        </button>
      </div>

      <LinkParentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        kidName={kidName}
        kidId={kidId}
        invitationCode={invitationCode}
        onParentAdded={handleParentAdded}
      />
    </div>
  );
}
