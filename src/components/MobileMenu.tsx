import { useState } from "react";
import { Menu, X } from "lucide-react";

interface MobileMenuProps {
  links: Array<{ label: string; href: string }>;
}

export default function MobileMenu({ links }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="text-slate-600 hover:text-[hsl(var(--primary))] md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-20 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 p-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-[hsl(var(--primary))]"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/#kapcsolat"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium h-10 px-6 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 shadow-lg shadow-blue-200 transition-all"
            >
              Konzultacio
            </a>
          </div>
        </div>
      )}
    </>
  );
}
