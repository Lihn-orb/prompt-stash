import type { Category, PromptMetadata, PromptType } from "@/types/prompt";

const rules: {
  category: Category;
  keywords: RegExp;
  title: string;
  description: string;
  tags: string[];
}[] = [
  {
    category: "Image",
    keywords: /\b(image|photo|lighting|illustration|render)\b|图片|摄影|图像|光照/i,
    title: "Image direction",
    description: "Define the image, composition, and visual details.",
    tags: ["image", "art-direction"],
  },
  {
    category: "Coding",
    keywords: /\b(code|debug|typescript|javascript|function|sql|test)\b|代码|编程|调试|函数/i,
    title: "Code review",
    description: "Review the implementation and identify actionable improvements.",
    tags: ["coding", "engineering"],
  },
  {
    category: "Research",
    keywords: /\b(research|interview|findings|survey|competitor)\b|研究|访谈|调研|竞品/i,
    title: "Research synthesis",
    description: "Organize research into evidence, themes, and findings.",
    tags: ["research", "analysis"],
  },
  {
    category: "Design",
    keywords: /\b(design|ux|ui|interface|usability|accessibility)\b|设计|交互|界面|可用性/i,
    title: "Design review",
    description: "Evaluate the experience and surface practical design improvements.",
    tags: ["design", "review"],
  },
  {
    category: "Writing",
    keywords:
      /\b(write|writing|edit|draft|copywriting|rewrite|article)\b|写作|文章|文案|润色|改写/i,
    title: "Writing assistant",
    description: "Develop a clear draft while preserving the original intent.",
    tags: ["writing", "editing"],
  },
  {
    category: "Productivity",
    keywords: /\b(meeting|plan|task|productivity|workflow|brief)\b|会议|计划|任务|工作流/i,
    title: "Work planning",
    description: "Turn the input into a focused plan and next steps.",
    tags: ["planning", "workflow"],
  },
];

export function temporaryTitle(content: string): string {
  return Array.from(content.trim().replace(/\s+/g, " ")).slice(0, 30).join("");
}

export function mockOrganize(content: string): PromptMetadata {
  const rule = rules.find(({ keywords }) => keywords.test(content));
  const isWorkflow =
    /input[\s\S]*process[\s\S]*output|输入[\s\S]*过程[\s\S]*输出/i.test(content) ||
    (content.match(/^\s*\d+[.)]\s+/gm)?.length ?? 0) >= 3;
  const type: PromptType = isWorkflow
    ? "skill"
    : /\{\{[^}]+\}\}|\$\{[^}]+\}|\[[^\]\n]+\]/.test(content)
      ? "template"
      : "prompt";
  return {
    title: rule?.title ?? temporaryTitle(content),
    description:
      rule?.description ?? Array.from(content.trim().replace(/\s+/g, " ")).slice(0, 120).join(""),
    category: rule?.category ?? "Other",
    tags: rule ? [...rule.tags] : ["general"],
    type,
  };
}
