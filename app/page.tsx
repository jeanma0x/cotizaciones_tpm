import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  await auth.protect({ unauthenticatedUrl: "/sign-in" });
  redirect("/dashboard");
}
