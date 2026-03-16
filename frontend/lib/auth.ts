export interface User { id: number; name: string; email: string; created_at: string; }
export function saveAuth(token: string, user: User) { if (typeof window === "undefined") return; localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(user)); }
export function clearAuth() { if (typeof window === "undefined") return; localStorage.removeItem("token"); localStorage.removeItem("user"); }
export function getToken(): string | null { if (typeof window === "undefined") return null; return localStorage.getItem("token"); }
export function getUser(): User | null { if (typeof window === "undefined") return null; const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; }
export function isAuthenticated(): boolean { return !!getToken(); }
