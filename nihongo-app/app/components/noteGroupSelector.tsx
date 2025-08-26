'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hash } from 'crypto';

interface NoteGroupSelector {
  endpoint: string;
}

const NoteGroupSelector: React.FC<NoteGroupSelector> = ({ endpoint }) => {
  const [groups, setGroups] = useState([]);
  const router = useRouter();

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${endpoint}/../note-groups`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        console.error('Failed to fetch note groups');
      }
    } catch (error) {
      console.error('Error fetching note groups:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [endpoint]);

  const handleSelectGroup = (hashId: Hash) => {
    router.push(`/notes/${hashId}`);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Note Groups</h2>
      {groups.length === 0 ? (
        <p>No note groups available. Create one in the note form.</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((hashId) => (
            <li key={hashId}>
              <button
                onClick={() => handleSelectGroup(hashId)}
                className="w-full text-left bg-gray-100 p-2 rounded-md hover:bg-gray-200"
              >
                Group: {hashId}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NoteGroupSelector;