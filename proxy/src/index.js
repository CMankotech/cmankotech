const ALLOWED_ORIGIN = 'https://cmankotech.github.io';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
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
      return handleOrchestrator(body, env);
    }

    return proxyGroq(body, env);
  },
};

async function handleOrchestrator(body, env) {
  if (env.LANGGRAPH_ORCHESTRATOR_URL) {
    try {
      const langGraphRes = await forwardToLangGraph(body, env);
      if (langGraphRes && langGraphRes.ok) {
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
    ? 'You are KRL1 PM Orchestrator. Output strict JSON only with keys: intent, confidence (0-1), user_goal, steps (array of {tool, objective, output}), risks (array), quick_win.'
    : 'Tu es KRL1 PM Orchestrator. Retourne uniquement du JSON strict avec les clés: intent, confidence (0-1), user_goal, steps (tableau de {tool, objective, output}), risks (tableau), quick_win.';

  const synthesisPrompt = lang === 'en'
    ? 'You are KRL1. Transform plan JSON into a concise, actionable answer. Max 220 words. Include next step. When mentioning a tool, insert a clickable HTML link: <a href="URL" target="_blank">Tool Name</a>. Never use markdown link syntax.'
    : 'Tu es KRL1. Transforme ce plan JSON en réponse actionnable et concise. Max 220 mots, avec prochaine action. Quand tu cites un outil, insère un lien HTML cliquable : <a href="URL" target="_blank">Nom Outil</a>. N\'utilise jamais la syntaxe markdown pour les liens.';

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
  return jsonResponse({ reply, plan: safeJsonParse(planText) || null });
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

async function proxyGroq(body, env) {
  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await groqRes.text();
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
