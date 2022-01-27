self.addEventListener('message', (ev: MessageEvent<{ n: number }>) => {
  /** The maximum number for the prime sieve */
  const n = ev.data.n;

  if (typeof n !== 'number')
    self.postMessage({ type: 'error', data: 'n is not a number!' });

  /** An array of booleans representing whether numbers are prime */
  let isPrime: boolean[] = [];

  isPrime[0] = isPrime[1] = false;
  self.postMessage({ type: 'eliminate', data: 0 });
  self.postMessage({ type: 'eliminate', data: 1 });

  for (let i = 2; i <= n; ++i) isPrime[i] = true;

  for (let i = 2; i * i <= n; ++i)
    if (isPrime[i])
      for (let j = i * i; j <= n; j += i) {
        isPrime[j] = false;
        self.postMessage({ type: 'eliminate', data: j });
      }

  self.postMessage({ type: 'done' });
});
