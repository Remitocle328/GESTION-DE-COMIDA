import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    if (window.confirm('¿Deseas restablecer los datos guardados en este dispositivo para solucionar el error?')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error(e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Se produjo un problema al cargar
            </h1>
            
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Ocurrió un error inesperado al renderizar la aplicación. Puedes intentar recargar la página o restablecer los datos locales si el problema persiste.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left mb-6 text-xs text-red-700 font-mono overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Recargar página
              </button>
              
              <button
                onClick={this.handleResetData}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 font-medium rounded-xl text-sm transition-colors"
                title="Limpiar datos dañados en este navegador"
              >
                <Trash2 className="w-4 h-4" />
                Restablecer
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
