'use client';

import React, { useState } from 'react';
import { redisApi } from '../utils/api';

interface GroupTranslationProps {
  groupId: string;
  translation: string | null;
  isEditing: boolean;
  onUpdate: (newTranslation: string) => Promise<void>;
}

const GroupTranslation: React.FC<GroupTranslationProps> = ({ groupId, translation, isEditing, onUpdate }) => {
  const [editTranslation, setEditTranslation] = useState(translation || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onUpdate(editTranslation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update translation');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return translation ? (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900">Group Translation</h3>
        <p className="text-blue-800">{translation}</p>
      </div>
    ) : null;
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h3 className="text-lg font-medium text-blue-900 mb-2">Edit Group Translation</h3>
      <textarea
        value={editTranslation}
        onChange={(e) => setEditTranslation(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        rows={4}
        placeholder="Enter group translation..."
      />
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Translation'}
        </button>
      </div>
    </div>
  );
};

export default GroupTranslation;