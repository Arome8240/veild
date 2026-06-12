/**
 * Client-side validation helpers that mirror contract constraints.
 * Use these to show inline errors before submitting a transaction.
 */

/** Max username length in VeildRegistry */
export const MAX_USERNAME_LEN = 32;
/** Max bio length in VeildRegistry */
export const MAX_BIO_LEN = 160;
/** Min username length */
export const MIN_USERNAME_LEN = 3;

/** Returns `null` if valid, or an error string. */
export function validateUsername(username: string): string | null {
  if (!username) return "Username is required";
  if (username.length < MIN_USERNAME_LEN) return `At least ${MIN_USERNAME_LEN} characters`;
  if (username.length > MAX_USERNAME_LEN) return `Max ${MAX_USERNAME_LEN} characters`;
  if (!/^[a-z0-9_]+$/.test(username)) return "Only lowercase letters, numbers, and underscores";
  return null;
}

export function validateBio(bio: string): string | null {
  if (bio.length > MAX_BIO_LEN) return `Max ${MAX_BIO_LEN} characters`;
  return null;
}

/** Governance */
export function validateProposalTitle(title: string): string | null {
  if (!title.trim()) return "Title is required";
  if (title.length > 100) return "Max 100 characters";
  return null;
}

export function validateProposalDescription(desc: string): string | null {
  if (!desc.trim()) return "Description is required";
  if (desc.length > 500) return "Max 500 characters";
  return null;
}

/** Auctions */
export function validateAuctionLabel(label: string): string | null {
  if (!label.trim()) return "Label is required";
  if (label.length > 80) return "Max 80 characters";
  return null;
}

/** Tips & gifts */
export function validateGiftMessage(message: string): string | null {
  if (message.length > 100) return "Max 100 characters";
  return null;
}

export function validateTipMessage(message: string): string | null {
  if (message.length > 200) return "Max 200 characters";
  return null;
}

/** Amount */
export function validatePositiveAmount(amount: string): string | null {
  const n = Number(amount);
  if (!amount || isNaN(n)) return "Enter an amount";
  if (n <= 0) return "Must be greater than 0";
  return null;
}
