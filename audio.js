/*
[INPUT]: 依赖浏览器 Web Audio API 和 app.js 传入的抽卡、发牌、翻牌事件
[OUTPUT]: 对外提供 window.TodayCardAudio.playDrawStart、playDealCard、playFlipReveal 三个 8-bit 声音入口
[POS]: 项目声音层，只合成抽卡仪式音效，不拥有卡片数据、DOM 结构和视觉状态
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
*/
(function () {
  const MASTER = 0.34;
  const PITCH = 1.5;
  const HERO_NOTES = [261.63, 329.63, 392, 523.25];

  let audioContext;

  function getContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return undefined;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }
    return audioContext;
  }

  function cleanup(source, nodes) {
    source.addEventListener('ended', () => {
      nodes.forEach((node) => {
        try {
          node.disconnect();
        } catch {
          /* 浏览器可能已经回收节点连接。 */
        }
      });
    }, { once: true });
  }

  function connectThroughGain(ctx, source, start, duration, volume) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    return gain;
  }

  function playTone(ctx, start, frequency, duration, volume, type) {
    const oscillator = ctx.createOscillator();
    const gain = connectThroughGain(ctx, oscillator, start, duration, volume);
    oscillator.type = type || 'square';
    oscillator.frequency.setValueAtTime(frequency * PITCH, start);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
    cleanup(oscillator, [oscillator, gain]);
  }

  function playSweep(ctx, start, from, to, duration, volume) {
    const oscillator = ctx.createOscillator();
    const gain = connectThroughGain(ctx, oscillator, start, duration, volume);
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(from * PITCH, start);
    oscillator.frequency.exponentialRampToValueAtTime(to * PITCH, start + duration);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
    cleanup(oscillator, [oscillator, gain]);
  }

  function playNoise(ctx, start, duration, volume, frequency, q) {
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.18));
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;
    gain.gain.value = volume;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(start);
    cleanup(source, [source, filter, gain]);
  }

  function playArpeggio(ctx, start, notes, gap, duration, volume) {
    notes.forEach((frequency, index) => {
      const hold = index === notes.length - 1 ? duration * 1.7 : duration;
      playTone(ctx, start + index * gap, frequency, hold, volume, 'square');
    });
  }

  function playDrawStart() {
    const ctx = getContext();
    if (!ctx) return;
    const start = ctx.currentTime + 0.006;
    playNoise(ctx, start, 0.018, MASTER * 0.34, 2200, 2.8);
    playSweep(ctx, start + 0.01, 130.81, 392, 0.18, MASTER * 0.18);
    playArpeggio(ctx, start + 0.035, [196, 246.94, 329.63], 0.055, 0.1, MASTER * 0.18);
  }

  function playDealCard(detail) {
    const ctx = getContext();
    if (!ctx) return;
    const index = Number(detail && detail.index) || 0;
    const start = ctx.currentTime + 0.004;
    const pitch = [523.25, 587.33, 659.25, 783.99][index % 4];
    playNoise(ctx, start, 0.024, MASTER * 0.28, 1700 + index * 420, 3.4);
    playTone(ctx, start + 0.012, pitch, 0.055, MASTER * 0.12, 'square');
  }

  function playFlipReveal() {
    const ctx = getContext();
    if (!ctx) return;
    const start = ctx.currentTime + 0.006;
    playNoise(ctx, start, 0.012, MASTER * 0.25, 3600, 2);
    playSweep(ctx, start, 196, 392, 0.16, MASTER * 0.16);
    playArpeggio(ctx, start + 0.04, HERO_NOTES, 0.064, 0.12, MASTER * 0.28);
    playArpeggio(ctx, start + 0.23, [1046.5, 1318.51], 0.045, 0.08, MASTER * 0.14);
  }

  window.TodayCardAudio = {
    playDrawStart,
    playDealCard,
    playFlipReveal
  };
}());
