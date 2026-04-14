import { redirect } from "next/navigation";

export default async function StoreOrderChargesAliasPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  redirect(`/${lang}/app/expenses`);
}
