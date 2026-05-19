export default function LoginButton() {
  return (
    <a
      href="/api/auth/login"
      className="inline-flex items-center gap-2 px-4 py-2 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors text-sm"
    >
      <span>Sign in with Salesforce</span>
      <span aria-hidden>→</span>
    </a>
  );
}
