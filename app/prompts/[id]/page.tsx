import { PromptDetail } from "@/components/prompt-detail";

export const metadata = { title: "Prompt" };

export default async function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PromptDetail id={id} />;
}
