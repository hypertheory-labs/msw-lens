/**
 * RFC 9457 Problem Details for HTTP APIs.
 * Used as the standard error envelope for 4xx/5xx responses.
 * https://www.rfc-editor.org/rfc/rfc9457
 */
export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
};
