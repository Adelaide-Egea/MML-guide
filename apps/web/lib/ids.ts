/** Ids are generated on the device. There is no server assigning them yet, and when
 *  there is, a client-generated id is what lets a parent keep typing on a train with
 *  no signal and sync later without a merge conflict. */
export function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}
