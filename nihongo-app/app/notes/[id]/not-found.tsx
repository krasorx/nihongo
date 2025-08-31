import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-semibold text-gray-900">404 - Note Group Not Found</h1>
      <p className="mt-4 text-lg text-gray-600">The note group you’re looking for doesn’t exist or has expired.</p>
      <Link href="/notes/create" className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Create a New Note Group
      </Link>
    </div>
  );
}