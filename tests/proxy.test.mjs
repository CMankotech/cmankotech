import assert from 'node:assert/strict';
import worker from '../proxy/src/index.js';

function makeReq(url, body, origin = 'https://cmankotech.github.io') {
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: JSON.stringify(body),
  });
}

async function run() {
  const originalFetch = global.fetch;

  // test: forwards to external langgraph when configured
  {
    global.fetch = async (url) => {
      if (String(url).includes('langgraph.example.com')) {
        return new Response(JSON.stringify({ reply: 'via-langgraph', plan: { intent: 'x' }, engine: 'langgraph' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`unexpected URL ${url}`);
    };

    const req = makeReq('https://groq-proxy.cmankotech.workers.dev/orchestrate', {
      lang: 'fr',
      message: 'roadmap',
      history: [],
    });

    const res = await worker.fetch(req, {
      LANGGRAPH_ORCHESTRATOR_URL: 'https://langgraph.example.com/orchestrate',
      GROQ_KEY: 'dummy',
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.reply, 'via-langgraph');
    assert.equal(json.engine, 'langgraph');
  }

  // test: native orchestrator returns reply + plan when langgraph URL unset
  {
    let call = 0;
    global.fetch = async (url) => {
      call += 1;
      assert.equal(String(url), 'https://api.groq.com/openai/v1/chat/completions');
      if (call === 1) {
        return new Response(
          JSON.stringify({ choices: [{ message: { content: '{"intent":"roadmap","confidence":0.9,"user_goal":"goal","steps":[],"risks":[],"quick_win":"x"}' } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({ choices: [{ message: { content: 'Synthèse utile' } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const req = makeReq('https://groq-proxy.cmankotech.workers.dev/orchestrate', {
      lang: 'fr',
      message: 'prioriser backlog',
      history: [],
    });
    const res = await worker.fetch(req, { GROQ_KEY: 'dummy' });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.reply, 'Synthèse utile');
    assert.equal(json.plan.intent, 'roadmap');
  }

  // test: root passthrough still works
  {
    global.fetch = async (url) => {
      assert.equal(String(url), 'https://api.groq.com/openai/v1/chat/completions');
      return new Response(JSON.stringify({ choices: [{ message: { content: 'legacy' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const req = makeReq('https://groq-proxy.cmankotech.workers.dev/', {
      model: 'llama',
      messages: [{ role: 'user', content: 'hello' }],
    });
    const res = await worker.fetch(req, { GROQ_KEY: 'dummy' });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.choices[0].message.content, 'legacy');
  }

  global.fetch = originalFetch;
  console.log('proxy tests passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
