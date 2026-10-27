import { useCallback, useEffect, useState } from "react";

// Results of successful client-side loads, so remounted components (e.g. the
// sidebar after a layout change) render instantly instead of flashing a
// skeleton. Only filled in effects, so it never exists during SSR.
const cache = new Map();

export default function useApi(key, loader, { enabled = true } = {}) {
  const [state, setState] = useState(() => ({
    data: key && cache.has(key) ? cache.get(key) : undefined,
    error: null,
    loading: Boolean(enabled && key && !cache.has(key)),
  }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !key) return undefined;
    if (cache.has(key) && attempt === 0) {
      setState({ data: cache.get(key), error: null, loading: false });
      return undefined;
    }

    let active = true;
    setState((previous) => ({ data: previous.data, error: null, loading: true }));
    loader()
      .then((data) => {
        cache.set(key, data);
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (active) setState({ data: undefined, error, loading: false });
      });

    return () => {
      active = false;
    };
    // `loader` is recreated on every render; `key` identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, attempt]);

  const retry = useCallback(() => {
    if (key) cache.delete(key);
    setAttempt((value) => value + 1);
  }, [key]);

  return { ...state, retry };
}
