/**
 * Update Prompt Component
 *
 * Shows a subtle notification when a new app version is available,
 * prompting users to update for the latest version.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpCircle, CheckCircle2, Loader2, Sparkles, X } from 'lucide-react';
import { useAppVersion } from '@/hooks/use-app-version';
import { Button } from '@/components/ui/button';

const UPDATE_STAGES = [
  'Preparing update',
  'Fetching latest version',
  'Applying improvements',
  'Finishing up',
] as const;

const UPDATE_DURATION_MS = 2200;

export function UpdatePrompt() {
  const { hasNewVersion, refreshApp, dismissUpdate } = useAppVersion();
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!isUpdating) return;

    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const nextProgress = Math.min(100, (elapsed / UPDATE_DURATION_MS) * 100);
      setProgress(nextProgress);
      setStageIndex(
        Math.min(
          UPDATE_STAGES.length - 1,
          Math.floor((elapsed / UPDATE_DURATION_MS) * UPDATE_STAGES.length),
        ),
      );

      if (elapsed < UPDATE_DURATION_MS) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    const reloadTimer = window.setTimeout(() => {
      refreshApp();
    }, UPDATE_DURATION_MS + 180);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(reloadTimer);
    };
  }, [isUpdating, refreshApp]);

  const handleUpdate = useCallback(() => {
    if (isUpdating) return;
    setProgress(0);
    setStageIndex(0);
    setIsUpdating(true);
  }, [isUpdating]);

  if (!hasNewVersion && !isUpdating) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {hasNewVersion && !isUpdating && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            <div className="overflow-hidden rounded-xl bg-gradient-to-r from-lime-500 to-green-500 p-4 text-white shadow-lg shadow-green-500/25">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex items-start gap-3">
                <div className="rounded-full bg-white/20 p-2">
                  <ArrowUpCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold">Update Available</h4>
                  <p className="mt-0.5 text-xs text-white/90">
                    A new version of FabZClean is available. Update now to get the latest features.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleUpdate}
                      className="h-7 bg-white px-3 text-xs text-green-600 hover:bg-white/90"
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      Update Now
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={dismissUpdate}
                      className="h-7 px-2 text-xs text-white hover:bg-white/20"
                    >
                      Later
                    </Button>
                  </div>
                </div>
                <button
                  onClick={dismissUpdate}
                  className="rounded-full p-1 transition-colors hover:bg-white/20"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUpdating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Updating application"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.22),_transparent_55%)]" />

              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-lime-400/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border-2 border-dashed border-lime-400/40"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-lime-400 to-green-500 shadow-lg shadow-lime-500/30"
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {progress >= 99 ? (
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    ) : (
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    )}
                  </motion.div>
                </div>

                <motion.h3
                  key={stageIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-lg font-semibold text-white"
                >
                  Updating FabZClean
                </motion.h3>

                <motion.p
                  key={`stage-${stageIndex}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 text-sm text-zinc-400"
                >
                  {UPDATE_STAGES[stageIndex]}…
                </motion.p>

                <div className="mt-6 w-full">
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-lime-400 via-green-400 to-emerald-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: 'easeOut', duration: 0.15 }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {UPDATE_STAGES.map((stage, index) => (
                    <motion.span
                      key={stage}
                      initial={false}
                      animate={{
                        opacity: index <= stageIndex ? 1 : 0.35,
                        scale: index === stageIndex ? 1.02 : 1,
                      }}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
                        index <= stageIndex
                          ? 'bg-lime-500/15 text-lime-300'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {stage}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
