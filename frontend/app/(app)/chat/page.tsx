import { ChatPanel } from "@/components/chat-panel";
import { PageHeader } from "@/components/ui";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const { with: withProviderId } = await searchParams;
  return (
    <>
      <PageHeader title="Chat" />
      <ChatPanel initialProviderId={withProviderId} />
    </>
  );
}
