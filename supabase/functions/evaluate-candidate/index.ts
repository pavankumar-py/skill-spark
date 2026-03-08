import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { candidateId, aptitudeData, codingData, assessmentInfo } = await req.json();

    // Build evaluation prompt
    const prompt = buildEvaluationPrompt(aptitudeData, codingData, assessmentInfo);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert technical interviewer and code evaluator. You must evaluate candidate responses with genuine, detailed scoring. Be fair but rigorous. Score based on actual correctness, code quality, and problem-solving approach.`
          },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_evaluation",
              description: "Return the candidate evaluation results",
              parameters: {
                type: "object",
                properties: {
                  aptitude_score: {
                    type: "number",
                    description: "Aptitude score from 0-100 based on correct answers percentage"
                  },
                  coding_score: {
                    type: "number",
                    description: "Coding score from 0-100 based on code quality, correctness, efficiency, and style"
                  },
                  total_score: {
                    type: "number",
                    description: "Weighted average: 40% aptitude + 60% coding if both present, otherwise 100% of whichever is present"
                  },
                  ai_summary: {
                    type: "string",
                    description: "A detailed 3-5 sentence evaluation summary covering strengths, weaknesses, code quality observations, and overall assessment"
                  },
                  coding_feedback: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_title: { type: "string" },
                        score: { type: "number", description: "Score 0-100 for this specific problem" },
                        feedback: { type: "string", description: "Specific feedback on correctness, approach, efficiency, edge cases" }
                      },
                      required: ["question_title", "score", "feedback"]
                    },
                    description: "Per-problem coding feedback"
                  }
                },
                required: ["aptitude_score", "coding_score", "total_score", "ai_summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_evaluation" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No evaluation returned from AI");

    let evaluation;
    try {
      evaluation = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Failed to parse AI evaluation");
    }

    // Clamp scores to 0-100
    evaluation.aptitude_score = Math.max(0, Math.min(100, Math.round(evaluation.aptitude_score)));
    evaluation.coding_score = Math.max(0, Math.min(100, Math.round(evaluation.coding_score)));
    evaluation.total_score = Math.max(0, Math.min(100, Math.round(evaluation.total_score)));

    return new Response(JSON.stringify({ evaluation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-candidate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildEvaluationPrompt(
  aptitudeData: { questions: { text: string; options: string[]; correctAnswer: number; candidateAnswer: number | null }[] },
  codingData: { questions: { title: string; description: string; testCases: { input: string; expectedOutput: string }[]; candidateCode: string | null; language: string }[] },
  assessmentInfo: { role: string; techStack: string[]; experienceLevel: string }
): string {
  let prompt = `Evaluate this candidate for the role of **${assessmentInfo.role}** (${assessmentInfo.experienceLevel || "mid-level"}) with tech stack: ${assessmentInfo.techStack?.join(", ") || "general"}.\n\n`;

  // Aptitude section
  if (aptitudeData.questions.length > 0) {
    prompt += `## APTITUDE QUESTIONS (${aptitudeData.questions.length} total)\n\n`;
    aptitudeData.questions.forEach((q, i) => {
      const candidateAnswerText = q.candidateAnswer !== null && q.candidateAnswer !== undefined
        ? q.options[q.candidateAnswer] || "No answer"
        : "No answer";
      const correctAnswerText = q.options[q.correctAnswer] || "Unknown";
      const isCorrect = q.candidateAnswer === q.correctAnswer;
      prompt += `Q${i + 1}: ${q.text}\n`;
      prompt += `  Options: ${q.options.map((o, j) => `[${j}] ${o}`).join(" | ")}\n`;
      prompt += `  Correct: [${q.correctAnswer}] ${correctAnswerText}\n`;
      prompt += `  Candidate: [${q.candidateAnswer ?? "none"}] ${candidateAnswerText} ${isCorrect ? "✓" : "✗"}\n\n`;
    });
  }

  // Coding section
  if (codingData.questions.length > 0) {
    prompt += `## CODING CHALLENGES (${codingData.questions.length} total)\n\n`;
    codingData.questions.forEach((q, i) => {
      prompt += `### Problem ${i + 1}: ${q.title}\n`;
      prompt += `Description: ${q.description}\n`;
      prompt += `Test Cases:\n`;
      q.testCases?.forEach((tc, j) => {
        prompt += `  Case ${j + 1}: Input: ${tc.input} → Expected: ${tc.expectedOutput}\n`;
      });
      prompt += `\nCandidate's Code (${q.language}):\n\`\`\`${q.language}\n${q.candidateCode || "// No code submitted"}\n\`\`\`\n\n`;
      prompt += `Evaluate this code for:\n1. Correctness (does it solve the problem?)\n2. Efficiency (time/space complexity)\n3. Code quality (readability, naming, structure)\n4. Edge case handling\n\n`;
    });
  }

  prompt += `\nProvide genuine scores. Aptitude score should reflect the actual percentage of correct answers. Coding score should reflect actual code quality and correctness. Do NOT inflate scores. Be honest and constructive.`;

  return prompt;
}
