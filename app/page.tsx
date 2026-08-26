import Hero from "@/components/Hero";
import QuoteWorkspace from "@/components/QuoteWorkspace";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 pb-16 sm:px-6">
      <Hero />
      <QuoteWorkspace />
    </main>
  );
}
