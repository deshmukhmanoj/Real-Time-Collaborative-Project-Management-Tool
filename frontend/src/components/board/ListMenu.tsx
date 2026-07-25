import { useEffect, useRef, useState } from 'react';
import { FiMoreHorizontal, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface ListMenuProps {
  onRename: () => void;
  onDelete: () => void;
}

export function ListMenu({ onRename, onDelete }: ListMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="List options"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="shrink-0 rounded p-1 text-ink-faint transition-colors hover:bg-white hover:text-ink"
      >
        <FiMoreHorizontal size={15} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border border-line bg-white py-1 shadow-panel animate-scale-in"
        >
          <button
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onRename();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-paper"
          >
            <FiEdit2 size={14} /> Rename list
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-coral hover:bg-coral-light"
          >
            <FiTrash2 size={14} /> Delete list
          </button>
        </div>
      )}
    </div>
  );
}
