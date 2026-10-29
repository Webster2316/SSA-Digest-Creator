
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Users, CheckCircle, XCircle } from "lucide-react";

interface Buttons {
  id: string;
  title: string;
}

interface ResponseData {
  answer: "Yes" | "No";
}

interface TrackingData {
  title: string;
  total: number;
  yesCount: number;
  noCount: number;
  responses: ResponseData[];
}

interface ConfirmationDataProps {
  button: Buttons;
  onBack: () => void;
}

export default function data({ button, onBack}: ConfirmationDataProps) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadResponses() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `/api/surveys?view=responses&surveyId=${encodeURIComponent(button.id)}`
        );

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Failed to load responses");
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load responses"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadResponses();

    return () => {
      cancelled = true;
    };
  }, [button.id]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-4xl">

        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900"
        >
          <ArrowLeft size={16} />
          Back to generator
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-indigo-900">
            Response Tracking
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {button.title}
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            Loading responses...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

              <div className="rounded-lg border bg-white p-5">
                <div className="mb-2 flex items-center gap-2 text-gray-500">
                  <Users size={18} />
                  <span className="text-sm">Total Responses</span>
                </div>
                <p className="text-3xl font-bold text-indigo-900">
                  {data.total}
                </p>
              </div>

              <div className="rounded-lg border bg-white p-5">
                <div className="mb-2 flex items-center gap-2 text-green-700">
                  <CheckCircle size={18} />
                  <span className="text-sm">Attending</span>
                </div>
                <p className="text-3xl font-bold text-green-700">
                  {data.yesCount}
                </p>
              </div>

              <div className="rounded-lg border bg-white p-5">
                <div className="mb-2 flex items-center gap-2 text-red-600">
                  <XCircle size={18} />
                  <span className="text-sm">Not Attending</span>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {data.noCount}
                </p>
              </div>

            </div>

            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b px-4 py-3">
                <h2 className="font-semibold text-gray-800">
                  Individual Responses
                </h2>
              </div>

              {data.responses.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">
                  No responses have been recorded yet.
                </p>
              ) : (
                <div className="divide-y">
                  {data.responses.map((response, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <span className="text-sm text-gray-700">
                        Response {index + 1}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          response.answer === "Yes"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {response.answer}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
