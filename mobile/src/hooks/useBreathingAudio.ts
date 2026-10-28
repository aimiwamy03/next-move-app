import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';

const defaultSource = require('../../assets/audio/five-minute-breathing-ucla.mp3');

/**
 * Loads one sound for `source`. Recreates only when `source` changes.
 * `autoPlay` is read at load time (ref) so toggling play/pause does not reload.
 */
export function useBreathingAudio(
  autoPlay = false,
  source: AudioSource = defaultSource,
) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const playingRef = useRef(false);
  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;

  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const setPlayingBoth = (v: boolean) => {
    playingRef.current = v;
    setPlaying(v);
  };

  useEffect(() => {
    let mounted = true;
    let poll: ReturnType<typeof setInterval> | null = null;
    setReady(false);
    setPositionMs(0);
    setDurationMs(0);
    setPlayingBoth(false);

    (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        if (!mounted) return;

        const player = createAudioPlayer(source, { updateInterval: 250 });
        playerRef.current = player;
        setReady(true);

        poll = setInterval(() => {
          const p = playerRef.current;
          if (!p || !mounted) return;
          setPlayingBoth(p.playing);
          setPositionMs(Math.floor((p.currentTime || 0) * 1000));
          setDurationMs(Math.floor((p.duration || 0) * 1000));
        }, 250);

        if (autoPlayRef.current) {
          player.play();
          setPlayingBoth(true);
        }
      } catch (e) {
        console.warn('[breathing audio]', e);
      }
    })();

    return () => {
      mounted = false;
      if (poll) clearInterval(poll);
      const p = playerRef.current;
      playerRef.current = null;
      if (p) {
        try {
          p.pause();
        } catch {
          /* ignore */
        }
        try {
          p.release();
        } catch {
          /* ignore */
        }
      }
    };
  }, [source]);

  const play = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    setPlayingBoth(true);
    try {
      p.play();
    } catch (e) {
      console.warn('[breathing audio] play', e);
      setPlayingBoth(false);
    }
  }, []);

  const pause = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    setPlayingBoth(false);
    try {
      p.pause();
    } catch (e) {
      console.warn('[breathing audio] pause', e);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (playingRef.current) await pause();
    else await play();
  }, [play, pause]);

  const stop = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    setPlayingBoth(false);
    try {
      p.pause();
      await p.seekTo(0);
      setPositionMs(0);
    } catch (e) {
      console.warn('[breathing audio] stop', e);
    }
  }, []);

  return {
    ready,
    playing,
    positionMs,
    durationMs,
    play,
    pause,
    toggle,
    stop,
  };
}

export function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
