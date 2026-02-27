const NOTIFICATION_SOUND_PATH = '/sounds/arrangmentNotification.mp3';

class AudioService {
    private notificationAudio: HTMLAudioElement | null = null;
    private audioContext: AudioContext | null = null;
    private isMuted = false;
    private audioUnlocked = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.notificationAudio = new Audio(NOTIFICATION_SOUND_PATH);
            this.notificationAudio.preload = 'auto';
            
            const unlockOnInteraction = async () => {
                if (this.audioUnlocked) return;
                
                try {
                    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                    }
                    this.audioUnlocked = true;
                    console.log('[Audio] AudioContext unlocked on user interaction');
                } catch (e) {
                    console.warn('[Audio] Could not unlock audio:', e);
                }
                
                document.removeEventListener('click', unlockOnInteraction);
                document.removeEventListener('touchstart', unlockOnInteraction);
                document.removeEventListener('keydown', unlockOnInteraction);
            };
            
            document.addEventListener('click', unlockOnInteraction, { once: true });
            document.addEventListener('touchstart', unlockOnInteraction, { once: true });
            document.addEventListener('keydown', unlockOnInteraction, { once: true });
        }
    }

    async playNotification(): Promise<void> {
        if (this.isMuted) return;

        try {
            if (this.notificationAudio) {
                this.notificationAudio.muted = false;
                this.notificationAudio.currentTime = 0;
                try {
                    await this.notificationAudio.play();
                    return;
                } catch {
                    console.log('[Audio] Custom sound blocked by browser, using fallback beep');
                }
            }
            await this.playFallbackBeep();
        } catch (error) {
            console.warn('[Audio] Could not play notification:', error);
        }
    }

    private async playFallbackBeep(): Promise<void> {
        try {
            if (!this.audioContext || this.audioContext.state === 'closed') {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            if (this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                } catch {
                    // Try creating new context as fallback
                    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    await this.audioContext.resume();
                }
            }

            const ctx = this.audioContext;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.warn('[Audio] Could not play fallback beep:', e);
        }
    }

    setMuted(muted: boolean): void {
        this.isMuted = muted;
    }

    get muted(): boolean {
        return this.isMuted;
    }
}

export const audioService = new AudioService();
