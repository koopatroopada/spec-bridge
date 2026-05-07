interface RubricRule {
  keywords: string[];
  rubric: string;
}

const RULES: RubricRule[] = [
  {
    keywords: ["准确", "事实", "无误", "符合", "一致", "匹配", "等于"],
    rubric: "输出内容在事实层面准确无误，与问题要求一致",
  },
  {
    keywords: ["简洁", "简短", "精炼", "不啰嗦", "概括", "精简", "简明"],
    rubric: "输出简洁明了，没有冗余信息，直接回应核心问题",
  },
  {
    keywords: ["格式", "结构", "JSON", "模板", "排版", "规范"],
    rubric: "输出严格遵循要求的格式、结构或排版规范",
  },
  {
    keywords: ["完整", "全面", "覆盖", "遗漏", "要点", "关键", "详尽"],
    rubric: "输出覆盖了所有必要要点，没有遗漏关键信息",
  },
  {
    keywords: ["礼貌", "专业", "语气", "得体", "友善", "尊重"],
    rubric: "输出语气礼貌、专业、得体",
  },
  {
    keywords: ["上下文", "依据", "基于", "引用", "给定"],
    rubric: "输出基于提供的上下文或依据，没有编造信息",
  },
];

export function convertToLlmRubric(description: string): string {
  const lower = description.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return rule.rubric;
    }
  }
  return `请判断模型输出是否满足以下标准：${description}`;
}
