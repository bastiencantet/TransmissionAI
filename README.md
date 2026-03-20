# TransmissionAI (Next.js)

Version migrée vers **Next.js** avec une interface plus claire:

- États de chargement visibles (app, modèle, génération).
- Panneau de logs détaillé dans l'UI.
- Logs également envoyés dans la console navigateur.
- Intégration `@xenova/transformers` pour le mode WebGPU local.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Puis ouvrir <http://localhost:3000>.

## Build de production

```bash
npm run build
npm start
```

## Notes

- WebGPU est requis pour charger le modèle dans le navigateur.
- Le premier chargement du modèle peut être long (cache navigateur).
