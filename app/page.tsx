import { getSession } from "@/lib/session";
import LoginButton from "@/components/LoginButton";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    return (
      <main className="min-h-screen flex flex-col px-6 py-12 sm:py-20">
        <div className="flex-1 flex flex-col justify-center max-w-3xl w-full mx-auto">
          <h1 className="serif text-[clamp(2.75rem,9vw,6rem)] leading-[0.95] mb-8">
            Salesforce
            <br />
            <span className="italic">validation rules</span> switch
            <span className="text-accent">.</span>
          </h1>

          <div className="h-px w-16 bg-foreground/30 mb-8" />

          <p className="text-base text-muted max-w-md leading-relaxed mb-10">
            Sign in with your Salesforce credentials, pull the validation
            rules on the Account object, and flip them on or off. That&apos;s
            the whole app.
          </p>

          <div>
            <LoginButton />
          </div>
        </div>

        <footer className="mono text-[11px] text-muted mt-12">
          built for the salesforce assignment · {new Date().getFullYear()}
        </footer>
      </main>
    );
  }

  return <Dashboard username={session.username} orgName={session.orgName} />;
}
