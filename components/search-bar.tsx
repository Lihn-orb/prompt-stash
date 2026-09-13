"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useWorkspace } from "@/components/workspace-provider";
import { Button, Hint } from "@/components/ui/button";

export function SearchBar() {
  const { query, setQuery, searchRef, prompts } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="search-field" role="search">
      <Search size={15} className="shrink-0 text-muted" strokeWidth={1.8} />
      <input
        ref={searchRef}
        aria-label="Search prompts"
        placeholder="Search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          if (pathname.startsWith("/prompts/")) {
            const prompt = prompts.find((item) => pathname.endsWith(item.id));
            router.push(
              prompt?.status === "inbox"
                ? "/inbox"
                : prompt?.status === "archived"
                  ? "/library?status=archived"
                  : "/library",
            );
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("");
            searchRef.current?.blur();
          }
        }}
        className="h-9 min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted focus-visible:outline-none max-sm:h-10 max-sm:text-base"
      />
      {query && (
        <Hint label="Clear search">
          <Button
            variant="ghost"
            size="icon"
            className="!-mr-1 !h-6 !w-6"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              searchRef.current?.focus();
            }}
          >
            <X size={13} />
          </Button>
        </Hint>
      )}
    </div>
  );
}
