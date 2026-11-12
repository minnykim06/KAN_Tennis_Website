// Scopes the black-and-white tournament theme (.bw-theme in globals.css) to
// this page. The navbar and footer sit outside it and keep the club colors.
export default function TournamentLayout({ children }: LayoutProps<"/tournament/fall-2026">) {
  return <div className="bw-theme flex-1">{children}</div>;
}
