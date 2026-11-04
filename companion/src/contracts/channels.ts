import type { ChatUiAction, Citation } from "./api";

/** Channels understood by the conversation core. Provider names stay outside it. */
export type ConversationChannel = "web" | "sms";

/**
 * The normalized input passed to the conversation core after a channel adapter
 * has authenticated its caller and resolved an address to a participant.
 */
export type IncomingTurn = {
  idempotencyKey: string;
  channel: ConversationChannel;
  participantId: string;
  text: string;
  receivedAt: string;
  /** A normalized address for auditing (for example, an E.164 number). */
  sourceAddress?: string;
  locale?: string;
};

/** The channel-independent output of one orchestration pass. */
export type TurnResult = {
  text: string;
  actions: ChatUiAction[];
  citations: Citation[];
  fallbackUsed: boolean;
};

export type WebRenderedMessage = {
  channel: "web";
  text: string;
  actions: ChatUiAction[];
  citations: Citation[];
  fallbackUsed: boolean;
};

/** SMS deliberately has no rich-action field: every action must be in text. */
export type SmsRenderedMessage = {
  channel: "sms";
  text: string;
  part: number;
  totalParts: number;
};

export type RenderedChannelMessage =
  | WebRenderedMessage
  | SmsRenderedMessage;

export type RenderedMessageFor<C extends ConversationChannel> = Extract<
  RenderedChannelMessage,
  { channel: C }
>;

export interface ChannelRenderer<
  C extends ConversationChannel,
  M extends RenderedMessageFor<C> = RenderedMessageFor<C>,
> {
  readonly channel: C;
  render(result: TurnResult): M[];
}

export type ChannelAddress<C extends ConversationChannel = ConversationChannel> = {
  channel: C;
  address: string;
};

/** One rendered message ready to be handed to a channel provider. */
export type OutboundDelivery<
  C extends ConversationChannel = ConversationChannel,
> = C extends ConversationChannel
  ? {
      idempotencyKey: string;
      participantId: string;
      to: ChannelAddress<C>;
      message: RenderedMessageFor<C>;
    }
  : never;

export type DeliveryStatus =
  | "accepted"
  | "queued"
  | "sent"
  | "delivered"
  | "failed";

export type DeliveryReceipt<C extends ConversationChannel = ConversationChannel> = {
  channel: C;
  idempotencyKey: string;
  status: DeliveryStatus;
  recordedAt: string;
  providerMessageId?: string;
  errorCode?: string;
};
