import type { Prompt, PromptMetadata, PromptSource, PromptStatus } from "@/types/prompt";

type Sample = PromptMetadata & {
  content: string;
  source: PromptSource;
  status: PromptStatus;
};

const samples: Sample[] = [
  {
    title: "UX design review",
    description: "Review a flow for clarity, usability, and accessibility.",
    content:
      "Act as a senior product designer reviewing an existing UX solution.\n\nEvaluate the design across clarity, visual hierarchy, usability, accessibility, and edge cases. Start with what works, then identify the three highest-impact improvements.\n\nFor each issue, explain the user impact and suggest a specific change. Separate observed problems from assumptions. End with one question about the underlying product decision.",
    category: "Design",
    tags: ["ux", "review"],
    type: "prompt",
    source: "chatgpt",
    status: "inbox",
  },
  {
    title: "Interview synthesis",
    description: "Turn research notes into evidence-backed insights.",
    content:
      "Input: notes from user interviews.\n\nProcess:\n1. Group recurring observations into themes.\n2. Separate observed behavior from stated preferences.\n3. Support each insight with a direct quote.\n4. Flag contradictions and gaps in the evidence.\n5. Suggest three follow-up research questions.\n\nOutput: a concise synthesis with themes, evidence, and product implications. Do not invent findings.",
    category: "Research",
    tags: ["user-research", "synthesis"],
    type: "skill",
    source: "claude",
    status: "inbox",
  },
  {
    title: "Code review",
    description: "Find correctness issues, edge cases, and missing tests.",
    content:
      "Review the code below as a senior engineer.\n\nPrioritize correctness, edge cases, security, and unnecessary complexity. For each finding, include severity, the relevant line or function, and a minimal fix.\n\nDo not rewrite working code for style alone. Clearly separate confirmed bugs from questions that need more context.\n\nFinish with the missing test cases most likely to prevent a regression.",
    category: "Coding",
    tags: ["code-review", "engineering"],
    type: "prompt",
    source: "chatgpt",
    status: "inbox",
  },
  {
    title: "Editorial rewrite",
    description: "Make a draft clearer without changing its voice.",
    content:
      "Edit the following draft for clarity and natural language.\n\nKeep my voice and point of view. Replace jargon with everyday words, cut repetition, and vary sentence length. Prefer concrete examples to vague claims. Do not add facts I have not provided.\n\nReturn the edited draft first, followed by a short list of the most meaningful changes.",
    category: "Writing",
    tags: ["editing", "tone-of-voice"],
    type: "prompt",
    source: "manual",
    status: "inbox",
  },
  {
    title: "Product brief",
    description: "Define the problem, scope, and success criteria.",
    content:
      "Write a concise product brief for {{product_idea}}.\n\nAudience: {{target_audience}}\nProblem: {{problem}}\nConstraints: {{constraints}}\n\nInclude the problem statement, primary user journey, measurable success criteria, MVP scope, explicit non-goals, and open questions.\n\nBe specific about trade-offs. Mark missing information as an assumption rather than inventing an answer.",
    category: "Productivity",
    tags: ["product", "planning"],
    type: "template",
    source: "claude",
    status: "inbox",
  },
  {
    title: "Image art direction",
    description: "Set the subject, lighting, materials, and composition.",
    content:
      "Create an image of {{subject}} in {{setting}}.\n\nComposition: {{composition}}\nLighting: soft directional natural light, with realistic shadow falloff.\nMaterial detail: tactile, physically accurate textures.\nPalette: {{color_palette}}\nMood: {{mood}}\n\nAvoid text, watermarks, exaggerated saturation, and visual clutter. The subject should be clearly readable at small sizes.",
    category: "Image",
    tags: ["art-direction", "image-gen"],
    type: "template",
    source: "web",
    status: "inbox",
  },
  {
    title: "Meeting notes to actions",
    description: "Extract decisions, owners, and unresolved questions.",
    content:
      "Input: a meeting transcript or notes.\n\nProcess:\n1. Identify decisions that were explicitly agreed on.\n2. Extract action items, owners, and due dates.\n3. List unresolved questions separately.\n4. Do not assign ownership or deadlines that were not stated.\n\nOutput:\n- A three-sentence summary\n- Decisions\n- A table of tasks, owners, and due dates\n- Open questions",
    category: "Productivity",
    tags: ["meetings", "workflow"],
    type: "skill",
    source: "chatgpt",
    status: "inbox",
  },
  {
    title: "Interface microcopy",
    description: "Write clear labels, actions, and error messages.",
    content:
      "Write interface microcopy for {{screen_or_flow}}.\n\nContext: {{user_context}}\nUser goal: {{user_goal}}\nTone: calm, clear, and helpful.\n\nProvide three alternatives for each of: heading, supporting text, primary action, empty state, and error state. Keep buttons short and action-oriented. Avoid blame, jargon, and unnecessary enthusiasm.",
    category: "Design",
    tags: ["microcopy", "ux-writing"],
    type: "template",
    source: "claude",
    status: "inbox",
  },
  {
    title: "Accessibility audit",
    description: "Check keyboard access, semantics, and focus behavior.",
    content:
      "Evaluate this UI component for accessibility.\n\nCheck semantic HTML, keyboard operation, focus order and visibility, accessible names, contrast, reduced motion, and screen reader announcements.\n\nFor each failure, describe how it affects a user and give a concrete implementation fix. Include a short manual testing checklist.",
    category: "Design",
    tags: ["accessibility", "review"],
    type: "prompt",
    source: "manual",
    status: "tested",
  },
  {
    title: "Evidence-led debugging",
    description: "Move from a symptom to a verified root cause.",
    content:
      "Input: bug report, relevant code, and runtime logs.\n\nProcess:\n1. Summarize observed versus expected behavior.\n2. Rank three falsifiable hypotheses.\n3. Specify the smallest experiment for each.\n4. Use the results to narrow the cause.\n5. Propose a minimal fix and a regression check.\n\nOutput: evidence, root cause, patch proposal, and verification steps. Never claim a hypothesis is confirmed without evidence.",
    category: "Coding",
    tags: ["debugging", "engineering"],
    type: "skill",
    source: "claude",
    status: "library",
  },
  {
    title: "Weekly update",
    description: "Summarize progress, blockers, and priorities.",
    content:
      "Turn these notes into a weekly update for {{audience}}.\n\nNotes: {{notes}}\n\nUse three sections: shipped, learned, next. Mention blockers only if someone can help resolve them. Keep the total under 200 words. Preserve specific dates and metrics from the notes; do not invent any.",
    category: "Writing",
    tags: ["communication", "planning"],
    type: "template",
    source: "manual",
    status: "library",
  },
  {
    title: "Competitor research",
    description: "Compare alternatives using traceable sources.",
    content:
      "Research {{competitors}} for {{product_category}}.\n\nCompare target audience, core workflow, pricing, strengths, and gaps. Cite sources and the date accessed. Label uncertain or unavailable information explicitly.\n\nEnd with three opportunities grounded in the comparison, not speculative market claims.",
    category: "Research",
    tags: ["strategy", "user-research"],
    type: "template",
    source: "web",
    status: "tested",
  },
];

export function createMockPrompts(ownerId: string | null = null): Prompt[] {
  const now = Date.now();
  return samples.map((sample, index) => {
    const date = new Date(now - (index + 1) * 3_600_000 * (index < 3 ? 1 : 4)).toISOString();
    return {
      ...sample,
      tags: [...sample.tags],
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      user_id: ownerId,
      source_url: null,
      created_at: date,
      updated_at: date,
      manifest: null,
      package_path: null,
      entry_content: null,
    };
  });
}
