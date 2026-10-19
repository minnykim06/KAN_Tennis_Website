import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { SignInButton } from "@/components/auth/SignInButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { button, card } from "@/components/ui/styles";
import { getCurrentPlayer } from "@/lib/auth/session";
import { fmt } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.account.title };
}

export default async function AccountPage() {
  const [{ t }, player] = await Promise.all([getI18n(), getCurrentPlayer()]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <PageHeader title={t.account.title} subtitle={player ? fmt(t.account.subtitle, { name: player.name }) : undefined} />
      {player ? (
        <section className={`${card} p-5 sm:p-6`}>
          <h2 className="font-serif text-xl font-semibold text-green">{t.account.changePassword}</h2>
          <p className="mt-1 mb-5 text-sm text-muted">{t.account.changePasswordHint}</p>
          <ChangePasswordForm />
        </section>
      ) : (
        <EmptyState>
          <p>{t.account.signInPrompt}</p>
          <SignInButton className={`${button.primary} mt-4`}>{t.nav.signIn}</SignInButton>
        </EmptyState>
      )}
    </div>
  );
}
