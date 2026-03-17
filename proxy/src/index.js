const ALLOWED_ORIGIN = 'https://cmankotech.github.io';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Public read endpoint for usage stats
    if (request.method === 'GET' && url.pathname === '/stats') {
      return handleStats(env);
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    if (url.pathname === '/orchestrate') {
      return handleOrchestrator(body, env, ctx);
    }

    if (url.pathname === '/orchestrate-stream') {
      return handleOrchestratorStream(body, env, ctx);
    }

    return proxyGroq(body, env, ctx);
  },
};

async function handleStats(env) {
  if (!env.USAGE_COUNTER) {
    return new Response(JSON.stringify({ total: 0 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  const val = await env.USAGE_COUNTER.get('total');
  return new Response(JSON.stringify({ total: parseInt(val || '0', 10) }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function incrementCounter(env) {
  if (!env.USAGE_COUNTER) return;
  try {
    const current = parseInt((await env.USAGE_COUNTER.get('total')) || '0', 10);
    await env.USAGE_COUNTER.put('total', String(current + 1));
  } catch {
    // non-blocking — never fail a request over a counter
  }
}

async function handleOrchestrator(body, env, ctx) {
  if (env.LANGGRAPH_ORCHESTRATOR_URL) {
    try {
      const langGraphRes = await forwardToLangGraph(body, env);
      if (langGraphRes && langGraphRes.ok) {
        ctx?.waitUntil?.(incrementCounter(env));
        return langGraphRes;
      }
    } catch {
      // fallback to worker-native orchestration
    }
  }

  const lang = body.lang === 'en' ? 'en' : 'fr';
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const userMessage = typeof body.message === 'string' ? body.message : '';

  if (!userMessage.trim()) {
    return jsonResponse({ reply: lang === 'en' ? 'Please share your request.' : 'Partage-moi ton besoin.' }, 400);
  }

  const plannerPrompt = lang === 'en'
    ? 'You are KRL1, portfolio assistant for Carlin Mankoto (AI Product Manager). Analyse the user intent and return strict JSON only. ' +
      'Intent values: "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory questions), "portfolio" (Carlin profile/experience/certifications), "tech" (stack/architecture/KRL1 technical questions), "contact", "other". ' +
      'Keys: intent, confidence (0-1), user_goal, steps (array of {tool, objective, output} — only for pm_workflow, else []), risks (array), quick_win.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto (AI PM). Analyse l\'intention et retourne uniquement du JSON strict. ' +
      'Valeurs d\'intent : "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory), "portfolio" (profil/expérience/certifs de Carlin), "tech" (stack/architecture/questions techniques sur KRL1), "contact", "other". ' +
      'Clés : intent, confidence (0-1), user_goal, steps (tableau {tool, objective, output} — seulement pour pm_workflow, sinon []), risks (tableau), quick_win.';

  const synthesisPrompt = lang === 'en'
    ? 'You are KRL1, Carlin Mankoto\'s portfolio assistant. ' +
      'For intent "pm_workflow": transform the PM plan into an actionable answer with links to PM tools. ' +
      'For other intents (portfolio/tech/contact/other): answer the question directly based on user_goal — do NOT mention PM tools unless genuinely relevant. ' +
      'Max 220 words. When citing a tool, use HTML link: <a href="URL" target="_blank">Name</a>. Never use markdown link syntax.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto. ' +
      'Pour l\'intent "pm_workflow" : transforme le plan PM en réponse actionnable avec liens vers les outils PM. ' +
      'Pour les autres intents (portfolio/tech/contact/other) : réponds directement à la question via user_goal — ne cite pas les outils PM sauf si vraiment pertinent. ' +
      'Max 220 mots. Liens HTML cliquables si tu cites un outil : <a href="URL" target="_blank">Nom</a>. Jamais de liens markdown.';

  const plannerMessages = [
    { role: 'system', content: plannerPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const plannerRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: plannerMessages,
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  if (!plannerRes.ok) {
    return plannerRes.response;
  }

  const planText = extractContent(plannerRes.data);

  const toolLinks = [
    'OKR Builder: https://cmankotech.github.io/cmankotech/okr-builder.html',
    'Discovery Assistant: https://cmankotech.github.io/cmankotech/discovery-assistant.html',
    'User Interview Analyzer: https://cmankotech.github.io/cmankotech/user-interview-analyzer.html',
    'Backlog Prioritizer: https://cmankotech.github.io/cmankotech/backlog-prioritizer.html',
    'Epic to User Stories: https://cmankotech.github.io/cmankotech/epic-to-userstories.html',
    'Roadmap Storyteller: https://cmankotech.github.io/cmankotech/roadmap-storyteller.html',
  ].join('\n');

  const synthesisMessages = [
    { role: 'system', content: synthesisPrompt },
    {
      role: 'user',
      content: `User request:\n${userMessage}\n\nPlan JSON:\n${planText}\n\nTools:\n${toolLinks}`,
    },
  ];

  const synthesisRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: synthesisMessages,
    temperature: 0.45,
    max_tokens: 450,
  });

  if (!synthesisRes.ok) {
    return synthesisRes.response;
  }

  const reply = extractContent(synthesisRes.data);
  ctx?.waitUntil?.(incrementCounter(env));
  return jsonResponse({ reply, plan: safeJsonParse(planText) || null });
}


async function handleOrchestratorStream(body, env, ctx) {
  const lang = body.lang === 'en' ? 'en' : 'fr';
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const userMessage = typeof body.message === 'string' ? body.message : '';

  if (!userMessage.trim()) {
    return jsonResponse({ reply: lang === 'en' ? 'Please share your request.' : 'Partage-moi ton besoin.' }, 400);
  }

  const plannerPrompt = lang === 'en'
    ? 'You are KRL1, portfolio assistant for Carlin Mankoto (AI Product Manager). Analyse the user intent and return strict JSON only. ' +
      'Intent values: "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory questions), "portfolio" (Carlin profile/experience/certifications), "tech" (stack/architecture/KRL1 technical questions), "contact", "other". ' +
      'Keys: intent, confidence (0-1), user_goal, steps (array of {tool, objective, output} — only for pm_workflow, else []), risks (array), quick_win.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto (AI PM). Analyse l\'intention et retourne uniquement du JSON strict. ' +
      'Valeurs d\'intent : "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory), "portfolio" (profil/expérience/certifs de Carlin), "tech" (stack/architecture/questions techniques sur KRL1), "contact", "other". ' +
      'Clés : intent, confidence (0-1), user_goal, steps (tableau {tool, objective, output} — seulement pour pm_workflow, sinon []), risks (tableau), quick_win.';

  const plannerRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: plannerPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  if (!plannerRes.ok) return plannerRes.response;

  const planText = extractContent(plannerRes.data);

  const synthesisPrompt = lang === 'en'
    ? 'You are KRL1, Carlin Mankoto\'s portfolio assistant. ' +
      'For intent "pm_workflow": transform the PM plan into an actionable answer with links to PM tools. ' +
      'For other intents (portfolio/tech/contact/other): answer the question directly based on user_goal — do NOT mention PM tools unless genuinely relevant. ' +
      'Max 220 words. When citing a tool, use HTML link: <a href="URL" target="_blank">Name</a>. Never use markdown link syntax.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto. ' +
      'Pour l\'intent "pm_workflow" : transforme le plan PM en réponse actionnable avec liens vers les outils PM. ' +
      'Pour les autres intents (portfolio/tech/contact/other) : réponds directement à la question via user_goal — ne cite pas les outils PM sauf si vraiment pertinent. ' +
      'Max 220 mots. Liens HTML cliquables si tu cites un outil : <a href="URL" target="_blank">Nom</a>. Jamais de liens markdown.';

  const toolLinks = [
    'OKR Builder: https://cmankotech.github.io/cmankotech/okr-builder.html',
    'Discovery Assistant: https://cmankotech.github.io/cmankotech/discovery-assistant.html',
    'User Interview Analyzer: https://cmankotech.github.io/cmankotech/user-interview-analyzer.html',
    'Backlog Prioritizer: https://cmankotech.github.io/cmankotech/backlog-prioritizer.html',
    'Epic to User Stories: https://cmankotech.github.io/cmankotech/epic-to-userstories.html',
    'Roadmap Storyteller: https://cmankotech.github.io/cmankotech/roadmap-storyteller.html',
  ].join('\n');

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: synthesisPrompt },
        { role: 'user', content: `User request:\n${userMessage}\n\nPlan JSON:\n${planText}\n\nTools:\n${toolLinks}` },
      ],
      temperature: 0.45,
      max_tokens: 450,
      stream: true,
    }),
  });

  if (!groqRes.ok) {
    const text = await groqRes.text();
    return new Response(text, {
      status: groqRes.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  ctx?.waitUntil?.(incrementCounter(env));

  return new Response(groqRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      ...corsHeaders(),
    },
  });
}

async function forwardToLangGraph(body, env) {
  const endpoint = env.LANGGRAPH_ORCHESTRATOR_URL;
  if (!endpoint) {
    return null;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

async function proxyGroq(body, env, ctx) {
  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await groqRes.text();
  if (groqRes.ok) ctx?.waitUntil?.(incrementCounter(env));
  return new Response(text, {
    status: groqRes.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

async function callGroq(env, payload) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      response: new Response(text || 'Upstream Error', {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      }),
    };
  }

  return { ok: true, data: safeJsonParse(text) || {} };
}

function extractContent(data) {
  return data?.choices?.[0]?.message?.content || '';
}

function safeJsonParse(value) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
