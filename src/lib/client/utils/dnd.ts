import { SHADOW_ITEM_MARKER_PROPERTY_NAME, TRIGGERS, type DndEvent } from 'svelte-dnd-action';

let copies = 0;

export function copyOnDragStart<T extends { id: string }>(
	event: CustomEvent<DndEvent<T>>,
	current: T[]
): T[] {
	const { trigger, id } = event.detail.info;

	if (trigger !== TRIGGERS.DRAG_STARTED) {
		return event.detail.items;
	}

	const index = current.findIndex((item) => item.id === id);
	const items = event.detail.items.filter(
		(item) => !(item as Record<string, unknown>)[SHADOW_ITEM_MARKER_PROPERTY_NAME]
	);

	if (index !== -1) {
		items.splice(index, 0, { ...current[index], id: `${id}~${copies++}` });
	}

	return items;
}
