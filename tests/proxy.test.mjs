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

  // test: POST /veille archives the edition (latest + weekly key + sorted index)
  {
    const kv = new Map();
    kv.set('veille_index', JSON.stringify([{ week: '2', year: '2020', updated_at: '2020-01-08T00:00:00Z' }]));
    const env = {
      MAKE_SECRET: 's3cret',
      VEILLE_STORE: {
        async get(key, opts) {
          const v = kv.get(key);
          if (v === undefined) return null;
          return opts && opts.type === 'json' ? JSON.parse(v) : v;
        },
        async put(key, value) { kv.set(key, value); },
      },
    };

    const req = new Request('https://groq-proxy.cmankotech.workers.dev/veille', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-make-secret': 's3cret' },
      body: JSON.stringify({ categories: [{ id: 'ai', label: 'IA', digest: '', items: [] }] }),
    });
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);

    const latest = JSON.parse(kv.get('veille_latest'));
    assert.equal(latest.week, json.week);
    assert.ok(latest.year);
    assert.equal(latest.categories.length, 1);
    assert.ok(kv.has(`veille_week_${latest.year}_${latest.week}`));

    const index = JSON.parse(kv.get('veille_index'));
    assert.equal(index.length, 2);
    assert.equal(index[0].week, latest.week, 'newest edition first');
    assert.equal(index[0].year, latest.year);
    assert.equal(index[1].year, '2020', 'older edition kept and sorted last');
  }

  // test: POST /veille without valid secret is rejected
  {
    const req = new Request('https://groq-proxy.cmankotech.workers.dev/veille', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-make-secret': 'wrong' },
      body: JSON.stringify({ categories: [] }),
    });
    const res = await worker.fetch(req, { MAKE_SECRET: 's3cret' });
    assert.equal(res.status, 403);
  }

  // test: /veille-refresh tags curated items with site name, unwraps Bing links to
  // the publisher domain, decodes numeric entities, and dedups by title
  {
    const curatedXml = `<rss><channel>
      <item><title>Shared Article</title><link>https://www.mindtheproduct.com/a</link></item>
      <item><title>MTP Unique</title><link>https://www.mindtheproduct.com/b</link></item>
    </channel></rss>`;
    const bingXml = `<rss><channel>
      <item><title>Shared Article</title><link>http://www.bing.com/news/apiclick.aspx?ref=FexRss&amp;url=https%3a%2f%2fexample.com%2fa&amp;mkt=fr-fr</link><News:Source>x</News:Source></item>
      <item><title>Caf&#233; News</title><link>http://www.bing.com/news/apiclick.aspx?ref=FexRss&amp;url=https%3a%2f%2fwww.techcrunch.com%2fy&amp;mkt=fr-fr</link><News:Source>y</News:Source></item>
    </channel></rss>`;

    global.fetch = async (url) => {
      const u = String(url);
      if (u.includes('api.groq.com')) {
        return new Response(JSON.stringify({ choices: [{ message: { content: 'digest' } }] }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
      }
      const xml = u.includes('bing.com') ? bingXml : curatedXml;
      return new Response(xml, { status: 200, headers: { 'Content-Type': 'application/xml' } });
    };

    const kv = new Map();
    const env = {
      MAKE_SECRET: 's3cret',
      GROQ_KEY: 'dummy',
      VEILLE_STORE: {
        async get(key, opts) {
          const v = kv.get(key);
          if (v === undefined) return null;
          return opts && opts.type === 'json' ? JSON.parse(v) : v;
        },
        async put(key, value) { kv.set(key, value); },
      },
    };

    const req = new Request('https://groq-proxy.cmankotech.workers.dev/veille-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-make-secret': 's3cret' },
      body: JSON.stringify({}),
    });
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 200);

    const latest = JSON.parse(kv.get('veille_latest'));
    const product = latest.categories.find(c => c.id === 'product');
    assert.ok(product, 'product category present');

    const titles = product.items.map(i => i.title);
    // Bing item: numeric entity decoded, link unwrapped, source = publisher domain
    const bing = product.items.find(i => i.title === 'Café News');
    assert.ok(bing, 'numeric entity decoded in title');
    assert.equal(bing.source, 'techcrunch.com', 'Bing source is the unwrapped publisher domain');
    assert.equal(bing.url, 'https://www.techcrunch.com/y', 'Bing link unwrapped to the real article URL');
    // Curated item carries its real site name, not the category label
    const curated = product.items.find(i => i.title === 'MTP Unique');
    assert.equal(curated.source, 'Mind the Product', 'curated source is the site name');
    // Dedup by normalized title: "Shared Article" appears once
    assert.equal(titles.filter(t => t === 'Shared Article').length, 1, 'duplicate title collapsed');
  }

  global.fetch = originalFetch;
  console.log('proxy tests passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
