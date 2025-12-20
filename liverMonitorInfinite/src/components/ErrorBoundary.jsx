import { Button, Result } from 'antd';
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
          <Result
            status="500"
            title="Algo Deu Errado"
            subTitle="Ocorreu um erro inesperado na aplicação."
            extra={
              <Button type="primary" onClick={() => window.location.reload()}>
                Recarregar Página
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
