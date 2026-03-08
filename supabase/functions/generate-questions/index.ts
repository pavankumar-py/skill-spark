import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { role, techStack, experience, aptitudeCount, aptitudeDifficulty, codingCount, codingDifficulty, codingTopics } = await req.json();

    // Generate aptitude questions - 50% technical, 50% numerical ability
    const technicalCount = Math.ceil(aptitudeCount / 2);
    const numericalCount = aptitudeCount - technicalCount;
    const aptitudePrompt = `Generate exactly ${aptitudeCount} multiple-choice aptitude questions for a ${role} developer role.
Tech stack: ${techStack.join(", ") || "general programming"}.
Experience level: ${experience || "mid-level"}.
Difficulty: ${aptitudeDifficulty || "Medium"}.

IMPORTANT: Generate a MIX of two categories:
1. Exactly ${technicalCount} TECHNICAL MCQs — testing knowledge of ${techStack.join(", ") || "programming concepts"}, frameworks, language syntax, debugging, system design, etc.
2. Exactly ${numericalCount} NUMERICAL ABILITY questions — testing quantitative aptitude like number series, percentages, ratios, profit/loss, time & work, probability, data interpretation, and logical reasoning with numbers.

Alternate between technical and numerical questions. Do NOT generate only technical questions.`;

    const aptitudeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a technical assessment question generator. You generate high-quality multiple-choice and coding questions for developer hiring assessments." },
          { role: "user", content: aptitudePrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_aptitude_questions",
            description: "Return generated aptitude questions",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question_text: { type: "string", description: "The question text" },
                      options: { type: "array", items: { type: "string" }, description: "Exactly 4 answer options" },
                      correct_answer: { type: "integer", description: "Index (0-3) of the correct option" },
                    },
                    required: ["question_text", "options", "correct_answer"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_aptitude_questions" } },
      }),
    });

    if (!aptitudeResponse.ok) {
      const status = aptitudeResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aptitudeResponse.text();
      console.error("Aptitude AI error:", status, t);
      throw new Error("Failed to generate aptitude questions");
    }

    const aptitudeData = await aptitudeResponse.json();
    const aptitudeArgs = JSON.parse(aptitudeData.choices[0].message.tool_calls[0].function.arguments);

    // Generate coding questions
    const codingPrompt = `Generate exactly ${codingCount} coding challenge questions for a ${role} developer role.
Tech stack: ${techStack.join(", ") || "general programming"}.
Experience level: ${experience || "mid-level"}.
Difficulty: ${codingDifficulty || "Medium"}.
Topics: ${codingTopics.join(", ") || "algorithms, data structures"}.

Each question should be a well-defined coding problem with test cases and starter code in Python and JavaScript.`;

    const codingResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a technical assessment question generator. You generate high-quality coding challenges for developer hiring assessments." },
          { role: "user", content: codingPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_coding_questions",
            description: "Return generated coding questions",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      coding_title: { type: "string", description: "Short title for the problem" },
                      coding_description: { type: "string", description: "Full problem description with examples" },
                      coding_difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
                      coding_topic: { type: "string", description: "Primary topic (e.g. Arrays, Recursion)" },
                      test_cases: { type: "array", items: { type: "object", properties: { input: { type: "string" }, expectedOutput: { type: "string" } }, required: ["input", "expectedOutput"], additionalProperties: false } },
                      starter_code_python: { type: "string", description: "Python starter code" },
                      starter_code_javascript: { type: "string", description: "JavaScript starter code" },
                    },
                    required: ["coding_title", "coding_description", "coding_difficulty", "coding_topic", "test_cases", "starter_code_python", "starter_code_javascript"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_coding_questions" } },
      }),
    });

    if (!codingResponse.ok) {
      const status = codingResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await codingResponse.text();
      console.error("Coding AI error:", status, t);
      throw new Error("Failed to generate coding questions");
    }

    const codingData = await codingResponse.json();
    const codingArgs = JSON.parse(codingData.choices[0].message.tool_calls[0].function.arguments);

    return new Response(JSON.stringify({
      aptitude: aptitudeArgs.questions,
      coding: codingArgs.questions,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
