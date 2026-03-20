import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.allowLocalModels = false;
env.useBrowserCache = true;

const state = {
  generator: null,
  loading: false,
  history: []
};

const chatEl = document.querySelector('#chat');
const modelInput = document.querySelector('#model-id');
const statusEl = document.querySelector('#status');
const loadBtn = document.querySelector('#load-model');
const composer = document.querySelector('#composer');
const promptEl = document.querySelector('#prompt');
const sendBtn = document.querySelector('#send');

function setStatus(text) {
  statusEl.textContent = text;
}

function addMessage(role, content) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.textContent = `${role === 'user' ? 'You' : 'Nemotron'}: ${content}`;
  chatEl.appendChild(message);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function loadModel() {
  if (state.loading || state.generator) return;

  state.loading = true;
  loadBtn.disabled = true;
  sendBtn.disabled = true;

  const modelId = modelInput.value.trim();
  setStatus(`Loading ${modelId} on WebGPU…`);

  try {
    state.generator = await pipeline('text-generation', modelId, {
      device: 'webgpu',
      dtype: 'q4'
    });
    setStatus(`Loaded ${modelId} on WebGPU`);
    addMessage(
      'assistant',
      'Model loaded. Ask me anything. (All inference runs in your browser.)'
    );
  } catch (error) {
    console.error(error);
    state.generator = null;
    setStatus('Failed to load model on WebGPU. Check browser support and model compatibility.');
    addMessage(
      'assistant',
      `Could not load model: ${error.message || error}. Try Chrome/Edge with WebGPU enabled.`
    );
  } finally {
    state.loading = false;
    loadBtn.disabled = false;
    sendBtn.disabled = false;
  }
}

async function askModel(prompt) {
  if (!state.generator) {
    await loadModel();
  }
  if (!state.generator) return;

  setStatus('Generating…');
  sendBtn.disabled = true;

  const messages = [
    ...state.history,
    { role: 'user', content: prompt }
  ];

  try {
    const output = await state.generator(messages, {
      max_new_tokens: 220,
      do_sample: true,
      temperature: 0.7,
      top_p: 0.9,
      repetition_penalty: 1.08
    });

    const generated = output?.[0]?.generated_text;
    const answer = Array.isArray(generated)
      ? generated[generated.length - 1]?.content
      : output?.[0]?.generated_text || 'No response';

    state.history.push({ role: 'user', content: prompt });
    state.history.push({ role: 'assistant', content: answer });
    addMessage('assistant', answer);
    setStatus('Ready');
  } catch (error) {
    console.error(error);
    setStatus('Generation failed');
    addMessage('assistant', `Generation error: ${error.message || error}`);
  } finally {
    sendBtn.disabled = false;
  }
}

loadBtn.addEventListener('click', async () => {
  await loadModel();
});

composer.addEventListener('submit', async event => {
  event.preventDefault();
  const prompt = promptEl.value.trim();
  if (!prompt) return;

  addMessage('user', prompt);
  promptEl.value = '';
  await askModel(prompt);
});

addMessage(
  'assistant',
  'Click “Load model” to initialize Nemotron with your local GPU through WebGPU.'
);
setStatus('Idle');
