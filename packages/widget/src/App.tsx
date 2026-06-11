import { Button } from "@/components/ui/button";

function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">MAX widget — W1 bootstrap</h1>
      <Button onClick={() => console.log("MAX widget bootstrap OK")}>
        Test button
      </Button>
    </main>
  );
}

export default App;
