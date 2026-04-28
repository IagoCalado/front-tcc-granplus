import React from 'react';

export default function BorderBeam({ children }) {
  return (
    <div className="border-beam-wrapper">
      {/* Esta div é a máscara vazada que segura o raio */}
      <div className="border-beam-glow"></div>
      
      {/* O seu auth-card (formulário) vai entrar aqui */}
      <div className="border-beam-content">
        {children}
      </div>
    </div>
  );
}