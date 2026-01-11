export default function FormField({ error, ...props }) {
  return (
    <div className="mb-4">
      <input
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          error ? "border-red-500 bg-red-50" : "border-gray-300"
        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
