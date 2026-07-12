import ChatWidget from "@/components/chat/ChatWidget";

/**
 * Landing Page — Demo page showcasing the chat widget
 *
 * This represents the coaching center's website. The ChatWidget
 * is overlaid as a floating component in the bottom-right corner.
 */
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 hero-gradient" />
      <div className="fixed inset-0 grid-pattern" />

      {/* Floating orbs */}
      <div className="fixed top-20 left-[15%] w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
      <div className="fixed top-60 right-[10%] w-96 h-96 bg-purple-500/8 rounded-full blur-3xl animate-float-delayed" />
      <div className="fixed bottom-20 left-[30%] w-64 h-64 bg-violet-500/6 rounded-full blur-3xl animate-float" />

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aakar's AI Assistant
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="text-slate-800">Your Path to</span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
              IIT & AIIMS
            </span>
            <br />
            <span className="text-slate-800">Starts Here</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
            Expert coaching for{" "}
            <span className="text-blue-600 font-medium">JEE</span>,{" "}
            <span className="text-indigo-600 font-medium">NEET</span> &{" "}
            <span className="text-emerald-600 font-medium">MHT-CET</span> with
            personalized mentorship from IIT & AIIMS alumni.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-medium text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-105 active:scale-[0.98] transition-all duration-300">
              <span>Explore Courses</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
            <button className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-200 hover:border-slate-300 transition-all duration-300">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              <span>Call: +91 7499571615</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 max-w-2xl mx-auto">
            {[
              { value: "5963+", label: "Students Enrolled" },
              { value: "501+", label: "Rank Holders" },
              { value: "95%", label: "JEE Clearance" },
              { value: "4.8★", label: "Google Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center space-y-1">
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom hint */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-xs text-gray-600 flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
              />
            </svg>
            Click the chat bubble to talk to our AI Assistant
          </p>
        </div>
      </main>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
