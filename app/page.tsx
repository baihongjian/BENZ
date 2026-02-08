import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">BENZ 学习平台</h1>
      <div className="flex justify-center gap-4">
        <Link
          href="/02-edu/001-language"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          德语学习
        </Link>
      </div>
    </main>
  );
}
