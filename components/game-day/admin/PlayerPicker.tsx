"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { input } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";
import type { Player } from "@/lib/types";

const normalize = (s: string) => s.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * A text box that filters players as you type. The chosen player's id goes in
 * a hidden input named `name`, so the form submits it like a <select>.
 */
export function PlayerPicker({
  id,
  name,
  label,
  players,
  value,
  onChange,
  taken,
  busy,
  autoFocus,
}: {
  id: string;
  name: string;
  label: string;
  players: Player[];
  /** Selected player id, or "". */
  value: string;
  onChange: (playerId: string) => void;
  /** Ids picked in other slots: hidden from the list. */
  taken: string[];
  /** Ids already playing another match that day: marked with •. */
  busy: Set<string>;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const nameOf = (playerId: string) => players.find((p) => p.id === playerId)?.name ?? "";

  const [text, setText] = useState(() => nameOf(value));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const query = normalize(text);
  const available = players.filter((p) => p.id === value || !taken.includes(p.id));
  // Names starting with the text first, then names containing it.
  const matches = query
    ? [
        ...available.filter((p) => normalize(p.name).startsWith(query)),
        ...available.filter((p) => !normalize(p.name).startsWith(query) && normalize(p.name).includes(query)),
      ]
    : available;

  function choose(player: Player) {
    setText(player.name);
    setOpen(false);
    onChange(player.id);
    inputRef.current?.setCustomValidity("");
  }

  // Leaving the box: keep an exact match, otherwise go back to the last valid choice.
  function commit() {
    setOpen(false);
    const exact = available.find((p) => normalize(p.name) === query);
    if (exact) return choose(exact);
    inputRef.current?.setCustomValidity("");
    if (query) setText(nameOf(value));
    else onChange("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return; // Korean IME still composing a syllable
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (matches.length ? (i + step + matches.length) % matches.length : 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault(); // pick the name, don't submit the form
      if (matches[active]) choose(matches[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        required
        placeholder={t.mod.typeName}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setActive(0);
          setOpen(true);
          // Until a name is picked from the list, the form shouldn't submit.
          e.target.setCustomValidity(e.target.value ? t.mod.selectPlayer : "");
        }}
        onFocus={(e) => {
          e.target.select();
          setOpen(true);
        }}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className={`${input} ${value && busy.has(value) ? "pr-7" : ""}`}
      />
      {value && busy.has(value) && (
        <span aria-hidden className="pointer-events-none absolute bottom-2.5 right-3 text-warn">•</span>
      )}

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-green-line bg-surface py-1 shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">{t.mod.noPlayerMatch}</li>
          ) : (
            matches.map((p, i) => (
              <li
                key={p.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown + preventDefault so the input doesn't blur before the click lands
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(p);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                  i === active ? "bg-green-tint text-green" : "text-ink"
                }`}
              >
                <span className="truncate">{p.name}</span>
                {busy.has(p.id) && <span aria-hidden className="text-warn">•</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
