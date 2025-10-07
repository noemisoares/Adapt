"use client";
import { useEffect } from "react";
import Parse from "../back4app/parseConfig";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function doLogout() {
      await Parse.User.logOut();
      router.push("/login");
    }
    doLogout();
  }, [router]);

  return <p>Saindo...</p>;
}
