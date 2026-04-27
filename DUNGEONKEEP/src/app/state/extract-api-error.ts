import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a user-facing error message from an HttpErrorResponse or any thrown error.
 * Handles ProblemDetails, plain string, and fallback to Error.message.
 */
export function extractApiError(error: unknown, fallback: string = 'An error occurred.'): string {
    if (error instanceof HttpErrorResponse) {
        if (typeof error.error === 'string' && error.error.trim()) {
            return error.error.trim();
        }
        if (error.error && typeof error.error === 'object') {
            // ProblemDetails/ValidationProblemDetails
            const detail = 'detail' in error.error && typeof error.error.detail === 'string' ? error.error.detail : '';
            const title = 'title' in error.error && typeof error.error.title === 'string' ? error.error.title : '';
            // Field-level errors (ValidationProblemDetails)
            if ('errors' in error.error && typeof error.error.errors === 'object' && error.error.errors) {
                const errorsObj = error.error.errors;
                const fieldErrors = Object.values(errorsObj)
                    .flat()
                    .filter((msg: unknown) => typeof msg === 'string' && msg.trim());
                if (fieldErrors.length > 0) {
                    return fieldErrors.join(' ');
                }
            }
            return detail || title || fallback;
        }
        if (error.status === 0) {
            return 'Unable to reach the server.';
        }
    }
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
}
