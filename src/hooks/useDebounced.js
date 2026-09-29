"use client";

import { useEffect, useState } from "react";

/**
 * The value, but it stops changing until the user stops typing.
 *
 * Without it every keystroke in the members search fires its own request -
 * typing "Rahim" is five round trips, and the answers can land out of order so
 * the table settles on the results for "Rahi".
 */
export function useDebounced(value, delay = 350) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
