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
        className="text-[hsl(var(--foreground))] md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 border-t border-[hsl(var(--border))]/50 bg-[hsl(var(--background))]/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 p-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/#kapcsolat"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 box-glow font-[var(--font-display)] font-semibold tracking-wide"
            >
              Konzultacio
            </a>
          </div>
        </div>
      )}
    </>
  );
}
