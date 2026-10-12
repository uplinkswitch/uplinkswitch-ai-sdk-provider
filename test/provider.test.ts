import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';
import {
  createUplinkSwitch,
  uplinkswitch,
  UPLINKSWITCH_API_KEY_ENV,
  UPLINKSWITCH_BASE_URL,
} from '../src/index';

type Captured = { url: string; headers: Headers; body: unknown };

function fakeFetch(captured: Captured[]): typeof fetch {
  return async (input, init) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : {}));
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    captured.push({ url, headers, body });
    return new Response(
      JSON.stringify({
        id: 'chatcmpl-test',
        object: 'chat.completion',
        created: 1,
        model: 'gpt-6.1-sol',
        choices: [
          { index: 0, message: { role: 'assistant', content: 'pong' }, finish_reason: 'stop' },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };
}

describe('createUplinkSwitch', () => {
  const savedKey = process.env[UPLINKSWITCH_API_KEY_ENV];

  beforeEach(() => {
    delete process.env[UPLINKSWITCH_API_KEY_ENV];
  });

  afterEach(() => {
    if (savedKey === undefined) delete process.env[UPLINKSWITCH_API_KEY_ENV];
    else process.env[UPLINKSWITCH_API_KEY_ENV] = savedKey;
    vi.unstubAllEnvs();
  });

  it('throws a clear error when no key is available', () => {
    expect(() => createUplinkSwitch()).toThrowError(/UPLINKSWITCH_API_KEY/);
  });

  it('reads the key from UPLINKSWITCH_API_KEY and uses the default base URL', async () => {
    vi.stubEnv(UPLINKSWITCH_API_KEY_ENV, 'sk-uplink-live-test');
    const captured: Captured[] = [];
    const provider = createUplinkSwitch({ fetch: fakeFetch(captured) });
    const model = provider('gpt-6.1-sol');

    expect(model.provider).toBe('uplinkswitch.chat');
    expect(model.modelId).toBe('gpt-6.1-sol');

    const { text } = await generateText({ model, prompt: 'ping' });

    expect(text).toBe('pong');
    expect(captured).toHaveLength(1);
    expect(captured[0].url).toBe(`${UPLINKSWITCH_BASE_URL}/chat/completions`);
    expect(captured[0].headers.get('authorization')).toBe('Bearer sk-uplink-live-test');
    expect(captured[0].body).toMatchObject({ model: 'gpt-6.1-sol' });
  });

  it('prefers an explicit apiKey, baseURL and headers over the defaults', async () => {
    vi.stubEnv(UPLINKSWITCH_API_KEY_ENV, 'sk-uplink-live-env');
    const captured: Captured[] = [];
    const provider = createUplinkSwitch({
      apiKey: 'sk-uplink-live-explicit',
      baseURL: 'https://example.invalid/custom/v1/',
      headers: { 'x-example': 'yes' },
      fetch: fakeFetch(captured),
    });

    await generateText({ model: provider('claude-sonnet-5-5'), prompt: 'ping' });

    expect(captured[0].url).toBe('https://example.invalid/custom/v1/chat/completions');
    expect(captured[0].headers.get('authorization')).toBe('Bearer sk-uplink-live-explicit');
    expect(captured[0].headers.get('x-example')).toBe('yes');
    expect(captured[0].body).toMatchObject({ model: 'claude-sonnet-5-5' });
  });

  it('accepts a caller-supplied Authorization header instead of a key', () => {
    const provider = createUplinkSwitch({ headers: { Authorization: 'Bearer sk-uplink-live-h' } });
    expect(provider('gpt-6.1-sol').provider).toBe('uplinkswitch.chat');
  });

  it('exposes chatModel, languageModel and embeddingModel', () => {
    const provider = createUplinkSwitch({ apiKey: 'sk-uplink-live-test' });
    expect(provider.chatModel('gpt-6.1-sol').modelId).toBe('gpt-6.1-sol');
    expect(provider.languageModel('gpt-6.1-sol').modelId).toBe('gpt-6.1-sol');
    expect(provider.embeddingModel('text-embedding-example').modelId).toBe(
      'text-embedding-example',
    );
  });
});

describe('default uplinkswitch instance', () => {
  it('resolves lazily from the environment on first use', () => {
    vi.stubEnv(UPLINKSWITCH_API_KEY_ENV, 'sk-uplink-live-lazy');
    const model = uplinkswitch('gemini-3.5-flash');
    expect(model.provider).toBe('uplinkswitch.chat');
    expect(model.modelId).toBe('gemini-3.5-flash');
    expect(uplinkswitch.specificationVersion).toBe('v4');
    vi.unstubAllEnvs();
  });
});
