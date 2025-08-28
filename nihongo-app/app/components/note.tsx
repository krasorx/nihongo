'use client';
import React, { useState } from 'react';

interface NoteProps {
  japanese: string;
  furigana: string;
  translation: string;
}

const colors = ['#287eb8', '#284cb8', '#28a7b8'];

const Note = ({ japanese, furigana, translation }: NoteProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const coloredChars = japanese.split('').map((char, idx) => (
    <span key={idx} style={{ color: colors[idx % colors.length] }}>
      {char}
    </span>
  ));

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-blue-300 cursor-pointer">{coloredChars}</span>
      {isHovered && (
        <div className="absolute z-10 p-4 bg-gray-800 text-white rounded-lg shadow-lg  -translate-x-1/4 left-1/2 bottom-full mb-2 whitespace-nowrap">
          <div>{furigana}; {translation}</div>
        </div>
      )}
    </div>
  );
};

export default Note;