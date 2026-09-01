"use client";

import { useCallback, useEffect, useRef } from "react";
import { Player } from "@lordicon/react";
import { useReducedMotion } from "framer-motion";

export type LordIconTrigger = "hover" | "once" | "loop" | "manual";

export type LordIconPlayerProps = {
  icon: object;
  size?: number;
  trigger?: LordIconTrigger;
  state?: string;
  colors?: string;
  colorize?: string;
  className?: string;
  /** Replay when this value changes (skips the initial mount). */
  playKey?: string | number | boolean;
};

export default function LordIconPlayer({
  icon,
  size = 32,
  trigger = "once",
  state,
  colors,
  colorize,
  playKey,
}: LordIconPlayerProps) {
  const playerRef = useRef<Player>(null);
  const readyRef = useRef(false);
  const playKeyRef = useRef(playKey);
  const baselinePlayKeyRef = useRef(playKey);
  const reduceMotion = useReducedMotion();
  playKeyRef.current = playKey;

  const freeze = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (trigger === "hover" || trigger === "manual") {
      player.goToFirstFrame();
      return;
    }
    player.goToLastFrame();
  }, [trigger]);

  const play = useCallback(() => {
    const player = playerRef.current;
    if (!readyRef.current || !player) return;
    if (reduceMotion) {
      freeze();
      return;
    }
    player.playFromBeginning();
  }, [freeze, reduceMotion]);

  const onReady = useCallback(() => {
    readyRef.current = true;
    baselinePlayKeyRef.current = playKeyRef.current;
    if (reduceMotion) {
      freeze();
      return;
    }
    if (trigger === "once" || trigger === "loop") {
      playerRef.current?.playFromBeginning();
      return;
    }
    playerRef.current?.goToFirstFrame();
  }, [freeze, reduceMotion, trigger]);

  useEffect(() => {
    if (playKey === undefined || !readyRef.current) return;
    if (playKey === baselinePlayKeyRef.current) return;
    baselinePlayKeyRef.current = playKey;
    play();
  }, [play, playKey]);

  return (
    <span
      className="inline-flex"
      onMouseEnter={() => {
        if (trigger === "hover") play();
      }}
    >
      <Player
        ref={playerRef}
        icon={icon}
        size={size}
        state={state}
        colors={colors}
        colorize={colorize}
        onReady={onReady}
        onComplete={() => {
          if (trigger === "loop" && !reduceMotion) {
            playerRef.current?.playFromBeginning();
          }
        }}
      />
    </span>
  );
}
