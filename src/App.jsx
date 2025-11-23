import { useState, useEffect } from 'react';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check for user's preference or system preference
    const storedPref = localStorage.getItem('darkMode');
    if (storedPref !== null) {
      return storedPref === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header/Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 transition-colors duration-300">
              Bhupinder Singh Gill
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="#about"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 hidden sm:inline-block"
              >
                About
              </a>
              <a
                href="#services"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 hidden sm:inline-block"
              >
                Solutions
              </a>
              <a
                href="#experience"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 hidden sm:inline-block"
              >
                Experience
              </a>
              <a
                href="#contact"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 hidden sm:inline-block"
              >
                Contact
              </a>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg
                    className="w-6 h-6 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight transition-colors duration-300">
              Empowering Families with
              <span className="block text-primary-600 dark:text-primary-400 mt-2">
                The New Art of Living
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-4 leading-relaxed max-w-2xl mx-auto transition-colors duration-300">
              Educator | Financial Freedom Expert | Community Empowerment Leader
            </p>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto transition-colors duration-300">
              Teaching North American families to achieve financial freedom
              through proven strategies for income growth, financial education,
              and self-improvement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="https://www.linkedin.com/in/moneymatterswithgill"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-center"
              >
                Connect on LinkedIn
              </a>
              <a
                href="#contact"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 transform hover:-translate-y-1 transition-all duration-300 text-center"
              >
                Get In Touch
              </a>
            </div>
          </div>
        </section>

        {/* Solutions Section - 3 Core Problems */}
        <section
          id="services"
          className="bg-white dark:bg-gray-800 py-16 sm:py-24 transition-colors duration-300"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
                The New Art of Living
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Empowering families through education and proven strategies
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
                  <svg
                    className="w-6 h-6 text-primary-600 dark:text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  Income Growth
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 transition-colors duration-300">
                  Learn to transition from "rented" income to "owned" income
                  through the Multi-Handed Income Philosophy. Create multiple
                  streams of generational income including royalties, dividends,
                  and capital gains that work for you.
                </p>
                <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold">
                  → Multi-Handed Income Philosophy
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
                  <svg
                    className="w-6 h-6 text-primary-600 dark:text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  Financial Education
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 transition-colors duration-300">
                  Master the 10% savings discipline and understand the 3 Rules
                  of Money: Compounding, Risk, and Tax Effects. Achieve the 3
                  Goals: Income Protection, Income Replacement, and Generational
                  Wealth through proven strategies.
                </p>
                <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold">
                  → The 10% - 3 Rules - 3 Goals
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
                  <svg
                    className="w-6 h-6 text-primary-600 dark:text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  Self Improvement
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 transition-colors duration-300">
                  Create an environment to realize your true potential and
                  cultivate a winning spirit. Personal growth and mindset
                  development are the foundations of lasting financial success
                  and a world-class lifestyle.
                </p>
                <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold">
                  → Self-Improvement Philosophy
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 text-center transition-colors duration-300">
                About Me
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-12 transition-colors duration-300">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
                    My Mission as an Educator
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4 transition-colors duration-300">
                    As an educator, I am dedicated to empowering North American
                    families through
                    <strong> "The New Art of Living"</strong> — a transformative
                    educational approach that solves the core problems families
                    face today: lack of income growth, insufficient financial
                    education, and limited self-improvement opportunities.
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
                    Three Core Philosophies
                  </h3>

                  <div className="space-y-6">
                    <div className="border-l-4 border-primary-600 dark:border-primary-400 pl-6">
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                        1. Multi-Handed Income Philosophy
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                        Shift from "rented" income (salary, commission) to
                        "owned" income (royalty, dividend, capital gains).
                        Create multiple streams of generational income that work
                        for you.
                      </p>
                    </div>

                    <div className="border-l-4 border-primary-600 dark:border-primary-400 pl-6">
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                        2. The 10% - 3 Rules - 3 Goals
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                        Master the discipline of saving 10%, apply the 3 Rules
                        of Money (Compounding, Risk, and Tax Effects), and
                        achieve the 3 Goals: Income Protection, Income
                        Replacement, and Generational Wealth.
                      </p>
                    </div>

                    <div className="border-l-4 border-primary-600 dark:border-primary-400 pl-6">
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                        3. Self-Improvement Philosophy
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                        Create an environment to realize your true potential and
                        cultivate a winning spirit. Personal growth is the
                        foundation of lasting financial success.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
                    My Commitment to Your Success
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                    Through educational workshops, one-on-one mentorship, and
                    community building, I teach families how money works, how to
                    multiply their income, and how to achieve a debt-free,
                    world-class lifestyle. Every family deserves access to
                    quality financial education and the proven strategies that
                    create lasting wealth and freedom.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section
          id="experience"
          className="bg-white dark:bg-gray-800 py-16 sm:py-24 transition-colors duration-300"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center transition-colors duration-300">
                Professional Experience
              </h2>

              <div className="space-y-8">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-sm transition-colors duration-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                        Financial Educator & Community Leader
                      </h3>
                      <p className="text-primary-600 dark:text-primary-400 font-semibold">
                        Independent Business Owner - World Financial Group (WFG)
                      </p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 sm:mt-0">
                      Apr 2022 – Present
                    </p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Educating families on Income Growth, Financial Education,
                    and Self-Improvement through interactive workshops,
                    personalized mentorship, and community events. Teaching
                    proven strategies based on The New Art of Living
                    philosophies to help families achieve financial independence
                    and generational wealth.
                  </p>
                </div>

        {/* Contact Section */}
        <section
          id="contact"
          className="py-16 sm:py-24 transition-colors duration-300"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
                Start Your Learning Journey
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 transition-colors duration-300">
                Ready to learn the strategies that lead to financial freedom?
                Connect with me to discover how The New Art of Living can
                transform your family's future.
              </p>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 transition-colors duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <svg
                      className="w-6 h-6 text-primary-600 dark:text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300">
                      Mission, British Columbia, Canada
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-3">
                    <svg
                      className="w-6 h-6 text-primary-600 dark:text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300">
                      Independent Business Owner - World Financial Group (WFG)
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-3">
                    <svg
                      className="w-6 h-6 text-primary-600 dark:text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300">
                      500+ Connections | 5,465 Followers
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="https://www.linkedin.com/in/moneymatterswithgill"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              Bhupinder Singh Gill
            </h3>
            <p className="text-gray-400 mb-4">
              Empowering families with "The New Art of Living"
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 Bhupinder Singh Gill. All rights reserved. | Built with
              React & Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
