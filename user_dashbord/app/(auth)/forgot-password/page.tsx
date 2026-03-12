"use client";

import { useState, useEffect } from "react";
import {
  motion,
  useSpring,
  useTransform,
  useMotionValue,
  AnimatePresence,
  MotionValue,
} from "framer-motion";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Copy all animation constants and components from register page
const SP_SLOW = { stiffness: 22, damping: 16, mass: 1.8 };
const SP_MED = { stiffness: 50, damping: 18, mass: 1.0 };
const SP_FAST = { stiffness: 100, damping: 20, mass: 0.6 };
const SP_EYE = { stiffness: 180, damping: 18, mass: 0.4 };
const SP_SPRING = { type: "spring" as const, stiffness: 260, damping: 20 };

const BRAND = {
  primary: "#7c3aed",
  primaryDark: "#5b21b6",
  primaryLight: "#a78bfa",
  accent: "#ec4899",
  accentLight: "#f472b6",
  glow: "#7c3aed33",
  glowStrong: "#7c3aed55",
};

function useCursor() {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);
  return { rawX, rawY };
}

function FloatingParticles() {
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; size: number; duration: number; delay: number; shape: number; color: string }[]
  >([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 2,
        duration: Math.random() * 10 + 8,
        delay: Math.random() * 5,
        shape: i % 4,
        color: ["#7c3aed22", "#ec489933", "#f59e0b22", "#10b98122"][i % 4],
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [0, -40, 0, 30, 0],
            x: [0, 20, -15, 10, 0],
            opacity: [0.1, 0.5, 0.3, 0.6, 0.1],
            scale: [1, 1.4, 0.8, 1.2, 1],
            rotate: p.shape === 2 ? [0, 180, 360] : [0, 90, 180],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {p.shape === 0 && (
            <div className="rounded-full" style={{ width: p.size, height: p.size, backgroundColor: p.color }} />
          )}
          {p.shape === 1 && (
            <svg width={p.size + 6} height={p.size + 6} viewBox="0 0 16 16">
              <path d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z" fill={p.color} />
            </svg>
          )}
          {p.shape === 2 && (
            <div style={{ width: p.size, height: p.size, backgroundColor: p.color, transform: "rotate(45deg)", borderRadius: 2 }} />
          )}
          {p.shape === 3 && (
            <div className="rounded-full" style={{ width: p.size * 1.2, height: p.size, border: `1.5px solid ${p.color}`, backgroundColor: "transparent" }} />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function Sparkle({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 1, scale: 0 }}
      animate={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
        <motion.div
          key={deg}
          className="absolute"
          style={{
            width: 3, height: 3, borderRadius: "50%", backgroundColor: BRAND.accentLight,
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: Math.cos((deg * Math.PI) / 180) * 20,
            y: Math.sin((deg * Math.PI) / 180) * 20,
            opacity: 0,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
}

function Eye({ rawX, rawY, size = 14, pupilSize = 7, white = true }: { rawX: MotionValue<number>; rawY: MotionValue<number>; size?: number; pupilSize?: number; white?: boolean }) {
  const ex = useSpring(useTransform(rawX, [-1, 1], [-2.5, 2.5]), SP_EYE);
  const ey = useSpring(useTransform(rawY, [-1, 1], [-1.8, 1.8]), SP_EYE);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const schedBlink = () => {
      const t = 2000 + Math.random() * 4000;
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 120);
        schedBlink();
      }, t);
    };
    schedBlink();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className="rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{
        width: size,
        height: blink ? size * 0.15 : size,
        backgroundColor: white ? "#fff" : "#1a1a1a",
        border: white ? "none" : "1.5px solid #fff",
        transition: "height 0.08s ease",
        borderRadius: "50%",
      }}
    >
      {!blink && (
        <motion.div
          style={{
            x: ex, y: ey,
            width: pupilSize, height: pupilSize,
            borderRadius: "50%",
            backgroundColor: white ? "#111" : "#fff",
            flexShrink: 0,
          }}
        />
      )}
    </div>
  );
}

