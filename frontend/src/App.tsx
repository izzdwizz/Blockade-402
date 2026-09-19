import { PrivyProvider } from "@privy-io/react-auth";
import { PayAndAsk } from "./PayAndAsk";
import { PRIVY_APP_ID, privyConfig } from "./privy";
import "./App.css";

function App() {
  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <main>
        <h1>Arc LLM Paywall</h1>
        <p>Pay a few cents in USDC on Arc to get one AI response.</p>
        <PayAndAsk />
      </main>
    </PrivyProvider>
  );
}

export default App;
