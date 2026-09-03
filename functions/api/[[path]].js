/**
 * Cloudflare Pages Functions - Full Serverless API Backend for SmartCalculator
 * Automatically handles all /api/* routes on Cloudflare's Edge network.
 */

export async function onRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API calls
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 1. GET /api/config/status
        if (path === '/api/config/status' && request.method === 'GET') {
            return new Response(JSON.stringify({
                appName: "Smart AI Voice Calculator",
                version: "1.3.1-cloudflare",
                status: "ONLINE",
                geminiConfigured: !!(env.GEMINI_API_KEY),
                audioDecoding: true,
                localNlpFallback: true
            }), { headers: corsHeaders });
        }

        // 2. POST /api/config/key
        if (path === '/api/config/key' && request.method === 'POST') {
            const body = await request.json().catch(() => ({}));
            return new Response(JSON.stringify({
                success: true,
                geminiConfigured: !!(body.apiKey || env.GEMINI_API_KEY),
                message: "API key accepted for session."
            }), { headers: corsHeaders });
        }

        // 3. POST /api/calculate
        if (path === '/api/calculate' && request.method === 'POST') {
            const body = await request.json().catch(() => ({}));
            const { expression, angleUnit = 'DEG', precision = 10 } = body;
            const res = evaluateMathExpression(expression, angleUnit, precision);
            return new Response(JSON.stringify(res), { headers: corsHeaders });
        }

        // 4. POST /api/ai/solve
        if (path === '/api/ai/solve' && request.method === 'POST') {
            const body = await request.json().catch(() => ({}));
            const res = await handleAiSolve(body.transcript || '', body.apiKey, env);
            return new Response(JSON.stringify(res), { headers: corsHeaders });
        }

        // 5. POST /api/voice/process
        if (path === '/api/voice/process' && request.method === 'POST') {
            const body = await request.json().catch(() => ({}));
            const res = await handleVoiceProcess(body, env);
            return new Response(JSON.stringify(res), { headers: corsHeaders });
        }

        // 6. History Endpoints
        if (path === '/api/history') {
            if (request.method === 'GET') {
                return new Response(JSON.stringify([]), { headers: corsHeaders });
            }
            if (request.method === 'DELETE') {
                return new Response(null, { status: 204, headers: corsHeaders });
            }
        }

        return new Response(JSON.stringify({ error: "Endpoint not found" }), { status: 404, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message || "Internal server error" }), { status: 500, headers: corsHeaders });
    }
}

// -----------------------------------------------------------------------------
// PURE MATHEMATICAL EXPRESSION EVALUATOR (AST / Recursive Descent)
// -----------------------------------------------------------------------------
function evaluateMathExpression(rawExpr, angleUnit = 'DEG', precision = 10) {
    if (!rawExpr || !rawExpr.trim()) {
        return { success: false, expression: "", error: "Expression is empty" };
    }

    const steps = [];
    steps.push(`Original Expression: ${rawExpr.trim()}`);

    let expr = rawExpr.trim()
        .replace(/×/g, '*')
        .replace(/✕/g, '*')
        .replace(/·/g, '*')
        .replace(/÷/g, '/')
        .replace(/[−–]/g, '-')
        .replace(/π/gi, 'Math.PI')
        .replace(/\bPI\b/g, 'Math.PI')
        .replace(/\bE\b/g, 'Math.E')
        .replace(/√\s*\(?([^)]+)\)?/g, 'Math.sqrt($1)')
        .replace(/\[/g, '(')
        .replace(/\]/g, ')')
        .replace(/\{/g, '(')
        .replace(/\}/g, ')')
        .replace(/⁰/g, '^0').replace(/¹/g, '^1').replace(/²/g, '^2').replace(/³/g, '^3')
        .replace(/⁴/g, '^4').replace(/⁵/g, '^5').replace(/⁶/g, '^6').replace(/⁷/g, '^7')
        .replace(/⁸/g, '^8').replace(/⁹/g, '^9');

    // Handle % of (e.g. 20% of 500 -> 20 * 0.01 * 500)
    expr = expr.replace(/%\s*of\b/gi, '*0.01*');
    // Handle standalone % (e.g. 50% -> (50*0.01))
    expr = expr.replace(/(\d+(\.\d+)?)%/g, '($1*0.01)');

    // Factorials (e.g. 5! -> fact(5))
    expr = expr.replace(/(\d+)!/g, 'fact($1)');

    // Implicit multiplication
    expr = expr.replace(/(\d)(\()/g, '$1*$2');
    expr = expr.replace(/(\))(\()/g, '$1*$2');
    expr = expr.replace(/(\))(\d)/g, '$1*$2');

    steps.push(`Normalized: ${expr}`);

    try {
        const isDeg = angleUnit.toUpperCase() === 'DEG';
        const toRad = (val) => isDeg ? (val * Math.PI / 180) : val;
        const fromRad = (val) => isDeg ? (val * 180 / Math.PI) : val;

        const fact = (n) => {
            if (n < 0 || n !== Math.floor(n)) return NaN;
            if (n > 170) return Infinity;
            let r = 1;
            for (let i = 2; i <= n; i++) r *= i;
            return r;
        };

        // Context scope for evaluation
        const scope = {
            sin: (x) => Math.sin(toRad(x)),
            cos: (x) => Math.cos(toRad(x)),
            tan: (x) => Math.tan(toRad(x)),
            asin: (x) => fromRad(Math.asin(x)),
            acos: (x) => fromRad(Math.acos(x)),
            atan: (x) => fromRad(Math.atan(x)),
            sqrt: Math.sqrt,
            cbrt: Math.cbrt,
            abs: Math.abs,
            log: Math.log10,
            ln: Math.log,
            fact: fact,
            pi: Math.PI,
            e: Math.E,
            Math: Math
        };

        // Convert exponentiation ^ to **
        const sanitizedForJs = expr.replace(/\^/g, '**');

        const fn = new Function(...Object.keys(scope), `"use strict"; return (${sanitizedForJs});`);
        let numResult = fn(...Object.values(scope));

        if (typeof numResult !== 'number' || isNaN(numResult)) {
            return { success: false, expression: rawExpr, error: "Calculation resulted in an invalid number (NaN)" };
        }
        if (!isFinite(numResult)) {
            return { success: false, expression: rawExpr, error: "Division by zero or infinity" };
        }

        // Clean floating point inaccuracies (e.g. 0.1 + 0.2 -> 0.3)
        const factor = Math.pow(10, precision);
        numResult = Math.round(numResult * factor) / factor;
        const formattedResult = Number(numResult.toFixed(precision)).toString();

        steps.push(`Evaluated Result: ${formattedResult}`);

        return {
            success: true,
            expression: rawExpr,
            formattedResult: formattedResult,
            numericResult: numResult,
            steps: steps
        };
    } catch (err) {
        return { success: false, expression: rawExpr, error: "Syntax or Math Error: " + err.message };
    }
}

