import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { Catalog } from "./pages/Catalog";
import { ListingDetail } from "./pages/ListingDetail";
import { Auth } from "./pages/Auth";
import { Profile } from "./pages/Profile";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-bg text-text-primary">
          <Header />
          <main className="max-w-[1600px] mx-auto px-6 py-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              {/* Добавь остальные роуты */}
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
