declare module '@/api/axios' {
    export const API_BASE_URL: string;
    export function getWebSocketUrl(): string;
    export function apiRequest(endpoint: string, options?: any): Promise<any>;
    const _default: {
        baseURL: string;
        getWebSocketUrl: () => string;
        apiRequest: (endpoint: string, options?: any) => Promise<any>;
    };
    export default _default;
}
