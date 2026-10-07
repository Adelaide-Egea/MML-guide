import { GroupInviteView } from "@/components/group-invite-view";
import { store } from "@/lib/store";
import { notFound } from "next/navigation";

/** Short Barnes invite: https://mums-night-out.vercel.app/barnesmums */
export default async function BarnesMumsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const group = await store.getGroupById("barnes");
  if (!group) notFound();
  const { tab } = await searchParams;
  return (
    <GroupInviteView
      group={group}
      channel="evening"
      tab={tab}
      path="/barnesmums"
    />
  );
}
