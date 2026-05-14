import React from 'react';

const LoadingSpinner = ({ size = 32, fullPage = false }) => {
  const spinnerStyle = {
    width: size,
    height: size,
    border: '2px solid var(--border-2)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    width: '100%',
    flexGrow: 1
  };

  const spinner = (
    <div style={spinnerStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  if (fullPage) {
    return (
      <div style={containerStyle}>
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