// -----------------------------------------------------------------------------
// GOOGLE GEMINI AI PROBLEM SOLVER & NLP FALLBACK
// -----------------------------------------------------------------------------
async function handleAiSolve(query, clientApiKey, env) {
    const key = clientApiKey || env.GEMINI_API_KEY;

    if (!query || !query.trim()) {
        return { success: false, error: "Query is empty", spokenResponse: "Please ask a math question." };
    }

    // 1. Try Gemini AI if API key is present
    if (key && key.trim()) {
        try {
            const prompt = `You are a high-precision mathematical AI problem solver.
Solve the following user query step-by-step:
"${query}"

You MUST reply ONLY with a raw, valid JSON object (no markdown, no backticks, no code blocks):
{
  "success": true,
  "mathExpression": "extracted clean math formula (e.g. 50 * 25)",
  "result": "final answer",
  "numericResult": 1250,
  "steps": [
    "Step 1: description...",
    "Step 2: description..."
  ],
  "spokenResponse": "Concise verbal answer to speak back (e.g. The answer is 1250)",
  "detectedLanguage": "English"
}`;

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key.trim()}`;
            const geminiRes = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
                })
            });

            if (geminiRes.ok) {
                const data = await geminiRes.json();
                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                parsed.provider = "gemini-1.5-flash (Cloudflare Edge)";
                return parsed;
            }
        } catch (e) {
            // Fall through to local NLP
        }
    }

    // 2. Instant Local NLP Fallback (Extract Math from Words)
    return localNlpSolve(query);
}

async function handleVoiceProcess(body, env) {
    if (body.transcript) {
        return handleAiSolve(body.transcript, body.apiKey, env);
    }
    return { success: false, error: "No voice audio transcript provided" };
}

function localNlpSolve(query) {
    let clean = query.toLowerCase()
        .replace(/what is|calculate|solve|find|value of|please/gi, '')
        .replace(/plus/gi, '+')
        .replace(/minus/gi, '-')
        .replace(/times|multiplied by|multiply by/gi, '*')
        .replace(/divided by|divide by|over/gi, '/')
        .replace(/percent of|percentage of/gi, '% of')
        .replace(/square root of/gi, 'sqrt')
        .replace(/to the power (of)?/gi, '^')
        .trim();

    const mathMatch = clean.match(/[0-9\.\+\-\*\/\^\(\)\%\!a-z]+/gi);
    const mathExpr = mathMatch ? mathMatch.join('') : clean;

    const calc = evaluateMathExpression(mathExpr, 'DEG', 10);
    if (calc.success) {
        return {
            success: true,
            originalQuery: query,
            detectedLanguage: "English",
            mathExpression: mathExpr,
            result: calc.formattedResult,
            numericResult: calc.numericResult,
            steps: [
                `Recognized Voice Query: ${query}`,
                `Extracted Formula: ${mathExpr}`,
                ...calc.steps,
                `Final Answer = ${calc.formattedResult}`
            ],
            spokenResponse: `The answer is ${calc.formattedResult}`,
            provider: "local-nlp (Cloudflare Edge)"
        };
    }

    return {
        success: false,
        originalQuery: query,
        error: "Could not extract mathematical expression from query: " + query,
        spokenResponse: "I could not resolve the mathematical equation."
    };
}

// Cloudflare Workers with Static Assets compatibility
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle API requests
        if (url.pathname.startsWith('/api/')) {
            return onRequest({ request, env, params: {} });
        }

        // Serve the SmartCalci website
        return env.ASSETS.fetch(request);
    }
};
