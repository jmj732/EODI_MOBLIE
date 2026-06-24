import { LegacyRoleRedirect } from "@/components/legacy-role-redirect";

export default function LegacyMypageRoute() {
  return <LegacyRoleRedirect userPath="/user/mypage" adminPath="/admin/mypage" />;
}
