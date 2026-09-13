import { PromptCard } from "@/components/prompt-card";
import type { Prompt } from "@/types/prompt";

export function PromptList({ prompts }: { prompts: Prompt[] }) {
  return (
    <div className="prompt-grid" aria-label="Prompts">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}

export function CollectionSkeleton() {
  return (
    <div className="prompt-grid" role="status" aria-label="Loading prompts">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="prompt-card h-[240px] p-5">
          <div className="h-3 w-16 animate-pulse rounded bg-surface-raised" />
          <div className="mt-5 h-5 w-3/4 animate-pulse rounded bg-surface-raised" />
          <div className="mt-4 h-3 w-full animate-pulse rounded bg-surface-raised" />
          <div className="mt-2.5 h-3 w-2/3 animate-pulse rounded bg-surface-raised" />
        </div>
      ))}
    </div>
  );
}
