import type {
  ConversationChannel,
  DeliveryReceipt,
  OutboundDelivery,
} from "@/contracts/channels";

/**
 * Vendor-neutral delivery seam. A Twilio, Telnyx, or browser implementation can
 * satisfy this interface without leaking provider objects into orchestration.
 */
export interface OutboundMessageGateway<
  C extends ConversationChannel = ConversationChannel,
> {
  readonly channel: C;
  send(message: OutboundDelivery<C>): Promise<DeliveryReceipt<C>>;
}
