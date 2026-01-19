import { updates } from "./data";

export default function Updates() {
  return (
    <div className="mt-10 max-w-4xl mx-auto p-4 bg-white shadow-sm ring-1 ring-gray-200 rounded-lg">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-slate-950">What's New</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Stay up to date with the latest features and improvements
        </p>
      </div>

      {/* Updates */}
      <div className="space-y-8">
        {updates.map((update, index) => (
          <div key={index} className="border-l-4 border-primary pl-4 py-4">
            <div className="flex items-center mb-2">
              <span className="text-sm text-gray-500">{update.date}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-950">
              {update.title}
            </h3>
            <p className="text-gray-700">{update.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
