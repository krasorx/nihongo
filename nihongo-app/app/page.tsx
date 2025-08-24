import Image from "next/image";
import Link from 'next/link'
import React from "react";
import NotesBtn from './components/notesBtn'

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
