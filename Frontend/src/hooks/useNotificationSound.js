import { useCallback, useRef } from 'react';

export function useNotificationSound() {
  const audioContextRef = useRef(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Create audio context lazily
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create a pleasant notification sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pleasant bell-like tone
      oscillator.frequency.setValueAtTime(830, ctx.currentTime); // G#5
      oscillator.type = 'sine';

      // Envelope for a soft notification sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);

      // Second tone for a pleasant chime effect
      setTimeout(() => {
        const oscillator2 = ctx.createOscillator();
        const gainNode2 = ctx.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(ctx.destination);

        oscillator2.frequency.setValueAtTime(1046, ctx.currentTime); // C6
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0, ctx.currentTime);
        gainNode2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        oscillator2.start(ctx.currentTime);
        oscillator2.stop(ctx.currentTime + 0.4);
      }, 100);

    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, []);

  return { playNotificationSound };
}
