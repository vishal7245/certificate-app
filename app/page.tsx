import Link
 from "next/link";
export default function Home() {
  return (
    <div>
      Home Page
      <br />
      Click below to get a cookie
      <br />
      <Link href="/templates">
      Templates
      </Link>
      <br />
      <Link href="/generate">
      Generate
      </Link>

    </div>
  );
}
