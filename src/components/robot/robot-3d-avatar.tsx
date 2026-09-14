import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Torus, Cylinder, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import type { AlenaState, AlenaEmotion } from "@/hooks/use-alena";

// Emotion → visual color mapping (matching the 2D version)
function getEmotionColor(emotion: AlenaEmotion): string {
  switch (emotion) {
    case "HAPPY":
    case "EXCITED":    return "#22d3ee";   // cyan
    case "CALM":
    case "NEUTRAL":    return "#818cf8";   // indigo
    case "FRIENDLY":
    case "ENCOURAGING":return "#34d399";   // emerald
    case "FOCUSED":
    case "CONFIDENT":  return "#60a5fa";   // blue
    case "THINKING":   return "#a78bfa";   // violet
    case "CONCERNED":  return "#fbbf24";   // amber
    case "ERROR":      return "#f87171";   // red
    default:           return "#818cf8";   // indigo
  }
}

interface RobotHeadProps {
  state: AlenaState;
  emotion: AlenaEmotion;
  colorHex: string;
}

function RobotHead({ state, emotion, colorHex }: RobotHeadProps) {
  const headRef = useRef<THREE.Group>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);

  // Convert hex to THREE.Color for smooth transitions if needed, but we'll just use the raw color string
  const emissiveColor = useMemo(() => new THREE.Color(colorHex), [colorHex]);
  
  // Animation loop
  useFrame((stateCtx) => {
    const time = stateCtx.clock.getElapsedTime();
    
    // Floating effect
    if (headRef.current) {
      headRef.current.position.y = Math.sin(time * 2) * 0.1;
      // Gentle breathing rotation when idle
      if (state === "IDLE") {
        headRef.current.rotation.y = Math.sin(time * 0.5) * 0.15;
        headRef.current.rotation.x = Math.sin(time * 0.7) * 0.05;
      } else if (state === "LISTENING") {
        // Look up slightly when listening
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.1, 0.1);
        headRef.current.rotation.y = Math.sin(time * 3) * 0.05;
      } else if (state === "THINKING" || state === "WORKING") {
        // Quick subtle tilts
        headRef.current.rotation.z = Math.sin(time * 8) * 0.05;
      } else {
        // Reset rotation
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.1);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.1);
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.1);
      }
    }

    // Rings spinning
    if (ringRef1.current && ringRef2.current) {
      const speed = state === "THINKING" || state === "WORKING" ? 2 : 0.5;
      ringRef1.current.rotation.x += 0.01 * speed;
      ringRef1.current.rotation.y += 0.02 * speed;
      
      ringRef2.current.rotation.x -= 0.015 * speed;
      ringRef2.current.rotation.z += 0.01 * speed;
    }

    // Eye blinking
    if (eyeLeftRef.current && eyeRightRef.current) {
      // Basic blink logic
      const blink = Math.sin(time * 4) > 0.95 ? 0.1 : 1; 
      let scaleY = blink;
      
      if (emotion === "HAPPY" || emotion === "EXCITED" || state === "COMPLETED") {
        // Happy squint
        scaleY = 0.3;
      } else if (state === "SPEAKING") {
        // Pulse eyes when speaking
        scaleY = 0.5 + Math.sin(time * 15) * 0.3;
      }
      
      eyeLeftRef.current.scale.setY(scaleY);
      eyeRightRef.current.scale.setY(scaleY);
    }
  });

  const materialConfig = {
    color: "#1e1e2e",
    roughness: 0.2,
    metalness: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  };

  return (
    <group ref={headRef}>
      {/* Core Sphere (Head) */}
      <Sphere args={[1, 64, 64]}>
        <meshPhysicalMaterial {...materialConfig} />
      </Sphere>

      {/* Holographic glowing rings */}
      <Torus ref={ringRef1} args={[1.2, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={2} transparent opacity={0.6} />
      </Torus>
      <Torus ref={ringRef2} args={[1.3, 0.01, 16, 100]} rotation={[0, Math.PI / 4, 0]}>
        <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={1.5} transparent opacity={0.4} />
      </Torus>

      {/* Eyes */}
      <group position={[0, 0.2, 0.9]}>
        {/* Left Eye */}
        <Cylinder ref={eyeLeftRef} args={[0.15, 0.15, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]} position={[-0.35, 0, 0]}>
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={2} />
        </Cylinder>
        {/* Right Eye */}
        <Cylinder ref={eyeRightRef} args={[0.15, 0.15, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0.35, 0, 0]}>
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={2} />
        </Cylinder>
      </group>
      
      {/* Small mouth indicator */}
      {(state === "SPEAKING" || state === "LISTENING") && (
        <Cylinder args={[0.1, 0.1, 0.02, 16]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.3, 0.95]}>
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={1} />
        </Cylinder>
      )}

      {/* Antenna */}
      <group position={[0, 1, 0]}>
        <Cylinder args={[0.02, 0.05, 0.3, 16]} position={[0, 0.15, 0]}>
          <meshStandardMaterial color="#333" metalness={0.8} />
        </Cylinder>
        <Sphere args={[0.08, 16, 16]} position={[0, 0.3, 0]}>
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={state !== "IDLE" ? 2 : 0.5} />
        </Sphere>
      </group>
    </group>
  );
}

interface Alena3DAvatarProps {
  state: AlenaState;
  emotion: AlenaEmotion;
  size?: "sm" | "md" | "lg";
}

export function Alena3DAvatar({ state, emotion, size = "md" }: Alena3DAvatarProps) {
  const dim = size === "sm" ? 52 : size === "lg" ? 104 : 72;
  const color = getEmotionColor(emotion);

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center rounded-2xl select-none overflow-hidden"
      style={{
        width: dim,
        height: dim,
        background: "linear-gradient(145deg, #12121f, #0d0d1a)",
        border: `1px solid ${color}33`,
        boxShadow: `0 0 20px -5px ${color}66`,
        transition: "border-color 0.5s, box-shadow 0.5s",
        flexShrink: 0,
      }}
    >
      <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color={color} />
        
        <React.Suspense fallback={null}>
          <RobotHead state={state} emotion={emotion} colorHex={color} />
        </React.Suspense>
      </Canvas>
    </motion.div>
  );
}
