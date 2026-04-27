const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbysMIlnJNgAwtLSnIQ3GaUts8nxFZ5k1ekeaowT9Uc4zbhE5s21ixK5Twvo6KY4712C/exec';

export const API_URL: string = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
export const IS_LOCALHOST: boolean = ['127.0.0.1', 'localhost'].includes(currentHost);
