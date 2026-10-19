import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { button } from "@/components/ui/styles";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold text-green">{t.common.notFound}</h1>
      <Link href="/" className={`${button.outline} mt-6`}>
        {t.common.backHome}
      </Link>
    </div>
  );
}
