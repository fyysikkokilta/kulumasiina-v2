import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./index.css";
import "./i18n";
import { ConfigProvider } from "antd";
import fiFI from "antd/es/locale/fi_FI";
import enUS from "antd/es/locale/en_US";
import { useTranslation } from "react-i18next";

const container = document.getElementById("root");
if (!container) throw new Error("Could not find root element");
const root = createRoot(container);

const LocalizedApp = () => {
  const { i18n } = useTranslation();
  return (
    <ConfigProvider locale={i18n.language === "fi" ? fiFI : enUS}>
      <App />
    </ConfigProvider>
  );
};

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Suspense fallback="loading">
        <LocalizedApp />
      </Suspense>
    </Provider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
