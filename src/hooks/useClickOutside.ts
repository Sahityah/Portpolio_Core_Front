import { useEffect, RefObject } from 'react';

// Custom hook to detect clicks outside a specified element
export function useClickOutside(ref: RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) {
  useEffect(() => {
    // The listener function should accept a general 'Event' type.
    // We then cast 'event.target' to 'Node' for the 'contains' method.
    const listener = (event: MouseEvent | TouchEvent) => { // Accept both MouseEvent and TouchEvent
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    // Attach both mouse and touch event listeners
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    // Clean up event listeners on component unmount
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Dependencies array for useEffect
}