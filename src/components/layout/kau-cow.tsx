"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import styles from "./kau-cow.module.css";

export function KauCow() {
  const [announcement, setAnnouncement] = useState("");
  const audio = useRef<HTMLAudioElement>(null);
  const remainingPlays = useRef(0);
  const announcementTimer = useRef<number | undefined>(undefined);

  function playFromStart() {
    if (!audio.current) return;
    audio.current.currentTime = 0;
    void audio.current.play().catch(() => {
      remainingPlays.current = 0;
      setAnnouncement("Moo sound could not play.");
    });
  }

  function moo() {
    if (!audio.current) return;
    audio.current.pause();
    remainingPlays.current = 1;
    playFromStart();
    setAnnouncement("Moo moo!");
    window.clearTimeout(announcementTimer.current);
    announcementTimer.current = window.setTimeout(
      () => setAnnouncement(""),
      6000,
    );
  }

  function replayOnce() {
    if (remainingPlays.current !== 1) return;
    remainingPlays.current = 0;
    playFromStart();
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
      <audio
        aria-hidden="true"
        data-testid="kau-moo-audio"
        onEnded={replayOnce}
        preload="auto"
        ref={audio}
        src="/kau/cow-moo.m4a"
      />
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
