import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, scrollToTop = true }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handlePageChange = (newPage) => {
    if (newPage === currentPage) return;
    if (newPage < 1 || newPage > totalPages) return;
    
    onPageChange(newPage);
    
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {/* Первая страница */}
      <button
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        ⟪
      </button>
      
      {/* Предыдущая */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        ←
      </button>
      
      {/* Номера страниц */}
      {getPageNumbers().map(page => (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-3 py-2 min-w-[40px] border rounded-md transition ${
            currentPage === page 
              ? 'bg-black text-white border-black' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      
      {/* Следующая */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        →
      </button>
      
      {/* Последняя страница */}
      <button
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        ⟫
      </button>
    </div>
  );
};

export default Pagination;