<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import SieveWorker from './worker?worker';

type WorkerMessageData =
  | { type: 'eliminate'; data: number }
  | { type: 'error'; data: string }
  | { type: 'done' };

/** The maximum number for the prime sieve */
const n = ref(10);
/** The interval (in milliseconds) for the numbers to show up on the screen */
const interval = ref(250);
/** The Web Worker running */
const worker = ref<Worker | null>(null);

/** All the numbers (from 1 to n) */
const allNums = ref<number[]>([]);
/** The numbers that have been eliminated in the UI */
const elimNums = ref<number[]>([]);

/** The numbers that will be eliminated */
const eliminationQueue = ref<number[]>([]);

/** Whether the Web Workers API is supported */
const workersSupported = ref(true);

/** A Status enum
 * @todo Just using a simple boolean would work.
 * */
const enum Status {
  /** Haven't started yet / Already done */
  IDLE,
  /** In progress */
  IN_PROGRESS,
}

/** The status of the web app */
const status = ref<Status>(Status.IDLE);

/** Whether or not to disable the controls
 *
 * (Either the Worker is not initialized, or it is running)
 */
const disableControls = computed(() => {
  return !worker.value || status.value === Status.IN_PROGRESS;
});

onMounted(() => {
  workersSupported.value = 'Worker' in window;

  if (workersSupported.value) {
    worker.value = new SieveWorker();
    console.log('initialized worker');
  }
});

/** Start the sieve algorithm and sync UI with Worker */
const start = () => {
  if (!worker.value) {
    alert('Error: worker not initialized');
    return;
  }

  status.value = Status.IN_PROGRESS;

  allNums.value = [...Array(n.value).keys()].map((k) => k + 1);
  elimNums.value = [];

  /** The ID of the timer that's eliminating the numbers one by one in the UI */
  const eliminationInterval = setInterval(() => {
    console.log('eliminationInterval', eliminationInterval, 'triggered');

    const firstInQueue = eliminationQueue.value.shift();
    if (firstInQueue === undefined) return;

    console.log('formally eliminated', firstInQueue);

    elimNums.value.push(firstInQueue);
  }, interval.value);

  worker.value.postMessage({ n: n.value });
  console.log('sent', n.value, 'to worker');

  const listener = (ev: MessageEvent<WorkerMessageData>) => {
    switch (ev.data.type) {
      case 'eliminate':
        if (
          elimNums.value.indexOf(ev.data.data) === -1 &&
          eliminationQueue.value.indexOf(ev.data.data) === -1
        )
          console.log('added', ev.data.data, 'to elimination queue');

        eliminationQueue.value.push(ev.data.data);
        break;

      case 'error':
        console.error('error occurred in web worker', ev.data.data);

        alert(`Error occurred in Web Worker: ${ev.data.data}`);
        break;

      case 'done':
        /** The ID of the timer that's waiting to clear eliminationInterval */
        const clearIntervalInterval = setInterval(() => {
          console.log(
            'clearIntervalInterval',
            clearIntervalInterval,
            'triggered'
          );

          console.log(
            'worker done, waiting for elimination queue to be cleared'
          );

          if (eliminationQueue.value.length === 0) {
            console.log(
              'elimination queue has cleared, stopping all timers, setting status to done, and removing listener from worker'
            );

            clearInterval(eliminationInterval);
            clearInterval(clearIntervalInterval);

            if (worker.value)
              worker.value.removeEventListener('message', listener);

            status.value = Status.IDLE;
          }
        }, 500);

        // status.value = Status.DONE;
        break;

      default:
        console.warn('unknown message received from worker', ev);
    }
  };

  worker.value.addEventListener('message', listener);
};
</script>

<template>
  <template v-if="workersSupported">
    <h1 class="font-bold text-3xl mb-3">Sieve of Eratosthenes</h1>
    <h2 class="font-medium text-lg mb-6">
      A demo of said algorithm to find primes from 1 to
      <span class="text-primary-500 font-semibold">{{ n }}</span
      >, eliminating primes with an interval of
      <span class="text-primary-500 font-semibold">{{ interval }}</span
      >ms
    </h2>
    <h3 class="flex space-x-4 mb-12">
      <a
        class="external-link"
        target="_blank"
        rel="noopener noreferrer"
        href="https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes"
      >
        Wikipedia article
      </a>
      <a
        class="external-link"
        target="_blank"
        rel="noopener noreferrer"
        href="https://github.com/ryanccn/sieve-of-eratosthenes"
      >
        GitHub
      </a>
    </h3>

    <label class="flex space-x-4 items-center mb-2">
      <span class="font-medium">n</span>
      <input
        type="number"
        v-model="n"
        class="px-4 py-2 bg-zinc-50 focus:bg-zinc-100 dark:bg-zinc-900 dark:focus:bg-zinc-800 rounded-lg disabled:opacity-75"
        :disabled="disableControls"
      />
    </label>
    <label class="flex space-x-4 items-center mb-4">
      <span class="font-medium">interval</span>
      <input
        type="range"
        min="0"
        max="1000"
        step="50"
        v-model="interval"
        class="px-4 py-2 bg-zinc-50 focus:bg-zinc-100 rounded-lg disabled:opacity-75"
        :disabled="disableControls"
      />
    </label>

    <button
      @click="start"
      class="inline-block px-4 py-2 mb-10 font-semibold bg-primary-500 hover:bg-primary-400 text-white transition-colors rounded-lg disabled:opacity-75"
      :disabled="disableControls"
    >
      Start
    </button>

    <ul class="grid grid-cols-5 md:grid-cols-10 gap-3 w-full">
      <li
        v-for="num in allNums"
        class="font-medium transition-all text-white p-2 text-center rounded-lg"
        :class="{
          'bg-red-400': elimNums.indexOf(num) !== -1,
          'bg-green-400': elimNums.indexOf(num) === -1,
          'opacity-50': status === Status.IDLE && elimNums.indexOf(num) !== -1,
        }"
      >
        {{ num }}
      </li>
    </ul>
  </template>

  <template v-else>
    <p>Uh oh! The Web Workers API is not supported on your browser.</p>
  </template>
</template>
