import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useDebounce } from "./useDebounce";
import { searchUsers, type UserResult } from "../api/explore";

export function useUserSearch(query: string) {
	const q = useDebounce(query.trim(), 300);

	const [results, setResults] = useState<UserResult[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	// Controller of the request in flight (first page or "load more")
	const controllerRef = useRef<AbortController | null>(null);

	// First page: runs whenever the debounced query changes
	useEffect(() => {
		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;

		setLoading(true);
		setLoadingMore(false);
		setError(null);

		searchUsers({ q }, controller.signal)
			.then((page) => {
				setResults(page.results);
				setNextCursor(page.nextCursor);
			})
			.catch((err) => {
				if (axios.isCancel(err)) return; // superseded by a newer request
				setResults([]);
				setNextCursor(null);
				setError('The search could not be loaded. Please try again.');
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => controller.abort();
	}, [q, reloadKey]);

	const loadMore = useCallback(async () => {
		if (!nextCursor || loading || loadingMore) return;

		const controller = new AbortController();
		controllerRef.current = controller;
		setLoadingMore(true);

		try {
			const page = await searchUsers({ q, cursor: nextCursor }, controller.signal);
			setResults((current) => [...current, ...page.results]);
			setNextCursor(page.nextCursor);
		} catch (err) {
			if (axios.isCancel(err)) return;
			// The backend answers 400 for a cursor it no longer knows: start over
			if (axios.isAxiosError(err) && err.response?.status === 400) {
				setReloadKey((key) => key + 1);
				return;
			}
			setError('No further results could be loaded.');
		} finally {
			if (!controller.signal.aborted) setLoadingMore(false);
		}
	}, [nextCursor, loading, loadingMore, q]);

	return {
		results,
		loading,
		loadingMore,
		error,
		hasMore: nextCursor !== null,
		loadMore,
		retry: () => setReloadKey((key) => key + 1),
	};
}