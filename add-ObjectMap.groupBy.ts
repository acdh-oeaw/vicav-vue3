/* eslint-disable @typescript-eslint/no-unused-vars */
interface ObjectConstructor {
	/**
	 * Groups members of an iterable according to the return value of the passed callback.
	 * @param items An iterable.
	 * @param keySelector A callback which will be invoked for each item in items.
	 */
	groupBy<K extends PropertyKey, T>(
		items: Iterable<T>,
		keySelector: (item: T, index: number) => K,
	): Record<K, Array<T>>;
}

interface MapConstructor {
	/**
	 * Groups members of an iterable according to the return value of the passed callback.
	 * @param items An iterable.
	 * @param keySelector A callback which will be invoked for each item in items.
	 */
	groupBy<K, T>(items: Iterable<T>, keySelector: (item: T, index: number) => K): Map<K, Array<T>>;
}
