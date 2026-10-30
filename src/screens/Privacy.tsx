interface Props {
  onBack: () => void;
}

export function Privacy({ onBack }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <button type="button" onClick={onBack} className="mb-6 pt-2 text-left text-dim">
        ← Back
      </button>
      <h1 className="display text-2xl font-extrabold tracking-tight">Privacy</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-dim">
        <p>Without a login, your talks stay only in this browser. They are not uploaded.</p>
        <p>
          If you sign in with Google, your talks are stored as JSON in Supabase, tied to your
          Google account email. That copy is used only to sync your talks across your devices.
        </p>
        <p>
          You can delete the cloud copy any time with “Delete my cloud data” in the app. The
          talks on this device stay.
        </p>
        <p>
          Questions:{" "}
          <a
            href="https://khomichenko.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-onair underline underline-offset-2"
          >
            khomichenko.com
          </a>
        </p>
      </div>
    </main>
  );
}
