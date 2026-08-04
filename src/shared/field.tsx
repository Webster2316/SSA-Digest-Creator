export default function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <label className="block mb-2">
        <span className="block text-xs font-semibold text-gray-500 mb-1">{label}</span>
        {children}
      </label>
    );
  }