// src/contexts/VolumeContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const VolumeContext = createContext();

export function VolumeProvider({ children }) {
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('global-volume');
    return saved !== null ? parseFloat(saved) : 0.5;
  });

  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('global-muted');
    return saved === 'true' || false;
  });

  const volumeBeforeMute = useRef(volume);

  // 实际输出给音频的有效音量（静音时为0）
  const effectiveVolume = isMuted ? 0 : volume;

  const setVolume = (newVolume) => {
    const clamped = Math.min(1, Math.max(0, newVolume));
    setVolumeState(clamped);
    // 调整音量时自动解除静音（可选，通常符合用户预期）
    if (isMuted && clamped > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      // 取消静音：恢复到静音前的音量
      setVolumeState(volumeBeforeMute.current);
      setIsMuted(false);
    } else {
      // 静音：记录当前音量并将输出归零
      volumeBeforeMute.current = volume;
      setIsMuted(true);
    }
  };

  // 持久化音量与静音状态
  useEffect(() => {
    localStorage.setItem('global-volume', volume);
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('global-muted', isMuted);
  }, [isMuted]);

  return (
    <VolumeContext.Provider value={{ 
      volume: effectiveVolume,      // 组件直接使用此值设置 audio.volume
      rawVolume: volume,            // 滑块显示的实际音量值（未静音时的值）
      setVolume,
      isMuted,
      toggleMute 
    }}>
      {children}
    </VolumeContext.Provider>
  );
}

export function useVolume() {
  return useContext(VolumeContext);
}