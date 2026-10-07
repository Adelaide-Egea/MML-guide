import { GroupInviteView } from "@/components/group-invite-view";
import { store } from "@/lib/store";
import { notFound } from "next/navigation";

/** Barnes day-walk invite: https://mums-night-out.vercel.app/barneswalks */
export default async function BarnesWalksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const group = await store.getGroupById("barnes");
  if (!group) notFound();
  const { tab } = await searchParams;
  return (
    <GroupInviteView group={group} channel="day" tab={tab} path="/barneswalks" />
  );
}
