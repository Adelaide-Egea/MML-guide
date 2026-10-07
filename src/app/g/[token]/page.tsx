import { GroupInviteView } from "@/components/group-invite-view";
import { resolveGroupByToken, GroupAccessError } from "@/lib/group-access";
import { notFound } from "next/navigation";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { token } = await params;
  const { tab } = await searchParams;
  let group;
  try {
    group = await resolveGroupByToken(token);
  } catch (e) {
    if (e instanceof GroupAccessError) notFound();
    throw e;
  }
  return <GroupInviteView group={group} tab={tab} path={`/g/${token}`} />;
}
