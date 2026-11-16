// Minimal payload containing the essential user data
// carried inside the token and the session
export interface UserPayload {
	id: string;
	username: string;
	email: string;
	role: string[];
}