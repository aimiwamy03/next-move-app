import type {
  ChannelRenderer,
  TurnResult,
  WebRenderedMessage,
} from "@/contracts/channels";

/** Web keeps structured actions so the client can render accessible controls. */
export function renderWebTurn(result: TurnResult): WebRenderedMessage[] {
  return [
    {
      channel: "web",
      text: result.text,
      actions: result.actions,
      citations: result.citations,
      fallbackUsed: result.fallbackUsed,
    },
  ];
}

export const webChannelRenderer: ChannelRenderer<
  "web",
  WebRenderedMessage
> = {
  channel: "web",
  render: renderWebTurn,
};
