const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbw3W32H-3G90jQEvne21SQURKAkEFhY2TZnuiY4Xor7JrG_iGwGatlqc6t1q8vfinH6/exec';

export const API_URL: string = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
export const IS_LOCALHOST: boolean = ['127.0.0.1', 'localhost'].includes(currentHost);
