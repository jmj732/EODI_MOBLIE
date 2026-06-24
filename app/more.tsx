import { LegacyRoleRedirect } from "@/components/legacy-role-redirect";

export default function LegacyMoreRoute() {
  return <LegacyRoleRedirect userPath="/user/more" adminPath="/admin/more" />;
}
