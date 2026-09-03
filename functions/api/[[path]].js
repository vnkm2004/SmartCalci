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
// PURE MATHEMATICAL EXPRESSION EVALUATOR (100% CSP Safe - No new Function / eval)
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

    steps.push(`Normalized: ${expr}`);

    try {
        const isDeg = (angleUnit || 'DEG').toUpperCase() === 'DEG';
        const toRad = (val) => isDeg ? (val * Math.PI / 180) : val;
        const fromRad = (val) => isDeg ? (val * 180 / Math.PI) : val;

        const fact = (n) => {
            if (n < 0 || n !== Math.floor(n)) return NaN;
            if (n > 170) return Infinity;
            let r = 1;
            for (let i = 2; i <= n; i++) r *= i;
            return r;
        };

        // 1. Tokenizer
        const tokens = [];
        let i = 0;
        const len = expr.length;

        while (i < len) {
            const ch = expr[i];

            if (/\s/.test(ch)) {
                i++;
                continue;
            }

            // Numbers (including decimals and scientific notation e.g. 1.5e3)
            if (/\d|\./.test(ch)) {
                let numStr = '';
                while (i < len && (/[\d\.]/.test(expr[i]))) {
                    numStr += expr[i++];
                }
                if (i < len && (expr[i] === 'e' || expr[i] === 'E') && i + 1 < len && /[\d+\-]/.test(expr[i + 1])) {
                    numStr += expr[i++];
                    if (expr[i] === '+' || expr[i] === '-') numStr += expr[i++];
                    while (i < len && /\d/.test(expr[i])) numStr += expr[i++];
                }
                const val = parseFloat(numStr);
                if (isNaN(val)) throw new Error(`Invalid number: ${numStr}`);
                tokens.push({ type: 'num', value: val });
                continue;
            }

            // Word identifiers (constants or functions)
            if (/[a-zA-Z]/.test(ch)) {
                let name = '';
                while (i < len && /[a-zA-Z0-9_]/.test(expr[i])) {
                    name += expr[i++];
                }
                const lower = name.toLowerCase();
                if (lower === 'pi') {
                    tokens.push({ type: 'num', value: Math.PI });
                } else if (lower === 'e') {
                    tokens.push({ type: 'num', value: Math.E });
                } else if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'cbrt', 'abs', 'log', 'ln', 'fact'].includes(lower)) {
                    tokens.push({ type: 'func', value: lower });
                } else {
                    throw new Error(`Unknown function or symbol: ${name}`);
                }
                continue;
            }

            // Operators
            if ('+-*/%^()!'.includes(ch)) {
                tokens.push({ type: 'op', value: ch });
                i++;
                continue;
            }

            throw new Error(`Unexpected character: ${ch}`);
        }

        // 2. Insert implicit multiplication where applicable
        const processedTokens = [];
        for (let k = 0; k < tokens.length; k++) {
            const curr = tokens[k];
            processedTokens.push(curr);

            if (k + 1 < tokens.length) {
                const next = tokens[k + 1];
                const currIsEnd = (curr.type === 'num' || (curr.type === 'op' && (curr.value === ')' || curr.value === '!')));
                const nextIsStart = (next.type === 'num' || next.type === 'func' || (next.type === 'op' && next.value === '('));

                if (currIsEnd && nextIsStart) {
                    processedTokens.push({ type: 'op', value: '*' });
                }
            }
        }

        // 3. Recursive Descent Parser
        let pos = 0;

        function peek() {
            return processedTokens[pos];
        }

        function consume(expectedValue) {
            const token = processedTokens[pos];
            if (!token || (expectedValue !== undefined && token.value !== expectedValue)) {
                throw new Error(`Expected '${expectedValue}' at position ${pos}`);
            }
            pos++;
            return token;
        }

        function parseExpression() {
            let left = parseTerm();

            while (pos < processedTokens.length) {
                const tok = peek();
                if (tok && tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
                    consume();
                    const right = parseTerm();
                    if (tok.value === '+') left = left + right;
                    else left = left - right;
                } else {
                    break;
                }
            }

            return left;
        }

        function parseTerm() {
            let left = parsePower();

            while (pos < processedTokens.length) {
                const tok = peek();
                if (tok && tok.type === 'op' && (tok.value === '*' || tok.value === '/' || tok.value === '%')) {
                    consume();
                    const right = parsePower();
                    if (tok.value === '*') left = left * right;
                    else if (tok.value === '/') {
                        if (right === 0) throw new Error("Division by zero");
                        left = left / right;
                    } else if (tok.value === '%') {
                        left = left % right;
                    }
                } else {
                    break;
                }
            }

            return left;
        }

        function parsePower() {
            let left = parseUnary();

            if (pos < processedTokens.length) {
                const tok = peek();
                if (tok && tok.type === 'op' && tok.value === '^') {
                    consume();
                    const right = parsePower();
                    left = Math.pow(left, right);
                }
            }

            return left;
        }

        function parseUnary() {
            const tok = peek();
            if (tok && tok.type === 'op') {
                if (tok.value === '+') {
                    consume();
                    return parseUnary();
                }
                if (tok.value === '-') {
                    consume();
                    return -parseUnary();
                }
            }
            return parsePostfix();
        }

        function parsePostfix() {
            let val = parsePrimary();

            while (pos < processedTokens.length) {
                const tok = peek();
                if (tok && tok.type === 'op' && tok.value === '!') {
                    consume();
                    val = fact(val);
                } else {
                    break;
                }
            }

            return val;
        }

        function parsePrimary() {
            const tok = peek();
            if (!tok) throw new Error("Unexpected end of expression");

            if (tok.type === 'num') {
                consume();
                return tok.value;
            }

            if (tok.type === 'func') {
                const fnName = consume().value;
                consume('(');
                const arg = parseExpression();
                consume(')');

                switch (fnName) {
                    case 'sin': return Math.sin(toRad(arg));
                    case 'cos': return Math.cos(toRad(arg));
                    case 'tan': return Math.tan(toRad(arg));
                    case 'asin': return fromRad(Math.asin(arg));
                    case 'acos': return fromRad(Math.acos(arg));
                    case 'atan': return fromRad(Math.atan(arg));
                    case 'sqrt':
                        if (arg < 0) throw new Error("Square root of negative number");
                        return Math.sqrt(arg);
                    case 'cbrt': return Math.cbrt(arg);
                    case 'abs': return Math.abs(arg);
                    case 'log':
                        if (arg <= 0) throw new Error("Log of non-positive number");
                        return Math.log10(arg);
                    case 'ln':
                        if (arg <= 0) throw new Error("Ln of non-positive number");
                        return Math.log(arg);
                    case 'fact': return fact(arg);
                    default: throw new Error(`Unknown function ${fnName}`);
                }
            }

            if (tok.type === 'op' && tok.value === '(') {
                consume('(');
                const val = parseExpression();
                consume(')');
                return val;
            }

            throw new Error(`Unexpected token: ${tok.value}`);
        }

        const numResult = parseExpression();

        if (pos < processedTokens.length) {
            throw new Error(`Unexpected token after expression: ${processedTokens[pos].value}`);
        }

        if (typeof numResult !== 'number' || isNaN(numResult)) {
            return { success: false, expression: rawExpr, error: "Calculation resulted in an invalid number (NaN)" };
        }
        if (!isFinite(numResult)) {
            return { success: false, expression: rawExpr, error: "Division by zero or infinity" };
        }

        // Clean floating point inaccuracies (e.g. 0.1 + 0.2 -> 0.3)
        const factor = Math.pow(10, precision);
        const rounded = Math.round(numResult * factor) / factor;
        const formattedResult = Number(rounded.toFixed(precision)).toString();

        steps.push(`Evaluated Result: ${formattedResult}`);

        return {
            success: true,
            expression: rawExpr,
            formattedResult: formattedResult,
            numericResult: rounded,
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
    const key = (clientApiKey && clientApiKey.trim()) || (env && env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim()) || '';

    if (!query || !query.trim()) {
        return { success: false, error: "Query is empty", spokenResponse: "Please ask a math question." };
    }

    // 1. Try Gemini AI if API key is present
    if (key) {
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

            const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
            for (const model of models) {
                try {
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
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
                        parsed.provider = `${model} (Cloudflare Edge)`;
                        return parsed;
                    }
                } catch (err) {
                    // Try next model fallback
                }
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

    // Extract numbers, operators, and math functions
    const mathMatch = clean.match(/[0-9\.\+\-\*\/\^\(\)\%\!a-zA-Z]+/gi);
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
                `Recognized Query: ${query}`,
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