function Smile({ sad = false, worried = false, size = 16, color = "#111" }) {
  if (worried) {
    return (
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        <path
          d={`M2 ${size * 0.4} Q${size * 0.3} ${size * 0.1} ${size * 0.5} ${size * 0.4} Q${size * 0.7} ${size * 0.7} ${size - 2} ${size * 0.4}`}
          stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"
        />
      </svg>
    );
  }
  if (sad) {
    return (
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        <path d={`M2 ${size * 0.5} Q${size / 2} 2 ${size - 2} ${size * 0.5}`}
          stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
      <path d={`M2 2 Q${size / 2} ${size * 0.65} ${size - 2} 2`}
        stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

type CharProps = { rawX: MotionValue<number>; rawY: MotionValue<number>; mood: string; introReady: boolean };

function DesignerChar({ rawX, rawY, mood, introReady }: CharProps) {
  const bx = useSpring(useTransform(rawX, [-1, 1], [-8, 8]), SP_SLOW);
  const by = useSpring(useTransform(rawY, [-1, 1], [-6, 6]), SP_SLOW);

  const isHiding = mood === "hiding";
  const isWorried = mood === "worried" || mood === "peeking";
  const isSad = mood === "sad";

  return (
    <motion.div
      style={{ x: bx, y: by, transformOrigin: "bottom center" }}
      initial={{ y: 90, opacity: 0, scale: 0.5 }}
      animate={introReady ? { y: 0, opacity: 1, scale: 1 } : {}}
      transition={{ delay: 0.1, ...SP_SPRING }}
      className="absolute bottom-0 left-0"
    >
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <div className="relative" style={{ width: 110, height: 180 }}>
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: 76, height: 100, borderRadius: "24px 24px 8px 8px",
            background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
            zIndex: 2,
          }}>
            <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", width: 20, height: 2, background: "rgba(255,255,255,0.2)" }} />
          </div>

          <motion.div
            animate={{ rotate: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: "top right", position: "absolute", bottom: 60, left: -6, width: 14, height: 40, borderRadius: 7, background: "#7c3aed", zIndex: 1 }}
          />
          <motion.div
            animate={{ rotate: [-20, -10, -20] }}
            style={{ transformOrigin: "top left", position: "absolute", bottom: 65, right: -4, width: 14, height: 45, borderRadius: 7, background: "#7c3aed", zIndex: 3 }}
          >
            <div style={{ position: "absolute", bottom: -10, left: -4, width: 4, height: 24, background: "#111", borderRadius: 2, transform: "rotate(45deg)" }}>
              <div style={{ position: "absolute", bottom: 0, width: 4, height: 4, background: "#8b5cf6" }} />
            </div>
          </motion.div>

          <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 66, height: 66, zIndex: 5 }}>
            <div style={{ width: 66, height: 66, borderRadius: "50%", backgroundColor: "#fde68a", border: "3px solid #6d28d9", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, width: "100%", height: 24, background: "#1f2937" }} />
              <div style={{ position: "absolute", top: 28, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  {isHiding ? <div style={{ width: 12, height: 2, background: "#4b5563" }} /> : <Eye rawX={rawX} rawY={rawY} size={14} pupilSize={7} white={false} />}
                  {isHiding ? <div style={{ width: 12, height: 2, background: "#4b5563" }} /> : <Eye rawX={rawX} rawY={rawY} size={14} pupilSize={7} white={false} />}
                </div>
                <Smile sad={isSad} worried={isWorried} size={14} color="#6d28d9" />
              </div>
            </div>
          </div>

          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [0, -15, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8 }}
              style={{
                position: "absolute", top: 40 + i * 30, [i % 2 === 0 ? "left" : "right"]: -25,
                width: 14, height: 14, borderRadius: "50%",
                background: ["#ec4899", "#f43f5e", "#fbbf24"][i],
                boxShadow: `0 0 10px ${["#ec489944", "#f43f5e44", "#fbbf2444"][i]}`
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function GrowthChar({ rawX, rawY, mood, introReady }: CharProps) {
  const bx = useSpring(useTransform(rawX, [-1, 1], [-12, 12]), SP_MED);
  const by = useSpring(useTransform(rawY, [-1, 1], [-8, 8]), SP_MED);

  const isHiding = mood === "hiding";
  const isWorried = mood === "worried" || mood === "peeking";
  const isSad = mood === "sad";

  return (
    <motion.div
      style={{ x: bx, y: by }}
      initial={{ y: 110, opacity: 0, scale: 0.4 }}
      animate={introReady ? { y: 0, opacity: 1, scale: 1 } : {}}
      transition={{ delay: 0.25, ...SP_SPRING }}
      className="absolute bottom-0 left-0"
    >
      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}>
        <div className="relative" style={{ width: 100, height: 150 }}>
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: 70, height: 110, borderRadius: "35px 35px 10px 10px",
            background: "linear-gradient(180deg, #f3f4f6, #d1d5db)",
            border: "2px solid #ef4444",
            zIndex: 2, overflow: "hidden"
          }}>
            <div style={{
              position: "absolute", top: 25, left: "50%", transform: "translateX(-50%)",
              width: 40, height: 40, borderRadius: "50%", background: "#1f2937", border: "4px solid #9ca3af",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {isHiding ? <div style={{ width: 20, height: 2, background: "#60a5fa" }} /> : <Eye rawX={rawX} rawY={rawY} size={25} pupilSize={12} white={true} />}
            </div>
            <div style={{ position: "absolute", bottom: 15, left: 15, right: 15, height: 20, display: "flex", alignItems: "flex-end", gap: 3 }}>
              {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
                <motion.div
                  key={i} animate={{ height: [`${h * 100}%`, `${Math.min(h * 1.5, 1) * 100}%`, `${h * 100}%`] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  style={{ flex: 1, background: "#ef4444", borderRadius: "2px 2px 0 0" }}
                />
              ))}
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 25, height: 40, background: "#b91c1c", borderRadius: "20px 0 0 5px", zIndex: 1 }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 25, height: 40, background: "#b91c1c", borderRadius: "0 20px 5px 0", zIndex: 1 }} />

          <motion.div
            animate={{ scaleY: [1, 1.5, 0.8, 1.2, 1], opacity: [0.8, 1, 0.7, 1] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            style={{ position: "absolute", bottom: -25, left: "50%", transform: "translateX(-50%)", width: 30, height: 35, background: "linear-gradient(180deg, #f59e0b, transparent)", borderRadius: "50% 50% 20% 20%", zIndex: 0 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function SocialChar({ rawX, rawY, mood, introReady }: CharProps) {
  const bx = useSpring(useTransform(rawX, [-1, 1], [-15, 15]), SP_SLOW);
  const by = useSpring(useTransform(rawY, [-1, 1], [-10, 10]), SP_SLOW);

  const isHiding = mood === "hiding";
  const isWorried = mood === "worried" || mood === "peeking";
  const isSad = mood === "sad";

  return (
    <motion.div
      style={{ x: bx, y: by }}
      initial={{ y: 80, opacity: 0, scale: 0.3 }}
      animate={introReady ? { y: 0, opacity: 1, scale: 1 } : {}}
      transition={{ delay: 0.4, ...SP_SPRING }}
      className="absolute bottom-0 left-0"
    >
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
        <div className="relative" style={{ width: 100, height: 140 }}>
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: 80, height: 120, borderRadius: 16, border: "4px solid #1f2937",
            background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
            zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <div style={{ display: "flex", gap: 14 }}>
              {isHiding ? <div style={{ width: 14, height: 2, background: "#fff" }} /> : <Eye rawX={rawX} rawY={rawY} size={16} pupilSize={8} white={true} />}
              {isHiding ? <div style={{ width: 14, height: 2, background: "#fff" }} /> : <Eye rawX={rawX} rawY={rawY} size={16} pupilSize={8} white={true} />}
            </div>
            <Smile sad={isSad} worried={isWorried} size={16} color="#fff" />

            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: "rgba(255,255,255,0.3)" }} />)}
            </div>
          </div>

          {["❤️", "👍", "✨"].map((emoji, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -20, 0], opacity: [0.7, 1, 0.7], scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}
              style={{
                position: "absolute", top: 20 + i * 30, [i % 2 === 0 ? "left" : "right"]: -20,
                fontSize: 18, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StrategistChar({ rawX, rawY, mood, introReady }: CharProps) {
  const bx = useSpring(useTransform(rawX, [-1, 1], [-18, 18]), SP_FAST);
  const by = useSpring(useTransform(rawY, [-1, 1], [-12, 12]), SP_FAST);

  const isHiding = mood === "hiding";
  const isWorried = mood === "worried" || mood === "peeking";
  const isSad = mood === "sad";

  return (
    <motion.div
      style={{ x: bx, y: by }}
      initial={{ y: 70, opacity: 0, scale: 0.3, rotate: -10 }}
      animate={introReady ? { y: 0, opacity: 1, scale: 1, rotate: 0 } : {}}
      transition={{ delay: 0.55, ...SP_SPRING }}
      className="absolute bottom-0 left-0"
    >
      <motion.div animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <div className="relative" style={{ width: 100, height: 160 }}>
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: 82, height: 130, borderRadius: "10px 10px 40px 40px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            border: "3px solid #064e3b",
            zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20
          }}>
            <div style={{ display: "flex", gap: 3, alignItems: "center", background: "#f3f4f6", padding: "4px 8px", borderRadius: 20, border: "2px solid #064e3b", zIndex: 5 }}>
              {isHiding ? <div style={{ width: 12, height: 2, background: "#10b981" }} /> : <Eye rawX={rawX} rawY={rawY} size={15} pupilSize={8} white={false} />}
              <div style={{ width: 6, height: 2, background: "#064e3b" }} />
              {isHiding ? <div style={{ width: 12, height: 2, background: "#10b981" }} /> : <Eye rawX={rawX} rawY={rawY} size={15} pupilSize={8} white={false} />}
            </div>
            <Smile sad={isSad} worried={isWorried} size={14} color="#fff" />

            <motion.div
              animate={{ rotate: [-10, 10, -10] }}
              style={{ position: "absolute", right: -25, top: 40, transformOrigin: "left center" }}
            >
              <div style={{ width: 30, height: 8, background: "#065f46" }} />
              <div style={{ position: "absolute", right: -30, top: -20, width: 40, height: 40, borderRadius: "50%", border: "4px solid #374151", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(2px)" }} />
            </motion.div>

            <div style={{ marginTop: 20, width: 40, height: 40, border: "2px solid #fff", borderRadius: 8, overflow: "hidden" }}>
              <svg viewBox="0 0 40 40">
                <path d="M5 35 L5 10 L15 25 L35 5" fill="none" stroke="#fff" strokeWidth="3" />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Illustration({ rawX, rawY, mood, introReady }: CharProps) {
  const gx = useSpring(useTransform(rawX, [-1, 1], [-5, 5]), SP_SLOW);
  const gy = useSpring(useTransform(rawY, [-1, 1], [-3, 3]), SP_SLOW);

  return (
    <motion.div style={{ x: gx, y: gy, width: 420, height: 300 }} className="relative flex items-end">
      <div style={{ position: "absolute", left: 45, bottom: 0, zIndex: 10 }}>
        <DesignerChar rawX={rawX} rawY={rawY} mood={mood} introReady={introReady} />
      </div>
      <div style={{ position: "absolute", left: 120, bottom: 0, zIndex: 15, transform: "scale(0.92)", transformOrigin: "bottom" }}>
        <StrategistChar rawX={rawX} rawY={rawY} mood={mood} introReady={introReady} />
      </div>
      <div style={{ position: "absolute", left: 200, bottom: 0, zIndex: 12, transform: "scale(0.85)", transformOrigin: "bottom" }}>
        <GrowthChar rawX={rawX} rawY={rawY} mood={mood} introReady={introReady} />
      </div>
      <div style={{ position: "absolute", left: 275, bottom: 0, zIndex: 20, transform: "scale(0.78)", transformOrigin: "bottom" }}>
        <SocialChar rawX={rawX} rawY={rawY} mood={mood} introReady={introReady} />
      </div>
    </motion.div>
  );
}

function FloatingInput({
  label, id, type = "text", value, onChange, onFocus, onBlur, delay, error = false
}: {
  label: string; id: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onFocus?: () => void; onBlur?: () => void; delay: number; error?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <label htmlFor={id}
        className="absolute left-0 pointer-events-none transition-all duration-200 font-medium"
        style={{
          top: active ? 0 : "0.85rem",
          fontSize: active ? "0.65rem" : "0.875rem",
          letterSpacing: active ? "0.1em" : "0",
          textTransform: active ? "uppercase" : "none",
          color: error ? "#ef4444" : focused ? BRAND.primary : "#9ca3af",
        }}
      >
        {label}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={onChange}
        onFocus={() => { setFocused(true); onFocus?.(); }}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        className="w-full bg-white text-gray-900 text-sm outline-none"
        style={{ paddingTop: "1.4rem", paddingBottom: "0.375rem", borderBottom: `2px solid ${error ? "#ef4444" : focused ? BRAND.primary : "#e5e7eb"}` }}
      />
      <motion.div
        animate={{ scaleX: focused ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", position: "absolute", bottom: 0, left: 0, height: 2, background: error ? "#ef4444" : "#3b82f6", transformOrigin: "left" }}
      />
    </motion.div>
  );
}

function IntroOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 1.1 }}
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%)`,
      }}
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -180, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 1.5, rotate: 180, opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <rect x="10" y="10" width="80" height="80" rx="16" fill="white" fillOpacity="0.2" />
          <circle cx="50" cy="50" r="25" stroke="white" strokeWidth="4" fill="none" />
          <motion.circle
            cx="50" cy="50" r="25"
            stroke="white" strokeWidth="4" fill="none"
            strokeDasharray="160"
            initial={{ strokeDashoffset: 160 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { rawX, rawY } = useCursor();

  const [showIntro, setShowIntro] = useState(true);
  const [introReady, setIntroReady] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);

  const [email, setEmail] = useState("");
  const [mood, setMood] = useState<string>("neutral");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const addSparkle = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const s = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
    setSparkles(prev => [...prev, s]);
    setTimeout(() => setSparkles(prev => prev.filter(sp => sp.id !== s.id)), 700);
  };

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async () => {
    setServerError("");
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      setMood("sad");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      setMood("sad");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      setResetSent(true);
      setMood("neutral");
    } catch (err: any) {
      setMood("sad");
      setServerError(err?.response?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (resetSent) {
    return (
      <div className="min-h-screen w-full bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl p-10 text-center shadow-2xl"
        >
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Check Your Email
          </h2>
          <p className="text-gray-600 mb-6">
            We&apos;ve sent a password reset link to<br />
            <span className="font-semibold text-gray-900">{email}</span>
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Click the link in the email to reset your password.
          </p>
          <div className="flex gap-2 justify-center mb-6">
            <Button
              variant="outline"
              onClick={() => window.open(`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email)}`, '_blank')}
              className="text-sm"
            >
              Open Gmail
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://outlook.live.com/mail/0/inbox/', '_blank')}
              className="text-sm"
            >
              Open Outlook
            </Button>
          </div>
          <button
            onClick={() => setResetSent(false)}
            className="text-sm font-medium hover:underline"
            style={{ color: BRAND.primary }}
          >
            Didn&apos;t receive the email? Try again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-950 flex items-center justify-center p-4 overflow-hidden relative">
      <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.25, 0.15], x: [0, 40, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: BRAND.primary }} />
      <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1], x: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[80px] pointer-events-none"
        style={{ backgroundColor: BRAND.accent }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex"
        style={{ minHeight: 560, boxShadow: `0 25px 80px -12px ${BRAND.glow}, 0 10px 40px -8px rgba(0,0,0,0.3)` }}
        onClick={addSparkle}
      >
        {sparkles.map(s => <Sparkle key={s.id} x={s.x} y={s.y} />)}

        <AnimatePresence>
          {showIntro && (
            <IntroOverlay onDone={() => { setShowIntro(false); setIntroReady(true); }} />
          )}
        </AnimatePresence>

        <div className="hidden md:flex w-[46%] relative items-end justify-center overflow-hidden"
          style={{ background: "linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)" }}
        >
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `radial-gradient(circle, ${BRAND.primary}20 1px, transparent 1px)`, backgroundSize: "24px 24px" }}
          />
          {/* <FloatingParticles /> */}
          <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
            style={{ background: `linear-gradient(180deg, ${BRAND.glow} 0%, transparent 100%)` }} />
          <div className="pb-8 w-full flex justify-center">
            <Illustration rawX={rawX} rawY={rawY} mood={mood} introReady={introReady} />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-10 md:px-14 py-12 relative">
          <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none opacity-[0.04] rounded-full"
            style={{ background: `radial-gradient(circle, ${BRAND.primary} 0%, transparent 70%)` }} />

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }} className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              width={120}
              height={40}
              alt="Murphys Technology Logo"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-9">
                       <h1 className="text-[1.85rem] font-bold text-blue-600 tracking-tight">

              Forgot Password?
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-gray-400 mt-1.5"
            >
              Enter your email to receive a reset link
            </motion.p>
          </motion.div>

          <div className="flex flex-col gap-7">
            <div>
              <FloatingInput
                label="Email" id="email" type="email" value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                onFocus={() => setMood("neutral")}
                onBlur={() => {
                  if (email.trim() && !isValidEmail(email)) {
                    setEmailError("Please enter a valid email address");
                  }
                }}
                delay={0.28}
                error={!!emailError}
              />
              <AnimatePresence>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-red-500 text-xs mt-1.5 ml-1"
                  >
                    {emailError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52, duration: 0.45 }}
              whileHover={{ scale: 1.025, boxShadow: `0 10px 40px rgba(59, 130, 246, 0.3)` }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              type="button"
              className="w-full text-white py-4 rounded-2xl cursor-pointer text-sm font-semibold tracking-wide relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)` }}
            >
              <motion.div
                className="absolute inset-0 opacity-0"
                whileHover={{ opacity: 1 }}
                style={{ background: `linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)` }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10">
                {loading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : "Send Reset Link"}
              </span>
            </motion.button>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="w-full bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-2xl text-sm font-medium flex items-center gap-2.5"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="text-center text-xs text-gray-400 mt-8">
            Remember your password?{" "}
            <Link href="/login">
              <motion.button
                whileHover={{ color: BRAND.primary }}
                type="button"
                className="text-blue-600 cursor-pointer font-semibold hover:underline underline-offset-2 transition-colors"
              >
                Sign In
              </motion.button>
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
