import { ChatPanel } from "@/components/chat-panel";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string; listing?: string; open?: string }>;
}) {
  const { with: withProviderId, listing: marketplaceListingId, open: openConversationId } = await searchParams;
  return <ChatPanel initialProviderId={withProviderId} initialMarketplaceListingId={marketplaceListingId} initialConversationId={openConversationId} />;
}
