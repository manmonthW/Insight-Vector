
import { GoogleGenAI, Type } from "@google/genai";
import { InsightResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getInsight = async (problem: string, context?: string): Promise<InsightResult> => {
  try {
    const contextPrompt = context 
      ? `\n这是在更宏大的主题“${context}”背景下的深度钻取。请针对这个子维度进行更精细的解构。` 
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个深谙“高维认知思维方法论”的专家（向量化 -> 压缩 -> 第一性原理 -> 隐喻）。
      请对以下用户的问题进行深度的认知解构： "${problem}"。${contextPrompt}
      
      具体要求：
      1. 提取 6-8 个关键“维度向量”（属性/关键词）。
      2. 为每个维度向量提供一段深刻的语义解释（description），说明该维度在问题中的具体表现。
      3. 洞察并归纳出其背后的“第一性原理”（底层逻辑）。
      4. 提供一个深刻的“降维隐喻”。
         - oldPattern: 描述旧的、错误的思维主体（例如：一个只看砖头的砌砖工）。不要包含“停止像”等字样。
         - newMetaphor: 描述新的、进化的思维主体（例如：一个挥舞魔法画笔的建筑师）。不要包含“开始像”等字样。

      所有输出内容必须使用简体中文。请以 JSON 格式返回。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vectors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  keyword: { type: Type.STRING },
                  weight: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                },
                required: ["id", "keyword", "weight", "description"]
              }
            },
            firstPrinciple: { type: Type.STRING },
            oldPattern: { type: Type.STRING },
            newMetaphor: { type: Type.STRING }
          },
          required: ["vectors", "firstPrinciple", "oldPattern", "newMetaphor"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 未返回内容");
    return JSON.parse(text) as InsightResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      vectors: [
        { id: "v1", keyword: "结构性过时", weight: 0.9, description: "旧有知识体系在底层逻辑发生质变时，表现出的系统性失效。" },
        { id: "v2", keyword: "逻辑原子化", weight: 0.8, description: "将复杂任务拆解为不可再分的逻辑单元，使其可被计算和替代。" },
        { id: "v3", keyword: "直觉溢价", weight: 0.95, description: "非线性、非逻辑的跨维度认知在纯逻辑模型面前的稀缺性价值。" },
        { id: "v4", keyword: "熵增焦虑", weight: 0.7, description: "信息过载与确定性丧失带来的心理与决策混乱。" }
      ],
      firstPrinciple: "认知的层级跃迁源于底层坐标系的重塑",
      oldPattern: "一个恐惧自动砌砖机的砌砖工，只看到双手技能的贬值",
      newMetaphor: "一个掌握了魔法画笔的建筑师，专注于重塑现实的构想"
    };
  }
};
