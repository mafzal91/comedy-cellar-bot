import { Ref } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

export type Entry = IntersectionObserverEntry | undefined;
export type InView = boolean;

export interface ObserverOptions extends IntersectionObserverInit {
  defaultInView?: boolean;
  triggerOnce?: boolean;
}

export const useObserver = <T extends HTMLElement>(
  options?: ObserverOptions
): [ref: Ref<T>, inView: InView, entry: Entry] => {
  const {
    root = null,
    rootMargin = "0px",
    threshold = 0,
    defaultInView = false,
    triggerOnce = false,
  } = options || {};

  const [inView, setInView] = useState<InView>(defaultInView);
  const [entryState, setEntryState] = useState<Entry>();
  const [node, setNode] = useState<T | null>(null);

  const ref = useCallback((node: T | null) => {
    setNode(node);
  }, []);

  useEffect(() => {
    if (!node) return;
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) {
      console.warn("IntersectionObserver is not supported in this browser.");
      return;
    }

    const observerInstance = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        setEntryState(firstEntry);
        setInView(firstEntry.isIntersecting);

        if (triggerOnce && firstEntry.isIntersecting) {
          observerInstance.unobserve(node);
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observerInstance.observe(node);

    return () => {
      observerInstance.disconnect();
    };
  }, [node, root, rootMargin, threshold, triggerOnce]);

  return [ref, inView, entryState];
};
