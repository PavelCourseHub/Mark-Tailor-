import React from 'react';

const PlaceholderImage = ({ width, height, text = 'Нет изображения' }) => {
  return (
    <div 
      style={{ 
        width: '100%',
        height: '100%',
        minHeight: `${height}px`,
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '14px',
        fontFamily: 'sans-serif'
      }}
    >
      {text}
    </div>
  );
};

export default PlaceholderImage;