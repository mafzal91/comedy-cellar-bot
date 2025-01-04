import { ComponentChildren, JSX, Ref } from "preact";
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

/* ViewportObserver */
export interface ViewportObserverProps<T extends keyof JSX.IntrinsicElements> {
  children: (props: { inView: InView; entry: Entry }) => ComponentChildren;
  options?: ObserverOptions;
  as?: T;
}

export const ViewportObserver = <T extends keyof JSX.IntrinsicElements>({
  children,
  options,
  as: Component = "div" as T,
}: ViewportObserverProps<T>) => {
  const [ref, inView, entry] = useObserver<ElementType<T>>(options);

  return (
    <Component ref={ref as Ref<HTMLElement>}>
      {children({ inView, entry })}
    </Component>
  );
};

// Add this type helper at the top of the file
type ElementType<T extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[T] extends JSX.HTMLAttributes<infer U> ? U : never;
