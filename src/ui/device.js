// Whether the device is played with fingers, as a phone or a tablet is.
export const fingers = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
