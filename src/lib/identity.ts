/**
 * Local identity. No wallet, no account, no server.
 *
 * Exodus 16 rations manna at one omer per person, so the interface hands out
 * exactly one omer per browser: a handle, a sigil derived from it, and the
 * epoch you first drew. Everything is deterministic from a single random id,
 * which means the same id always renders the same face.
 */

const STORAGE_KEY = "omer.identity.v1";

/** Desert provision and orbital mechanics, which is the whole register here. */
const WORDS = [
  "MANNA", "QUAIL", "OMER", "EPHAH", "SINAI", "HOREB", "MARAH", "ELIM",
  "PARAN", "KADESH", "NEBO", "PISGAH", "ZIN", "SHUR", "ETHAM", "MIGDOL",
  "UMBRA", "LIMB", "APSIS", "NODE", "PERIGEE", "APOGEE", "EPOCH", "VERNAL",
  "ZENITH", "NADIR", "EMBER", "CINDER", "CORONA", "AUREOLE", "ORBIT", "TRANSIT",
];

export type Identity = {
  id: string;
  handle: string;
  genesisEpoch: number;
  createdAt: number;
};

/** FNV-1a. Small, stable, and good enough to spread ids across the word list. */
export function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function randomId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function handleFor(id: string): string {
  const h = hash(id);
  const word = WORDS[h % WORDS.length];
  return `${word}-${id.slice(0, 4).toUpperCase()}`;
}

export function loadIdentity(): Identity | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Identity;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

export function drawIdentity(currentEpoch: number): Identity {
  const id = randomId();
  const identity: Identity = {
    id,
    handle: handleFor(id),
    genesisEpoch: currentEpoch,
    createdAt: Date.now(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    /* private mode, the identity just will not survive the tab */
  }
  return identity;
}

export function clearIdentity() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * Derived shape parameters for the sigil. Same id, same face, on any machine.
 */
export function sigilTraits(id: string) {
  const h = hash(id);
  return {
    sliceAngle: h % 360,
    tickCount: 5 + ((h >> 9) % 7),
    tickPhase: (h >> 5) % 60,
    coreRadius: 2 + ((h >> 17) % 3),
    hasInnerRing: ((h >> 21) & 1) === 1,
  };
}
