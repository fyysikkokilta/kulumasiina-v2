import React from "react";
import { PropsWithChildren } from "react";
import { ExpenseForm } from "./features/form/ExpenseForm";
import { AdminEntryView } from "./features/admin/EntryView";
import { Row, Col, Typography, Divider, ColProps } from "antd";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { LoginCallback } from "./features/login/LoginRedirect";

const Header = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      <Typography.Title level={1}>FK-Expenses</Typography.Title>
      <div>
        <Typography.Text>FI </Typography.Text>/
        <Typography.Text strong> EN</Typography.Text>
      </div>
    </div>
  );
};

type WidthMap = { [key: string]: ColProps };

const widths: WidthMap = {
  narrow: {
    xl: {
      span: 12,
      offset: 6,
    },
    lg: {
      span: 16,
      offset: 4,
    },
    md: {
      span: 22,
      offset: 1,
    },
    sm: {
      span: 24,
      offset: 0,
    },
  },
  wide: {
    xl: {
      span: 16,
      offset: 4,
    },
    lg: {
      span: 20,
      offset: 2,
    },
    md: {
      span: 22,
      offset: 1,
    },
    sm: {
      span: 24,
      offset: 0,
    },
  },
};

type ContainerProps = PropsWithChildren & {
  widths: ColProps;
};

const Container: React.FC<ContainerProps> = ({ children, widths }) => {
  return (
    <Row
      style={{
        minHeight: "100vh",
        maxWidth: "1600px",
        margin: "auto",
        paddingLeft: "8px",
        paddingRight: "8px",
      }}
    >
      <Col {...widths} className="main-column">
        <Header />
        <Divider />
        <div className="grower">{children}</div>
        {/* <Divider /> */}
        {/* <Footer /> */}
      </Col>
    </Row>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Container widths={widths.narrow}>
        <ExpenseForm />
      </Container>
    ),
  },
  {
    path: "/admin",
    element: (
      <Container widths={widths.wide}>
        <AdminEntryView />
      </Container>
    ),
  },
  {path:
    "/login/callback",
    element: <LoginCallback />,
    
  }
]);

function App() {
  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
