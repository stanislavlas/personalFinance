import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter as Router, Route, Routes} from "react-router";
import LoginPage from "./pages/LoginPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import AddTransactionPage from "./pages/AddTransactionPage.tsx";
import {ThemeProvider} from "@mui/material/styles";
import theme from "./styles/theme.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <ThemeProvider theme={theme}>
          <Router>
              <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/add-transaction" element={<AddTransactionPage />} />
              </Routes>
          </Router>
      </ThemeProvider>
  </StrictMode>,
)
