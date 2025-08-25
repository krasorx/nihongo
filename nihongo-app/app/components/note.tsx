'use client';
import React, { useState } from 'react';

interface NoteProps {
  japanese: string;
  furigana: string;
  translation: string;
}

const Note = ({ japanese, furigana, translation }: NoteProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-blue-300 cursor-pointer">{japanese}</span>
      {isHovered && (
        <div className="absolute z-10 p-4 bg-gray-800 text-white rounded-lg shadow-lg max-w-96 -translate-x-1/4 left-1/2 bottom-full mb-2 whitespace-nowrap">
          <div>{furigana}; {translation}</div>
        </div>
      )}
    </div>
  );
};

export default Note;