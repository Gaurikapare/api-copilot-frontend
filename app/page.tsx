"use client";

import { useState } from "react";

/* ---------------- TYPES ---------------- */

type SpecResponse = {
  trace_id: string;
  spec: {
    modules: { name: string; description?: string }[];
    features_by_module: Record<string, string[]>;
    user_stories: { role: string; goal: string; benefit: string }[];
    api_endpoints: {
      method: string;
      path: string;
      auth_required: boolean;
      request_body: Record<string, string>;
      response_body: Record<string, string>;
      errors: string[];
    }[];
    db_schema: {
      table_name: string;
      columns: { name: string; type: string; constraints?: string }[];
    }[];
    open_questions: string[];
  };
};

/* ---------------- BLOCK ---------------- */

function Block({ title, children }: { title: string; children: any }) {
  return (
    <div className="border border-neutral-700 rounded-md p-5 bg-[#0b0f19]">
      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
      <div className="text-neutral-300 text-sm space-y-2">{children}</div>
    </div>
  );
}

/* ---------------- MAIN ---------------- */

export default function HomePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpecResponse | null>(null);
  const [refineText, setRefineText] = useState("");

  /* ---------------- ACCORDION STATE ---------------- */

  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setOpenSection(prev => (prev === key ? null : key));
  };

  const Accordion = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => {
    const isOpen = openSection === id;

    return (
      <div className="border border-neutral-700 rounded-lg mb-4 bg-[#05070d]">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-5 py-4 text-left flex justify-between items-center text-white text-lg font-semibold"
        >
          {title}
          <span className="text-xl">{isOpen ? "−" : "+"}</span>
        </button>

        {isOpen && <div className="px-5 pb-5">{children}</div>}
      </div>
    );
  };

  /* ---------------- API CALL ---------------- */

  async function handleGenerate() {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        "https://gaurikapare-api-copilot-backend.hf.space/specs/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requirements_text: input }),
        }
      );

      const data = await res.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Specification generation failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Specification generation failed");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- REFINE (DISABLED) ---------------- */

  async function handleRefine() {
    alert("Refine feature is currently disabled.");
    return;
  }

  /* ---------------- UTIL ---------------- */

  function copyJSON() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    alert("JSON copied to clipboard");
  }

  function downloadJSON() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated_spec.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-14 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-white text-center">
        Requirement → API Copilot
      </h1>
      <p className="mt-2 text-neutral-300 text-center max-w-xl">
        Convert messy product requirements into structured technical specifications.
      </p>

      <div className="w-full max-w-3xl mt-10">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your product requirements here..."
          className="w-full h-48 p-4 border border-neutral-700 rounded-md resize-none bg-[#0b0f19] text-white"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-6 px-6 py-2 bg-white text-black rounded-md disabled:opacity-60"
      >
        {loading ? "Generating..." : "Generate Spec"}
      </button>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {result && (
        <section className="w-full max-w-5xl mt-16 border-t border-neutral-700 pt-10">
          <h2 className="text-2xl font-bold text-white mb-8">
            Generated Specification
          </h2>

          <Accordion id="modules" title="Modules">
            <Block title="Modules">
              {result.spec.modules.map((m, i) => (
                <p key={i}>
                  <b>{m.name}</b> — {m.description}
                </p>
              ))}
            </Block>
          </Accordion>

          <Accordion id="features" title="Features by Module">
            <Block title="Features by Module">
              {Object.entries(result.spec.features_by_module).map(
                ([module, features], i) => (
                  <div key={i}>
                    <p className="font-semibold text-white">{module}</p>
                    <ul className="list-disc ml-6">
                      {features.map((f, j) => (
                        <li key={j}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </Block>
          </Accordion>

          <Accordion id="stories" title="User Stories">
            <Block title="User Stories">
              {result.spec.user_stories.map((u, i) => (
                <p key={i}>
                  As a <b>{u.role}</b>, I want {u.goal}, so that {u.benefit}.
                </p>
              ))}
            </Block>
          </Accordion>

          <Accordion id="apis" title="API Endpoints">
            <Block title="API Endpoints">
              {result.spec.api_endpoints.map((api, i) => (
                <p key={i}>
                  <b>{api.method}</b> {api.path}
                </p>
              ))}
            </Block>
          </Accordion>

          <Accordion id="db" title="Database Schema">
            <Block title="Database Schema">
              {result.spec.db_schema.map((t, i) => (
                <div key={i}>
                  <b>{t.table_name}</b>
                </div>
              ))}
            </Block>
          </Accordion>

          <Accordion id="questions" title="Open Questions">
            <Block title="Open Questions">
              <ul className="list-disc ml-6">
                {result.spec.open_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </Block>
          </Accordion>

          <div className="mt-10 flex gap-4 justify-center">
            <button
              onClick={copyJSON}
              className="px-4 py-2 border border-white text-white rounded-md"
            >
              Copy JSON
            </button>
            <button
              onClick={downloadJSON}
              className="px-4 py-2 border border-white text-white rounded-md"
            >
              Download JSON
            </button>
          </div>

          {/* REFINE UI (Backend disabled) */}
          <div className="mt-12 w-full border-t border-neutral-700 pt-8">
            <h3 className="text-lg font-bold text-white mb-3">
              Refine Specification
            </h3>

            <textarea
              value={refineText}
              onChange={(e) => setRefineText(e.target.value)}
              className="w-full h-28 p-3 border border-neutral-700 rounded-md resize-none bg-[#0b0f19] text-white"
            />

            <button
              onClick={handleRefine}
              className="mt-4 px-5 py-2 bg-white text-black rounded-md"
            >
              Refine Spec
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
