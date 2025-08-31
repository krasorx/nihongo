import Image from "next/image";
import Link from 'next/link'
import React from "react";
import NotesBtn from './components/notesBtn';
import CreateNote from './components/createNote';
import { useAuth } from './contexts/AuthContext';

interface NoteGroupPage {
  hashId: string;
  endpoint: string;
}
/*
<EditNoteModal
          note={editingNote}
          onClose={() => setEditingNote(undefined)}
          onSave={handleSaveNote}
        />
*/
export default function Home() {
  return (
    <main>
      <h1 className="p-5">Nihongo APP</h1>
      <div className='p-5'>
        <Link href="users">Usuarios</Link>
      </div>
      <div>
        <NotesBtn />
        
      </div>
    </main>
  );
}
