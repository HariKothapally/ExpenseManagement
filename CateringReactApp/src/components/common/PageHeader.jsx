export default function PageHeader({ title, action }) {
  return (
    <div className="mb-6 flex justify-between items-center">
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      {action}
    </div>
  );
}
