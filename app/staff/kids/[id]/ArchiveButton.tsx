'use client';

import { useRouter } from 'next/navigation';
import { archiveChild } from '../actions';

interface ArchiveButtonProps {
  childId: string;
  childName: string;
}

export default function ArchiveButton({ childId, childName }: ArchiveButtonProps) {
  const router = useRouter();

  const handleArchive = async () => {
    if (!confirm(`¿Estás seguro de archivar a ${childName}?`)) {
      return;
    }

    const result = await archiveChild(childId);
    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      router.push('/staff/kids');
    }
  };

  return (
    <button
      onClick={handleArchive}
      className="border-[1.5px] border-border bg-card text-[#6E6359] font-bold text-[14px] py-[9px] px-4 rounded-xl hover:border-[#F2A78E] hover:text-[#D9583C] transition-colors"
    >
      Archivar
    </button>
  );
}
