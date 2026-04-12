import { redirect } from "next/navigation";

type LegacyProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LegacyProductPage({
  params
}: LegacyProductPageProps) {
  const { id } = await params;
  redirect(`/product/${id}`);
}
