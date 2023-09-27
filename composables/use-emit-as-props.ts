/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { camelize, getCurrentInstance, toHandlerKey } from "vue";

/**
 * @see https://github.com/vuejs/core/issues/5917
 */
export function useEmitAsProps<EventName extends string>(
	emit: (name: EventName, ...args: Array<any>) => void,
) {
	const result: Record<string, any> = {};

	const vm = getCurrentInstance();
	if (vm == null) return result;

	const events: Array<EventName> = Array.isArray(vm.type.emits)
		? vm.type.emits
		: typeof vm.type.emits === "object"
		? Object.keys(vm.type.emits)
		: [];

	if (events.length === 0) {
		console.warn(`No emitted event found. Please check component: ${vm.type.__name}`);
	}

	events.forEach((name) => {
		result[toHandlerKey(camelize(name))] = (...args: Array<any>) => {
			emit(name, ...args);
		};
	});

	return result;
}
