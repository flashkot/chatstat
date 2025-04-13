export function createStopwatch() {
  const start = performance.now();
  let prev = start;

  return {
    time: () => {
      let t = performance.now();
      let elapsed = t - prev;
      prev = t;

      return Math.round(elapsed) / 1000;
    },
    fromStart: () => Math.round(performance.now() - start) / 1000,
  };
}
