'use client';

import { motion } from 'framer-motion';

export interface PatientProfile {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  registeredBy: string;
  selfRegistered: boolean;
}

interface PatientProfilePickerProps {
  profiles: PatientProfile[];
  onSelect: (profile: PatientProfile) => void;
}

// Deterministic, decorative-only avatar tint so cards feel distinct at a
// glance — not tied to any clinical meaning (unlike DR-grade colors elsewhere).
const AVATAR_TONES = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];

function toneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/** Card grid used to pick which patient profile on a shared phone number to sign in as. */
export default function PatientProfilePicker({ profiles, onSelect }: PatientProfilePickerProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {profiles.map((p, i) => (
        <motion.button
          key={p.id}
          type="button"
          onClick={() => onSelect(p)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="text-left surface rounded-xl p-4 hover:border-[var(--brand-accent)]/40 transition-colors duration-300"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br ${toneFor(p.id)} flex items-center justify-center text-white text-sm font-bold`}>
              {p.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{p.name}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
