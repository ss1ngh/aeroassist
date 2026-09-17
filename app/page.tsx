import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <main className="text-center max-w-md">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-2xl font-bold">AA</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">AeroAssist</h1>
        <p className="text-gray-500 mb-8">
          AI-powered airline disruption support agent
        </p>
        <Link
          href="/chat"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-colors"
        >
          Start Chat
        </Link>
        <div className="mt-4">
          <Link
            href="/admin"
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Admin View
          </Link>
        </div>
      </main>
    </div>
  );
}
