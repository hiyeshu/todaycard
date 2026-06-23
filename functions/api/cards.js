/**
 * [INPUT]: 依赖 Cloudflare Pages Functions 的 env/request、Dify Workflow API 和浏览器提交的 question
 * [OUTPUT]: 对外提供 POST /api/cards，返回 { answers: string[] } 给 app.js
 * [POS]: functions/api 的 Dify 代理层，隔离 DIFY_API_KEY，不参与卡片渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const DEFAULT_API_BASE = 'https://api.dify.ai/v1';
const DEFAULT_INPUT_NAME = 'query';
const DEFAULT_OUTPUT_NAME = 'answers';
const ANSWER_COUNT = 4;

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

export async function onRequestOptions() {
  return jsonResponse({}, 204);
}

export async function onRequestPost({ request, env }) {
  const config = readConfig(env);
  if (!config.apiKey) return jsonResponse({ error: 'missing_dify_api_key' }, 500);

  const question = await readQuestion(request);
  if (!question) return jsonResponse({ error: 'missing_question' }, 400);

  const answers = await generateAnswers(config, question);
  if (!answers.length) return jsonResponse({ error: 'empty_answers' }, 502);

  return jsonResponse({ answers });
}

async function generateAnswers(config, question) {
  try {
    const payload = await runDify(config, question);
    return normalizeAnswers(payload, config.outputName);
  } catch {
    return [];
  }
}

function readConfig(env) {
  return {
    apiKey: env.DIFY_API_KEY,
    apiBase: trimSlash(env.DIFY_API_BASE_URL || DEFAULT_API_BASE),
    workflowId: env.DIFY_WORKFLOW_ID || '',
    inputName: env.DIFY_INPUT_NAME || DEFAULT_INPUT_NAME,
    outputName: env.DIFY_OUTPUT_NAME || DEFAULT_OUTPUT_NAME,
    user: env.DIFY_USER || 'todaycard-web'
  };
}

async function readQuestion(request) {
  try {
    const body = await request.json();
    return String(body.question || body.query || '').trim().slice(0, 160);
  } catch {
    return '';
  }
}

async function runDify(config, question) {
  const response = await fetch(difyUrl(config), {
    method: 'POST',
    headers: difyHeaders(config.apiKey),
    body: JSON.stringify(difyBody(config, question))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Dify ${response.status}`);
  return payload;
}

function difyUrl(config) {
  const suffix = config.workflowId ? `/workflows/${config.workflowId}/run` : '/workflows/run';
  return `${config.apiBase}${suffix}`;
}

function difyHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
}

function difyBody(config, question) {
  return {
    inputs: { [config.inputName]: question },
    response_mode: 'blocking',
    user: config.user
  };
}

function normalizeAnswers(payload, outputName) {
  const outputs = payload && payload.data && payload.data.outputs ? payload.data.outputs : {};
  const value = outputs[outputName] || outputs.answers;
  const answers = Array.isArray(value) ? value : parseAnswerText(value);
  return answers.map(cleanAnswer).filter(Boolean).slice(0, ANSWER_COUNT);
}

function parseAnswerText(value) {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : parsed.answers;
  } catch {
    return value.split('\n');
  }
}

function cleanAnswer(value) {
  return String(value || '').trim().replace(/^\d+[.、]\s*/, '').slice(0, 48);
}

function trimSlash(value) {
  return String(value).replace(/\/+$/, '');
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}
