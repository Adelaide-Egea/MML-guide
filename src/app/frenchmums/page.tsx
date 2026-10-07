import { GroupInviteView } from "@/components/group-invite-view";
import { store } from "@/lib/store";
import { notFound } from "next/navigation";

/** Short French invite: https://mums-night-out.vercel.app/frenchmums */
export default async function FrenchMumsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const group = await store.getGroupById("french");
  if (!group) notFound();
  const { tab } = await searchParams;
  return (
    <GroupInviteView
      group={group}
      channel="evening"
      tab={tab}
      path="/frenchmums"
    />
  );
}
