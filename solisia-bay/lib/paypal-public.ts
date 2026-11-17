/** Public PayPal client id. This module must not read the client secret. */
export function paypalClientId(): string {
  return process.env.PAYPAL_CLIENT_ID ?? "";
}
