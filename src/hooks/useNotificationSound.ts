import { useCallback, useRef, useState, useEffect } from "react";

const SOUND_ENABLED_KEY = "admin-notification-sound-enabled";

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SOUND_ENABLED_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_ENABLED_KEY, String(soundEnabled));
    } catch {
      // Ignore localStorage errors
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const now = audioContext.currentTime;

      // Create a pleasant two-tone notification chime
      const frequencies = [523.25, 659.25]; // C5 and E5 notes
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, now);

        // Envelope: quick attack, short sustain, gentle release
        const startTime = now + index * 0.12;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.35);
      });
    } catch (error) {
      console.warn("Could not play notification sound:", error);
    }
  }, [soundEnabled]);

  return { playNotificationSound, soundEnabled, toggleSound };
};
