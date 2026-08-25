/**
 * Local identity. No wallet, no account, no server.
 *
 * Exodus 16 rations manna at one omer per person, so the interface hands out
 * exactly one omer per device: a handle and the epoch you first drew it. The
 * handle is a pure function of a single random id, so it never has to be
 * trusted from storage and can always be recomputed.
 */

const STORAGE_KEY = "omer.identity.v1";

export type Identity = {
  id: string;
  handle: string;
  genesisEpoch: number;
  createdAt: number;
};

function randomId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Every handle carries the name. The suffix is the first four hex characters of
 * the id, so it is the part that tells two holders apart, and it is stable for
 * as long as the id is.
 */
export function handleFor(id: string): string {
  return `OMER-${id.slice(0, 4).toUpperCase()}`;
}

export function loadIdentity(): Identity | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Identity;
    if (!parsed?.id) return null;
    return { ...parsed, handle: handleFor(parsed.id) };
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
