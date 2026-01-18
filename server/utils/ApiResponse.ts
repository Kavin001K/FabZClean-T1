/**
 * Standardized API Response Wrapper
 * Ensures consistent response structure across the application.
 */
export class ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
    meta: Record<string, any>;

    constructor(success: boolean, data: T | null, error: string | null = null, meta: Record<string, any> = {}) {
        this.success = success;
        this.data = data;
        this.error = error;
        this.meta = meta;
    }

    /**
     * Returns a success response
     * @param data The data to return
     * @param meta Optional metadata (pagination, etc.)
     */
    static success<T>(data: T, meta: Record<string, any> = {}): ApiResponse<T> {
        return new ApiResponse(true, data, null, meta);
    }

    /**
     * Returns an error response
     * @param message The error message
     * @param meta Optional metadata
     */
    static error<T>(message: string, meta: Record<string, any> = {}): ApiResponse<T> {
        return new ApiResponse<T>(false, null, message, meta);
    }
}
