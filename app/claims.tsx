import { LegacyRoleRedirect } from "@/components/legacy-role-redirect";

export default function LegacyClaimsRoute() {
  return <LegacyRoleRedirect userPath="/user/claims" adminPath="/admin/claims" />;
}
