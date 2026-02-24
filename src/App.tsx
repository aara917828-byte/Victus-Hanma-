/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Settings2, 
  Maximize2, 
  Layers, 
  Palette,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Share2,
  History,
  Trash2,
  Clock
} from 'lucide-react';

// Types
type HistoryItem = {
  id: string;
  prompt: string;
  negativePrompt: string;
  style: { id: string; name: string; prompt: string };
  aspectRatio: { id: string; name: string; width: number; height: number };
  seed: number;
  imageUrl: string;
  timestamp: number;
};

// Constants for the generator
const STYLES = [
  { id: 'none', name: 'No Style', prompt: '' },
  { id: 'cinematic', name: 'Cinematic', prompt: 'cinematic lighting, highly detailed, 8k, masterpiece' },
  { id: 'digital-art', name: 'Digital Art', prompt: 'digital art style, vibrant colors, sharp focus' },
  { id: 'photorealistic', name: 'Photorealistic', prompt: 'photorealistic, ultra realistic, raw photo, 8k uhd' },
  { id: 'anime', name: 'Anime', prompt: 'anime style, cel shaded, vibrant, high quality' },
  { id: 'oil-painting', name: 'Oil Painting', prompt: 'oil painting, thick brushstrokes, textured, classical' },
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'cyberpunk aesthetic, neon lights, futuristic, dark atmosphere' },
  { id: 'sketch', name: 'Sketch', prompt: 'pencil sketch, hand drawn, graphite, detailed' },
];

const ASPECT_RATIOS = [
  { id: '1:1', name: 'Square (1:1)', width: 1024, height: 1024 },
  { id: '16:9', name: 'Landscape (16:9)', width: 1280, height: 720 },
  { id: '9:16', name: 'Portrait (9:16)', width: 720, height: 1280 },
  { id: '4:3', name: 'Classic (4:3)', width: 1024, height: 768 },
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, ugly, bad anatomy');
  const [style, setStyle] = useState(STYLES[0]);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('visionary_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('visionary_history', JSON.stringify(history));
  }, [history]);

  const generateImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    try {
      // Construct the final prompt with style
      const finalPrompt = style.prompt 
        ? `${prompt}, ${style.prompt}`
        : prompt;

      // Pollinations.ai image generation URL
      // Using the public endpoint which is highly reliable.
      // If a key is provided, it's usually for their newer API, but the URL-based one is standard for Pollinations.
      const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}`);
      
      url.searchParams.append('width', aspectRatio.width.toString());
      url.searchParams.append('height', aspectRatio.height.toString());
      url.searchParams.append('seed', seed.toString());
      url.searchParams.append('nologo', 'true');
      url.searchParams.append('model', 'flux'); // Using flux as it's their current high-quality model
      
      if (negativePrompt) {
        url.searchParams.append('negative', negativePrompt);
      }

      // We don't actually need to "fetch" the image data if we just want to display it,
      // but pre-loading it helps with the UI state.
      const img = new Image();
      img.src = url.toString();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      setGeneratedImageUrl(url.toString());

      // Add to history
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        prompt,
        negativePrompt,
        style,
        aspectRatio,
        seed,
        imageUrl: url.toString(),
        timestamp: Date.now(),
      };
      setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
    } catch (err) {
      console.error(err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visionary-ai-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  const loadFromHistory = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setNegativePrompt(item.negativePrompt);
    setStyle(STYLES.find(s => s.id === item.style.id) || STYLES[0]);
    setAspectRatio(ASPECT_RATIOS.find(r => r.id === item.aspectRatio.id) || ASPECT_RATIOS[0]);
    setSeed(item.seed);
    setGeneratedImageUrl(item.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-20">
        {/* Header */}
        <header className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3 h-3" />
              Next-Gen AI Generation
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Visionary Studio
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Transform your wildest imaginations into stunning visual masterpieces with our advanced AI engine.
            </p>
          </motion.div>
        </header>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Controls Section */}
          <section className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl"
            >
              <form onSubmit={generateImage} className="space-y-6">
                {/* Prompt Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" />
                    Your Vision
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A futuristic city floating in a sea of clouds at sunset..."
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                  />
                </div>

                {/* Style Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Palette className="w-3 h-3" />
                    Artistic Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStyle(s)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                          style.id === s.id
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  <Settings2 className="w-3 h-3" />
                  Advanced Options
                  {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-6 pt-2"
                    >
                      {/* Aspect Ratio */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Maximize2 className="w-3 h-3" />
                          Aspect Ratio
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {ASPECT_RATIOS.map((ratio) => (
                            <button
                              key={ratio.id}
                              type="button"
                              onClick={() => setAspectRatio(ratio)}
                              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                aspectRatio.id === ratio.id
                                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                                  : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                              }`}
                            >
                              {ratio.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Negative Prompt */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Layers className="w-3 h-3" />
                          Negative Prompt
                        </label>
                        <input
                          type="text"
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          placeholder="What to exclude..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>

                      {/* Seed */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <RefreshCw className="w-3 h-3" />
                          Seed
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={seed}
                            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          />
                          <button
                            type="button"
                            onClick={randomizeSeed}
                            className="p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Generate Button */}
                <button
                  disabled={isGenerating || !prompt.trim()}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                    isGenerating || !prompt.trim()
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Manifesting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Masterpiece
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </section>

          {/* Preview Section */}
          <section className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[2rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/5 aspect-square lg:aspect-auto lg:min-h-[600px] flex items-center justify-center">
                {generatedImageUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={generatedImageUrl}
                      alt="Generated AI Art"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Overlay Controls */}
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4">
                      <div className="flex gap-2">
                        <button
                          onClick={handleDownload}
                          className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-black/80 transition-all text-white"
                          title="Download Image"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-black/80 transition-all text-white"
                          title="Share"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl text-xs font-mono text-zinc-400">
                        SEED: {seed}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
                      <ImageIcon className="w-10 h-10 text-zinc-700" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-zinc-400">Ready for Creation</h3>
                      <p className="text-zinc-600 max-w-xs mx-auto text-sm">
                        Enter a prompt and click generate to see your imagination come to life.
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading Overlay */}
                <AnimatePresence>
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-6 z-20"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-emerald-500 animate-pulse" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-emerald-400 font-bold tracking-widest uppercase text-xs">Processing Neural Pathways</p>
                        <p className="text-zinc-400 text-sm italic">"Painting with pixels and probability..."</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Gallery / Recent (Optional placeholder) */}
            <div className="mt-8 grid grid-cols-4 gap-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${i + 10}/300/300`} 
                    alt="Sample" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-24 space-y-8"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <History className="w-8 h-8 text-emerald-500" />
                  Generation History
                </h2>
                <p className="text-zinc-500 text-sm">Your past creations are stored locally in your browser.</p>
              </div>
              <button
                onClick={clearHistory}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    onClick={() => loadFromHistory(item)}
                    className="group relative bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-500/30 transition-all shadow-xl"
                  >
                    {/* Image Preview */}
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <p className="text-xs text-white/90 line-clamp-2 font-medium mb-2">{item.prompt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => deleteFromHistory(item.id, e)}
                            className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Info Bar (Visible when not hovered) */}
                    <div className="p-3 border-t border-white/5 flex items-center justify-between group-hover:hidden">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate max-w-[120px]">
                        {item.style.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-600">
                        {item.aspectRatio.id}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold tracking-tight">Visionary Studio</span>
          </div>
          <p className="text-zinc-500 text-sm">
            Powered by Pollinations AI & Advanced Neural Networks.
          </p>
          <div className="flex gap-6 text-zinc-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
