import { describe, expect, it } from "vitest";
import { convertToLlmRubric } from "@/lib/llm-rubric-converter";

describe("convertToLlmRubric", () => {
  it("converts accuracy-related descriptions", () => {
    expect(convertToLlmRubric("输出必须准确")).toBe(
      "输出内容在事实层面准确无误，与问题要求一致"
    );
    expect(convertToLlmRubric("回答要符合事实")).toBe(
      "输出内容在事实层面准确无误，与问题要求一致"
    );
  });

  it("converts conciseness-related descriptions", () => {
    expect(convertToLlmRubric("输出要简洁")).toBe(
      "输出简洁明了，没有冗余信息，直接回应核心问题"
    );
    expect(convertToLlmRubric("不要太啰嗦，要精炼")).toBe(
      "输出简洁明了，没有冗余信息，直接回应核心问题"
    );
  });

  it("converts format-related descriptions", () => {
    expect(convertToLlmRubric("输出必须是 JSON 格式")).toBe(
      "输出严格遵循要求的格式、结构或排版规范"
    );
    expect(convertToLlmRubric("结构要正确")).toBe(
      "输出严格遵循要求的格式、结构或排版规范"
    );
  });

  it("converts completeness-related descriptions", () => {
    expect(convertToLlmRubric("要覆盖所有要点")).toBe(
      "输出覆盖了所有必要要点，没有遗漏关键信息"
    );
    expect(convertToLlmRubric("不能遗漏关键信息")).toBe(
      "输出覆盖了所有必要要点，没有遗漏关键信息"
    );
  });

  it("converts politeness-related descriptions", () => {
    expect(convertToLlmRubric("回复要礼貌且专业")).toBe(
      "输出语气礼貌、专业、得体"
    );
    expect(convertToLlmRubric("语气要得体")).toBe(
      "输出语气礼貌、专业、得体"
    );
  });

  it("converts context-related descriptions", () => {
    expect(convertToLlmRubric("必须基于提供的上下文")).toBe(
      "输出基于提供的上下文或依据，没有编造信息"
    );
  });

  it("falls back for unknown descriptions", () => {
    const description = "输出必须是 high / medium / low 之一";
    expect(convertToLlmRubric(description)).toBe(
      `请判断模型输出是否满足以下标准：${description}`
    );
  });
});
