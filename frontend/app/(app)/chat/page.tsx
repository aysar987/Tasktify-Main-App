import { ChatPanel } from "@/components/chat-panel";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const { with: withProviderId } = await searchParams;
  return <ChatPanel initialProviderId={withProviderId} />;
}
