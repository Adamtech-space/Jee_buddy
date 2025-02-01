import CryptoJS from 'crypto-js';

const SECRET_KEY =
  import.meta.env.VITE_ENCRYPTION_KEY || 'your-fallback-secret-key';

export const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

export const decryptData = (encryptedData) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Utility functions for localStorage
export const setEncryptedItem = (key, value) => {
  const encrypted = encryptData(value);
  if (encrypted) {
    localStorage.setItem(key, encrypted);
    return true;
  }
  return false;
};

export const getDecryptedItem = (key) => {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;
  return decryptData(encrypted);
};

export const removeItem = (key) => {
  localStorage.removeItem(key);
};
