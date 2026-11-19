import { useEffect, useState } from 'react';

// Returns 'value' only after it has stopped changing for 'delay ms
export function useDebounce<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delay);
		// Cancel the pending update if the value changes again before the delay
		return () => clearTimeout(id);
	}, [value, delay]);

	return debounced;
}