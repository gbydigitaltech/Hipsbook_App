/** Response payload returned after checkout request */
export interface OrderCheckoutResponse {
  /** Generated order identifier */
  order_id: string;

  /** Related library identifier created/used by checkout */
  library_id: string;

  /** Backend action type (currently fixed to "library") */
  action: 'library';
}
