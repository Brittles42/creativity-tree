import HeartTree from "@/components/HeartTree"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 z-[-10]">
      <div className="absolute top-[10%] left-[5%] w-[450px] h-[150px] rounded-full bg-purple-500 blur-[10em] z-[-10]"></div>
      <div className="absolute top-[50%] left-[80%] w-[220px] h-[120px] rounded-full bg-pink-500 blur-[17em] z-[-10]"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[380px] h-[180px] rounded-full bg-blue-500 blur-[12em] z-[-10]"></div>
      <div className="absolute top-[80%] left-[30%] w-[300px] h-[100px] rounded-full bg-red-500 blur-[12em] z-[-10]"></div>
      <div className="absolute bottom-[5%] right-[50%] w-[230px] h-[130px] rounded-full bg-green-500 blur-[12em] z-[-10]"></div>
      <h1 className="text-7xl font-bold text-purple-800 mb-8">Nodethis</h1>
      <HeartTree />
    </main>
  )
}

