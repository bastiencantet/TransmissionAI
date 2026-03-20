'use client';

import { useMemo, useRef, useState } from 'react';
import { env, pipeline } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const defaultModel = 'nvidia/nemotron-3-nano-4b';

export default function HomePage() {
  const [modelId, setModelId] = useState(defaultModel);
  const [status, setStatus] = useState('Idle');
  const [loadingModel, setLoadingModel] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Bienvenue 👋 Clique sur “Charger le modèle” puis pose ta question.'
    }
  ]);
  const [logs, setLogs] = useState([
    `[${new Date().toLocaleTimeString()}] App initialisée`,
    `[${new Date().toLocaleTimeString()}] Prête à charger le modèle ${defaultModel}`
  ]);

  const generatorRef = useRef(null);

  const canSend = useMemo(() => {
    return prompt.trim().length > 0 && !loadingModel && !generating;
  }, [prompt, loadingModel, generating]);

  function log(message) {
    const line = `[${new Date().toLocaleTimeString()}] ${message}`;
    console.log(`[TransmissionAI] ${message}`);
    setLogs((prev) => [...prev, line]);
  }

  async function ensureModelLoaded() {
    if (generatorRef.current) {
      log('Modèle déjà chargé, aucune action nécessaire.');
      return true;
    }

    if (loadingModel) {
      log('Chargement déjà en cours, on attend.');
      return false;
    }

    const selectedModel = modelId.trim();
    if (!selectedModel) {
      log('Aucun model ID fourni.');
      setStatus('Model ID requis');
      return false;
    }

    setLoadingModel(true);
    setStatus(`Chargement de ${selectedModel}...`);
    log(`Démarrage du chargement modèle: ${selectedModel}`);

    try {
      generatorRef.current = await pipeline('text-generation', selectedModel, {
        device: 'webgpu',
        dtype: 'q4'
      });

      setStatus(`Modèle chargé: ${selectedModel}`);
      log(`Modèle chargé avec succès: ${selectedModel}`);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `✅ Modèle ${selectedModel} chargé. Je suis prêt.`
        }
      ]);
      return true;
    } catch (error) {
      generatorRef.current = null;
      const reason = error?.message || String(error);
      setStatus('Échec du chargement modèle');
      log(`Erreur chargement modèle: ${reason}`);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Impossible de charger le modèle: ${reason}`
        }
      ]);
      return false;
    } finally {
      setLoadingModel(false);
    }
  }

  async function generateAnswer(userPrompt) {
    const ready = await ensureModelLoaded();
    if (!ready || !generatorRef.current) {
      log('Génération annulée car modèle indisponible.');
      return;
    }

    setGenerating(true);
    setStatus('Génération en cours...');
    log(`Génération démarrée (${userPrompt.length} caractères).`);

    try {
      const output = await generatorRef.current(userPrompt, {
        max_new_tokens: 220,
        do_sample: true,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.08
      });

      const answer = output?.[0]?.generated_text || 'Aucune réponse générée.';

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
      setStatus('Prêt');
      log('Génération terminée avec succès.');
    } catch (error) {
      const reason = error?.message || String(error);
      setStatus('Erreur de génération');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Erreur pendant la génération: ${reason}` }
      ]);
      log(`Erreur génération: ${reason}`);
    } finally {
      setGenerating(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      log('Prompt vide ignoré.');
      return;
    }

    setPrompt('');
    setMessages((prev) => [...prev, { role: 'user', content: cleanPrompt }]);
    log(`Message utilisateur envoyé: "${cleanPrompt.slice(0, 80)}"`);

    await generateAnswer(cleanPrompt);
  }

  return (
    <main className="page">
      <section className="panel main-panel">
        <header className="header">
          <h1>TransmissionAI (Next.js)</h1>
          <p>UI claire + états de loading + logs détaillés.</p>
        </header>

        <div className="controls">
          <label htmlFor="model-id">Model ID</label>
          <input
            id="model-id"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="nvidia/nemotron-3-nano-4b"
          />
          <button onClick={ensureModelLoaded} disabled={loadingModel || generating}>
            {loadingModel ? 'Chargement…' : 'Charger le modèle'}
          </button>
          <span className="status">{status}</span>
        </div>

        <div className="chat">
          {messages.map((msg, index) => (
            <article key={`${msg.role}-${index}`} className={`message ${msg.role}`}>
              <strong>{msg.role === 'user' ? 'Toi' : 'Assistant'}:</strong> {msg.content}
            </article>
          ))}
          {(loadingModel || generating) && (
            <article className="message assistant loading">
              <strong>Assistant:</strong>{' '}
              {loadingModel ? 'Chargement du modèle en cours…' : 'Je réfléchis…'}
            </article>
          )}
        </div>

        <form className="composer" onSubmit={onSubmit}>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Pose ta question..."
            required
          />
          <button type="submit" disabled={!canSend}>
            {generating ? 'Génération…' : 'Envoyer'}
          </button>
        </form>
      </section>

      <aside className="panel logs-panel">
        <h2>Logs</h2>
        <p className="logs-caption">Journal détaillé des actions (UI + console).</p>
        <div className="logs">
          {logs.map((entry, idx) => (
            <p key={`${idx}-${entry}`}>{entry}</p>
          ))}
        </div>
      </aside>
    </main>
  );
}
