import { PrivyProvider } from "@privy-io/react-auth";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ChatTile } from "./components/tools/ChatTile";
import { IbanTool } from "./components/tools/IbanTool";
import { OcrTool } from "./components/tools/OcrTool";
import { QrTool } from "./components/tools/QrTool";
import { TileGrid } from "./components/TileGrid";
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
          <Route path="/product" element={<Product />}>
            <Route index element={<TileGrid />} />
            <Route path="chat" element={<ChatTile />} />
            <Route path="ocr" element={<OcrTool />} />
            <Route path="qr" element={<QrTool />} />
            <Route path="iban" element={<IbanTool />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PrivyProvider>
  );
}

export default App;
