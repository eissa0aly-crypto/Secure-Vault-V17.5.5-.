// Master password from user requirements
const MASTER_PASSWORD = "Eissa2026";
const SALT = "VaultSaltV17"; // A fixed salt for deriving the key

async function getEncryptionKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(MASTER_PASSWORD),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(text: string): Promise<string> {
  if (!text) return text;
  
  const key = await getEncryptionKey();
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );
  
  // Combine IV and ciphertext, then base64 encode
  const cipherArray = Array.from(new Uint8Array(cipherBuffer));
  const ivArray = Array.from(iv);
  const combined = new Uint8Array(ivArray.length + cipherArray.length);
  combined.set(ivArray);
  combined.set(cipherArray, ivArray.length);
  
  return btoa(String.fromCharCode.apply(null, combined as unknown as number[]));
}

export async function decryptText(encryptedBase64: string): Promise<string> {
  if (!encryptedBase64) return encryptedBase64;
  
  try {
    const key = await getEncryptionKey();
    const dec = new TextDecoder();
    
    // Decode base64
    const binaryString = atob(encryptedBase64);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const cipherBuffer = combined.slice(12);
    
    const plainBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      cipherBuffer
    );
    
    return dec.decode(plainBuffer);
  } catch (error) {
    console.error("Decryption failed", error);
    return "[Encrypted Data]";
  }
}
