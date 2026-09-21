import { ChatPanel } from "@/components/chat-panel";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string; open?: string }>;
}) {
  const { with: withProviderId, open: openConversationId } = await searchParams;
  return <ChatPanel initialProviderId={withProviderId} initialConversationId={openConversationId} />;
}
