import { Link, Route, Routes } from "react-router-dom";
import { AppMonitoringPage } from "./pages/AppMonitoringPage";
import { AppsListPage } from "./pages/AppsListPage";

const App = () => (
  <div className="min-h-screen bg-gray-50 text-gray-900">
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <Link to="/" className="text-lg font-bold text-gray-900">
          📲 App Monitor
        </Link>
        <p className="text-sm text-gray-500">
          Track competitors' Google Play &amp; App Store listings over time
        </p>
      </div>
    </header>

    <main className="mx-auto max-w-4xl px-4 py-6">
      <Routes>
        <Route path="/" element={<AppsListPage />} />
        <Route path="/apps/:id" element={<AppMonitoringPage />} />
      </Routes>
    </main>
  </div>
);

export default App;
