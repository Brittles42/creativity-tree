import HeartTree from "@/components/HeartTree"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-pink-100 to-purple-100">
      <h1 className="text-4xl font-bold text-purple-800 mb-8">Heart-Shaped Decision Tree</h1>
      <HeartTree />
    </main>
  )
}

