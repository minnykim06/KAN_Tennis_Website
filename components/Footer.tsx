import { INSTAGRAM_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-green-line/60 bg-green-tint/40">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 px-4 py-6 text-center text-xs text-muted sm:flex-row sm:justify-between">
        <p className="font-serif tracking-widest text-green">KAN TENNIS · SAN DIEGO</p>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-green">
          @kantennis_
        </a>
      </div>
    </footer>
  );
}
