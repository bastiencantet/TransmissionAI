import './globals.css';

export const metadata = {
  title: 'TransmissionAI - Next.js',
  description: 'Chat local LLM dans le navigateur avec WebGPU'
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
