# @uplinkswitch/ai-sdk-provider

[UplinkSwitch](https://uplinkswitch.com) provider for the [Vercel AI SDK](https://ai-sdk.dev). One key and one base URL for Claude, GPT, Gemini, Grok, DeepSeek and the open-weight models, up to 70% under list price.

The package wraps `@ai-sdk/openai-compatible` with the UplinkSwitch defaults: the base URL is `https://api.uplinkswitch.com/v1` and the key is read from `UPLINKSWITCH_API_KEY`. Any model id from the [catalog](https://uplinkswitch.com/models) works with `generateText`, `streamText` and the rest of the AI SDK.

## Install

```sh
npm install @uplinkswitch/ai-sdk-provider ai
```

Get a key at [uplinkswitch.com/console](https://uplinkswitch.com/console) and export it:

```sh
export UPLINKSWITCH_API_KEY="sk-uplink-live-..."
```

## Generate text

```ts
import { uplinkswitch } from '@uplinkswitch/ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: uplinkswitch('gpt-6.1-sol'),
  prompt: 'Explain what an API gateway does in one sentence.',
});

console.log(text);
```

## Stream text

```ts
import { uplinkswitch } from '@uplinkswitch/ai-sdk-provider';
import { streamText } from 'ai';

const result = streamText({
  model: uplinkswitch('claude-sonnet-5-5'),
  prompt: 'Count to five, one number per line.',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

## Custom instance

`createUplinkSwitch` takes the key, base URL and extra headers explicitly. Every option is optional.

```ts
import { createUplinkSwitch } from '@uplinkswitch/ai-sdk-provider';

const uplinkswitch = createUplinkSwitch({
  apiKey: process.env.UPLINKSWITCH_API_KEY,
  baseURL: 'https://api.uplinkswitch.com/v1',
  headers: { 'x-request-source': 'my-app' },
});
```

| Option | Default |
| --- | --- |
| `apiKey` | `process.env.UPLINKSWITCH_API_KEY` |
| `baseURL` | `https://api.uplinkswitch.com/v1` |
| `headers` | none |
| `fetch` | global `fetch` |
| `includeUsage` | `true` |

The default `uplinkswitch` export reads the environment variable the first time it is used, so importing the package never throws. `createUplinkSwitch()` throws a clear error when neither `apiKey` nor `UPLINKSWITCH_API_KEY` is set.

## Models

The provider also exposes `chatModel`, `languageModel` and `embeddingModel`. Every model and price is listed at [uplinkswitch.com/llms-full.txt](https://uplinkswitch.com/llms-full.txt) and served as JSON at `GET https://api.uplinkswitch.com/v1/catalog`.

Image, video and speech models use the UplinkSwitch media endpoints instead; see the [media guide](https://uplinkswitch.com/guides/media).

## Development

```sh
npm install
npm run build   # tsup: ESM, CJS and type declarations in dist/
npm test        # vitest, no network
```

## License

MIT, Uplink Switch LLC.
