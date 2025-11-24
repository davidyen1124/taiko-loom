import { useCallback, useEffect, useRef, useState } from "react";
export function usePlayback(audioUrl: string | null, lanePxPerSecond: number, isActive = true) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lastUiUpdateRef = useRef(0);
  const UI_UPDATE_INTERVAL_MS = 32; // ~30fps UI refresh to keep transport/notes smooth without over-rendering

  const [displayTime, setDisplayTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const resetPlayback = useCallback(() => {
    setDisplayTime(0);
    setDuration(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (trackRef.current) {
      trackRef.current.style.setProperty("--active-shift", "0px");
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    lastUiUpdateRef.current = 0;
    let frame: number;
    const update = (timestamp: number) => {
      const audio = audioRef.current;
      const current = audio?.currentTime ?? 0;
      if (trackRef.current) {
        trackRef.current.style.setProperty("--active-shift", `${current * lanePxPerSecond}px`);
      }
      if (timestamp - lastUiUpdateRef.current > UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateRef.current = timestamp;
        setDisplayTime(current);
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [audioUrl, isActive, lanePxPerSecond]);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const handleLoaded = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl, isActive]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleScrub = (value: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = value;
    setDisplayTime(value);
    if (trackRef.current) {
      trackRef.current.style.setProperty("--active-shift", `${value * lanePxPerSecond}px`);
    }
  };

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      resetPlayback();
    });
    return () => cancelAnimationFrame(frame);
  }, [audioUrl, isActive, resetPlayback]);

  return {
    audioRef,
    trackRef,
    displayTime,
    duration,
    isPlaying,
    togglePlayback,
    handleScrub,
    resetPlayback,
  };
}
