import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  await auth.protect({ unauthenticatedUrl: "/sign-in" });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-paper">
      <div className="correlativo-tag">TPM-1001</div>
      <UserButton />
    </div>
  );
}
