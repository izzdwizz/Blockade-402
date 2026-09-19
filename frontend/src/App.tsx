import { PrivyProvider } from "@privy-io/react-auth";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Product } from "./pages/Product";
import { PRIVY_APP_ID, privyConfig } from "./privy";
import "./ui/kit.css";

function App() {
  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/product" element={<Product />} />
        </Routes>
      </BrowserRouter>
    </PrivyProvider>
  );
}

export default App;
