import {
  createOpenAICompatible,
  type OpenAICompatibleProvider,
  type OpenAICompatibleProviderSettings,
} from '@ai-sdk/openai-compatible';

/** The UplinkSwitch API base URL used when none is given. */
export const UPLINKSWITCH_BASE_URL = 'https://api.uplinkswitch.com/v1';

/** The environment variable the API key is read from when none is given. */
export const UPLINKSWITCH_API_KEY_ENV = 'UPLINKSWITCH_API_KEY';

export interface UplinkSwitchProviderSettings {
  /**
   * UplinkSwitch API key (`sk-uplink-live-...`). Defaults to the
   * `UPLINKSWITCH_API_KEY` environment variable.
   */
  apiKey?: string;
  /**
   * API base URL. Defaults to `https://api.uplinkswitch.com/v1`.
   */
  baseURL?: string;
  /**
   * Extra headers sent with every request.
   */
  headers?: Record<string, string>;
  /**
   * Custom fetch implementation, for example to intercept requests in tests.
   */
  fetch?: OpenAICompatibleProviderSettings['fetch'];
  /**
   * Include usage information in streaming responses. Defaults to true.
   */
  includeUsage?: boolean;
}

export type UplinkSwitchProvider = OpenAICompatibleProvider;

function readEnvApiKey(): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env;
  return env?.[UPLINKSWITCH_API_KEY_ENV];
}

function hasAuthorizationHeader(headers: Record<string, string> | undefined): boolean {
  if (!headers) return false;
  return Object.keys(headers).some((k) => k.toLowerCase() === 'authorization');
}

/**
 * Create an UplinkSwitch provider for the Vercel AI SDK.
 *
 * Every model id in the UplinkSwitch catalog works with the returned provider,
 * for example `uplinkswitch('gpt-6.1-sol')` or `uplinkswitch('claude-sonnet-5-5')`.
 */
export function createUplinkSwitch(
  settings: UplinkSwitchProviderSettings = {},
): UplinkSwitchProvider {
  const apiKey = settings.apiKey ?? readEnvApiKey();

  if (!apiKey && !hasAuthorizationHeader(settings.headers)) {
    throw new Error(
      `UplinkSwitch API key is missing. Pass { apiKey } to createUplinkSwitch() ` +
        `or set the ${UPLINKSWITCH_API_KEY_ENV} environment variable. ` +
        `Keys are created at https://uplinkswitch.com/console.`,
    );
  }

  return createOpenAICompatible({
    name: 'uplinkswitch',
    baseURL: settings.baseURL ?? UPLINKSWITCH_BASE_URL,
    apiKey,
    headers: settings.headers,
    fetch: settings.fetch,
    includeUsage: settings.includeUsage ?? true,
  });
}

let defaultProvider: UplinkSwitchProvider | undefined;

function getDefaultProvider(): UplinkSwitchProvider {
  if (!defaultProvider) {
    defaultProvider = createUplinkSwitch();
  }
  return defaultProvider;
}

/**
 * Default UplinkSwitch provider. It reads `UPLINKSWITCH_API_KEY` the first
 * time it is used, so importing this module never throws.
 */
export const uplinkswitch: UplinkSwitchProvider = new Proxy(
  function uplinkswitchProvider() {} as unknown as UplinkSwitchProvider,
  {
    apply(_target, _thisArg, args: [string]) {
      return getDefaultProvider()(...args);
    },
    get(_target, property) {
      const provider = getDefaultProvider();
      const value = Reflect.get(provider, property) as unknown;
      return typeof value === 'function' ? (value as Function).bind(provider) : value;
    },
  },
);

export default uplinkswitch;
