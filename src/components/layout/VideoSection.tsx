import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';

/**
 * Official Teaser Video Section
 * Uses /v2 TEASER.mp4 — no autoplay.
 * Premium controls overlay.
 */
const VideoSection: React.FC = () => {
  const videoRef                    = useRef<HTMLVideoElement>(null);
  const [playing,   setPlaying]     = useState(false);
  const [muted,     setMuted]       = useState(false);
  const [progress,  setProgress]    = useState(0);
  const [showCtrl,  setShowCtrl]    = useState(true);
  const hideTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  };

  const handleMouseMove = () => {
    setShowCtrl(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowCtrl(false), 2500);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
    setShowCtrl(true);
  };

  return (
    <SectionContainer
      id="teaser"
      className="bg-gradient-to-b from-comun-black via-comun-navy/20 to-comun-black relative"
    >
      <div className="relative z-10">
        <SectionHeader
          eyebrow="Official Teaser"
          title={
            <>
              Watch the{' '}
              <span className="text-gold-gradient">CoMUN 2026</span>{' '}
              Teaser
            </>
          }
          subtitle="Get a first look at what awaits. Diplomacy. Drama. Dialogue."
        />

        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Gold border glow frame */}
          <div className="absolute -inset-px bg-gradient-to-br from-comun-gold/30 via-transparent to-comun-gold/20 rounded-sm" />
          <div className="absolute -inset-0.5 bg-comun-gold/10 blur-sm rounded-sm" />

          {/* Main video wrapper */}
          <div
            className="relative w-full bg-comun-black overflow-hidden rounded-sm"
            style={{ aspectRatio: '16/9' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => playing && setShowCtrl(false)}
          >
            <video
              ref={videoRef}
              src="/v2 TEASER.mp4"
              className="w-full h-full object-cover"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              preload="metadata"
              playsInline
            />

            {/* Video overlay gradient */}
            <div className="absolute inset-0 video-overlay-gradient pointer-events-none" />

            {/* Poster / Play button overlay (shown when not playing) */}
            <AnimatePresence>
              {!playing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-comun-black/40 cursor-pointer group"
                  onClick={togglePlay}
                >
                  {/* Play button */}
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center"
                  >
                    <div className="absolute inset-0 border-2 border-comun-gold/50 rounded-full group-hover:border-comun-gold group-hover:scale-110 transition-all duration-300" />
                    <div className="absolute inset-0 bg-comun-gold/10 group-hover:bg-comun-gold/20 rounded-full blur-sm transition-all duration-300" />
                    <Play className="w-8 h-8 text-comun-gold ml-1 relative z-10" fill="currentColor" />
                  </motion.div>
                  <p className="font-sans text-sm text-comun-white/60 mt-5 tracking-widest uppercase">
                    Play Official Teaser
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls Bar */}
            <AnimatePresence>
              {(showCtrl || !playing) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 bg-gradient-to-t from-black/70 to-transparent"
                >
                  {/* Progress bar */}
                  <div
                    className="w-full h-1 bg-white/20 cursor-pointer mb-3 relative group/bar"
                    onClick={handleSeek}
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-comun-gold transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-comun-gold rounded-full -ml-1.5 shadow-gold-sm opacity-0 group-hover/bar:opacity-100 transition-opacity"
                      style={{ left: `${progress}%` }}
                    />
                  </div>

                  {/* Control buttons */}
                  <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="p-1.5 text-comun-white hover:text-comun-gold transition-colors"
                      aria-label={playing ? 'Pause' : 'Play'}
                    >
                      {playing
                        ? <Pause className="w-5 h-5" />
                        : <Play  className="w-5 h-5" fill="currentColor" />
                      }
                    </button>

                    {/* Mute */}
                    <button
                      onClick={toggleMute}
                      className="p-1.5 text-comun-white hover:text-comun-gold transition-colors"
                      aria-label={muted ? 'Unmute' : 'Mute'}
                    >
                      {muted
                        ? <VolumeX className="w-5 h-5" />
                        : <Volume2 className="w-5 h-5" />
                      }
                    </button>

                    <div className="flex-1" />

                    {/* Label */}
                    <span className="font-sans text-xs text-comun-white/50 tracking-widest uppercase hidden sm:block">
                      CoMUN 2026 — Official Teaser
                    </span>

                    {/* Fullscreen */}
                    <button
                      onClick={handleFullscreen}
                      className="p-1.5 text-comun-white hover:text-comun-gold transition-colors"
                      aria-label="Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Below video caption */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center font-sans text-xs text-comun-muted tracking-widest uppercase mt-6"
        >
          CoMUN 2026 — Cottons Model United Nations · Official Teaser
        </motion.p>
      </div>
    </SectionContainer>
  );
};

export default VideoSection;
