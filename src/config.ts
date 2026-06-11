const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbxb9aezMHm1qOIjZ4RQdzrc-Ip3nMZ72D96HPO44H-CNvI4awPVFTGUG7R9tRvCVFjd/exec';

export const API_URL: string = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
export const IS_LOCALHOST: boolean = ['127.0.0.1', 'localhost'].includes(currentHost);
