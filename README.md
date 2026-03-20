# TransmissionAI

A tiny browser-first MVP that loads a local LLM using your GPU via WebGPU.

## Run locally

Because this app uses ES modules, serve it over HTTP:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## What it does

- Renders a chat interface in the browser.
- Loads `nvidia/nemotron-3-nano-4b` using `@xenova/transformers`.
- Runs inference client-side on WebGPU (no backend required).

## Notes

- Browser WebGPU support is required (latest Chrome/Edge recommended).
- First load can take a while because model files are downloaded to browser cache.
- If the selected model format is unsupported by `transformers.js`, loading will fail with an on-screen error.
