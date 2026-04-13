import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-800 mb-4">404</p>
        <h2 className="text-lg font-medium text-white mb-2">Page not found</h2>
        <p className="text-zinc-500 text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}