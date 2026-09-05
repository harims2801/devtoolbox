"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import styles from "./kau-cow.module.css";

type AudioContextConstructor = typeof AudioContext;

function getAudioContext(): AudioContextConstructor | undefined {
  return window.AudioContext;
}

export function playCowSound() {
  const AudioContextClass = getAudioContext();
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const start = context.currentTime;

  [0, 0.72].forEach((offset, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(index ? 112 : 122, start + offset);
    oscillator.frequency.exponentialRampToValueAtTime(
      index ? 72 : 78,
      start + offset + 0.58,
    );
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.16, start + offset + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.64);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start + offset);
    oscillator.stop(start + offset + 0.66);
  });

  window.setTimeout(() => void context.close(), 1600);
}

export function KauCow() {
  const [announcement, setAnnouncement] = useState("");
  const announcementTimer = useRef<number | undefined>(undefined);

  function moo() {
    playCowSound();
    setAnnouncement("Moo moo!");
    window.clearTimeout(announcementTimer.current);
    announcementTimer.current = window.setTimeout(
      () => setAnnouncement(""),
      1800,
    );
  }

  return (
    <div aria-label="Kau's running track" className={styles.track}>
      <button
        aria-label="Kau the running cow — play moo moo"
        className={styles.runner}
        onClick={moo}
        title="Catch Kau for a moo!"
        type="button"
      >
        <span aria-hidden="true" className={styles.bubble}>
          Hi Kau
        </span>
        <Image
          alt=""
          className={styles.cow}
          height={52}
          priority
          src="/kau/running-cow.webp"
          width={78}
        />
      </button>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
